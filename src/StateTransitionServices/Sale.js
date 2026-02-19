// src/services/SaleStateTransitionService.js
//@ts-check
const Product = require("../entities/Product");
const Customer = require("../entities/Customer");
const InventoryMovement = require("../entities/InventoryMovement");
const LoyaltyTransaction = require("../entities/LoyaltyTransaction");
const auditLogger = require("../utils/auditLogger");
const Sale = require("../entities/Sale");
// @ts-ignore
const { SystemSetting, SettingType } = require("../entities/systemSettings");
const PrinterService = require("../services/PrinterService");
const CashDrawerService = require("../services/CashDrawerService");
const PurchaseItem = require("../entities/PurchaseItem");
const Purchase = require("../entities/Purchase");
const { getLoyaltyPointRate } = require("../utils/system");

class SaleStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; sku: unknown; name: unknown; description: unknown; price: unknown; stockQty: unknown; reorderLevel: unknown; reorderQty: unknown; isActive: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; name: unknown; contactInfo: unknown; loyaltyPointsBalance: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; movementType: unknown; qtyChange: unknown; timestamp: unknown; notes: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; pointsChange: unknown; timestamp: unknown; notes: unknown; updatedAt: unknown; }>) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.productRepo = dataSource.getRepository(Product);
    this.customerRepo = dataSource.getRepository(Customer);
    this.movementRepo = dataSource.getRepository(InventoryMovement);
    this.loyaltyRepo = dataSource.getRepository(LoyaltyTransaction);
  }

  /**
   * Handle side effects when a sale becomes 'paid'
   * @param {Sale} sale - The sale entity (already persisted)
   */
  async onPay(sale) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    const saleRepo = this.dataSource.getRepository(Sale);

    // Reload sale with items and products
    const hydratedSale = await saleRepo.findOne({
      // @ts-ignore
      where: { id: sale.id },
      relations: ["saleItems", "saleItems.product", "customer"],
    });

    if (!hydratedSale) {
      // @ts-ignore
      throw new Error(`Sale #${sale.id} not found for hydration`);
    }

    console.log(`[Transition] Processing paid sale #${hydratedSale.id}`);

    // Audit sale status change
    await auditLogger.logUpdate(
      "Sale",
      hydratedSale.id,
      { status: "initiated" },
      { status: "paid" },
      "system",
    );

    // 1. Decrease stock for each sold item
    for (const item of hydratedSale.saleItems) {
      const product = item.product;
      const oldStock = product.stockQty;
      product.stockQty -= item.quantity;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      const movement = this.movementRepo.create({
        movementType: "sale",
        qtyChange: -item.quantity,
        notes: `Sale #${hydratedSale.id}`,
        product,
        sale: hydratedSale,
        timestamp: new Date(),
      });
      await saveDb(this.movementRepo, movement);

      await auditLogger.logUpdate(
        "Product",
        product.id,
        { stockQty: oldStock },
        { stockQty: product.stockQty },
        "system",
      );
    }

    // 2. Handle loyalty points
    if (hydratedSale.customer) {
      const rate = await getLoyaltyPointRate();
      const subtotal = hydratedSale.saleItems.reduce(
        // @ts-ignore
        (sum, item) => sum + item.lineTotal,
        0,
      );

      // Only earn points on net cash portion
      const netCashSpend = subtotal - hydratedSale.loyaltyRedeemed;
      const pointsEarned = Math.floor(netCashSpend / rate);

      if (pointsEarned > 0) {
        const customer = await this.customerRepo.findOne({
          where: { id: hydratedSale.customer.id },
        });
        if (customer) {
          const oldBalance = customer.loyaltyPointsBalance;
          customer.loyaltyPointsBalance += pointsEarned;
          customer.updatedAt = new Date();
          await updateDb(this.customerRepo, customer);

          const loyaltyTx = this.loyaltyRepo.create({
            pointsChange: pointsEarned,
            transactionType: "earn",
            notes: `Sale #${hydratedSale.id}`,
            customer,
            sale: hydratedSale,
            timestamp: new Date(),
          });
          await saveDb(this.loyaltyRepo, loyaltyTx);

          await auditLogger.logUpdate(
            "Customer",
            customer.id,
            { loyaltyPointsBalance: oldBalance },
            { loyaltyPointsBalance: customer.loyaltyPointsBalance },
            "system",
          );
        }
      }
    }

    // 3. check and deduct loyalty
    await this.checkAndDeductLoyalty(hydratedSale);

    // 3. Print receipt
    try {
      const printer = new PrinterService();
      await printer.printReceipt(hydratedSale.id);

      // @ts-ignore
      await auditLogger.log({
        action: "EVENT",
        entity: "Printer",
        entityId: hydratedSale.id,
        description: "Receipt printed successfully",
        user: "system",
      });
    } catch (err) {
      // @ts-ignore
      await auditLogger.log({
        action: "EVENT",
        entity: "Printer",
        entityId: hydratedSale.id,
        // @ts-ignore
        description: `Receipt print failed: ${err.message}`,
        user: "system",
      });
    }

    // 4. Open cash drawer (only for cash payments)
    try {
      if (hydratedSale.paymentMethod === "cash") {
        const drawer = new CashDrawerService();
        await drawer.openDrawer("sale");

        // @ts-ignore
        await auditLogger.log({
          action: "EVENT",
          entity: "CashDrawer",
          entityId: hydratedSale.id,
          description: "Cash drawer opened successfully",
          user: "system",
        });
      }
    } catch (err) {
      // @ts-ignore
      await auditLogger.log({
        action: "EVENT",
        entity: "CashDrawer",
        entityId: hydratedSale.id,
        // @ts-ignore
        description: `Cash drawer open failed: ${err.message}`,
        user: "system",
      });
    }

    console.log(`[Transition] Completed paid sale #${hydratedSale.id}`);
  }

  /**
   * Handle side effects when a sale is refunded
   * @param {Sale} sale
   */
  async onRefund(sale) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Processing refunded sale #${sale.id}`);

    // 1. Restore stock for each sold item
    // @ts-ignore
    for (const item of sale.saleItems) {
      const product = item.product;
      const oldStock = product.stockQty;
      product.stockQty += item.quantity;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      const movement = this.movementRepo.create({
        movementType: "refund",
        qtyChange: item.quantity,
        // @ts-ignore
        notes: `Refund sale #${sale.id}`,
        product,
        sale,
        timestamp: new Date(),
      });
      await saveDb(this.movementRepo, movement);

      await auditLogger.logUpdate(
        "Product",
        product.id,
        { stockQty: oldStock },
        { stockQty: product.stockQty },
        "system",
      );
    }

    // 2. Reverse loyalty points if any
    // @ts-ignore
    if (sale.customer) {
      const loyaltyTxs = await this.loyaltyRepo.find({
        // @ts-ignore
        where: { sale: { id: sale.id } },
      });
      for (const tx of loyaltyTxs) {
        const customer = await this.customerRepo.findOne({
          // @ts-ignore
          where: { id: sale.customer.id },
        });
        if (customer) {
          const oldBalance = customer.loyaltyPointsBalance;
          customer.loyaltyPointsBalance -= tx.pointsChange;
          customer.updatedAt = new Date();
          await updateDb(this.customerRepo, customer);

          // Record reversal
          const reversal = this.loyaltyRepo.create({
            pointsChange: -tx.pointsChange,
            transactionType: "refund",
            // @ts-ignore
            notes: `Reversal of refunded sale #${sale.id}`,
            customer,
            sale,
            timestamp: new Date(),
          });
          await saveDb(this.loyaltyRepo, reversal);

          await auditLogger.logUpdate(
            "Customer",
            customer.id,
            { loyaltyPointsBalance: oldBalance },
            { loyaltyPointsBalance: customer.loyaltyPointsBalance },
            "system",
          );
        }
      }
    }

    // @ts-ignore
    console.log(`[Transition] Completed refunded sale #${sale.id}`);
  }

  /**
   * Handle side effects when a sale is voided/cancelled
   * @param {Sale} sale
   */
  async onCancel(sale) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Processing voided sale #${sale.id}`);

    // Same as refund but with movementType = "adjustment" and no loyalty reversal?
    // For void, we restore stock and record adjustment.
    // @ts-ignore
    for (const item of sale.saleItems) {
      const product = item.product;
      const oldStock = product.stockQty;
      product.stockQty += item.quantity;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      const movement = this.movementRepo.create({
        movementType: "adjustment",
        qtyChange: item.quantity,
        // @ts-ignore
        notes: `Void sale #${sale.id}`,
        product,
        sale,
        timestamp: new Date(),
      });
      await saveDb(this.movementRepo, movement);

      await auditLogger.logUpdate(
        "Product",
        product.id,
        { stockQty: oldStock },
        { stockQty: product.stockQty },
        "system",
      );
    }

    // Reverse loyalty if any (similar to refund)
    // @ts-ignore
    if (sale.customer) {
      // same as refund logic
    }

    // @ts-ignore
    console.log(`[Transition] Completed voided sale #${sale.id}`);
  }

  /**
   * @param {{ supplier: any; reorderLevel: number; reorderQty: number; stockQty: number; id: any; price: any; sku: any; }} product
   */
  async reOrder(product) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // 1b. Auto-create purchase if stock reaches reorder level
    try {
      const purchaseRepo = this.dataSource.getRepository(Purchase);
      const purchaseItemRepo = this.dataSource.getRepository(PurchaseItem);

      // Only proceed if product has a supplier, reorderLevel > 0, and reorderQty > 0
      if (
        product.supplier &&
        product.reorderLevel > 0 &&
        product.reorderQty > 0 &&
        product.stockQty <= product.reorderLevel
      ) {
        // Check if there's already a pending purchase for this product
        const existingPending = await purchaseRepo
          .createQueryBuilder("purchase")
          .innerJoin("purchase.purchaseItems", "item")
          .where("purchase.status = :status", { status: "pending" })
          .andWhere("item.productId = :productId", { productId: product.id })
          .getOne();

        if (!existingPending) {
          // Generate a simple reference number (you may replace with a more robust generator)
          const referenceNo = `PO-${Date.now()}-${product.id}`;

          // Create purchase entity
          const purchase = purchaseRepo.create({
            referenceNo,
            supplier: product.supplier,
            status: "pending",
            orderDate: new Date(),
            totalAmount: 0, // will update after item is added
          });

          // Save purchase first to get an ID
          const savedPurchase = await saveDb(purchaseRepo, purchase);

          // Create purchase item
          const unitPrice = product.price; // using current selling price; adjust if you have cost price
          const subtotal = unitPrice * product.reorderQty;

          const purchaseItem = purchaseItemRepo.create({
            quantity: product.reorderQty,
            unitPrice,
            subtotal,
            purchase: savedPurchase,
            product,
          });

          await saveDb(purchaseItemRepo, purchaseItem);

          // Update purchase totalAmount
          savedPurchase.totalAmount = subtotal;
          await updateDb(purchaseRepo, savedPurchase);

          console.log(
            `[AutoPurchase] Created purchase #${savedPurchase.id} for product ${product.sku} (Qty: ${product.reorderQty})`,
          );
        } else {
          console.log(
            `[AutoPurchase] Pending purchase already exists for product ${product.sku}, skipping.`,
          );
        }
      }
    } catch (purchaseError) {
      // Log error but do not interrupt the sale transition
      console.error(
        `[AutoPurchase] Failed to create purchase for product ${product.id}:`,
        purchaseError,
      );
      // @ts-ignore
      throw new Error("Unable To Create Order.");
      // Optionally: report to error tracking service
    }
  }

  /**
   * @param {{ usedLoyalty: any; loyaltyRedeemed: number; customer: { id: any; }; id: any; }} hydratedSale
   */
  async checkAndDeductLoyalty(hydratedSale) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    if (hydratedSale.usedLoyalty && hydratedSale.loyaltyRedeemed > 0) {
      const customer = await this.customerRepo.findOne({
        where: { id: hydratedSale.customer.id },
      });
      if (customer) {
        const oldBalance = customer.loyaltyPointsBalance;
        customer.loyaltyPointsBalance -= hydratedSale.loyaltyRedeemed;
        await updateDb(this.customerRepo, customer);

        const loyaltyTx = this.loyaltyRepo.create({
          pointsChange: -hydratedSale.loyaltyRedeemed,
          transactionType: "redeem",
          notes: `Redeemed on Sale #${hydratedSale.id}`,
          customer,
          sale: hydratedSale,
          timestamp: new Date(),
        });
        await saveDb(this.loyaltyRepo, loyaltyTx);

        await auditLogger.logUpdate(
          "Customer",
          customer.id,
          { loyaltyPointsBalance: oldBalance },
          { loyaltyPointsBalance: customer.loyaltyPointsBalance },
          "system",
        );
      }
    }
  }
}

module.exports = { SaleStateTransitionService };
