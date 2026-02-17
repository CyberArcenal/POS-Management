// src/services/SaleStateTransitionService.js
//@ts-check
const Product = require("../entities/Product");
const Customer = require("../entities/Customer");
const InventoryMovement = require("../entities/InventoryMovement");
const LoyaltyTransaction = require("../entities/LoyaltyTransaction");
const auditLogger = require("../utils/auditLogger");
const Sale = require("../entities/Sale");
const { SystemSetting } = require("../entities/systemSettings");
const PrinterService = require("../services/PrinterService");
const CashDrawerService = require("../services/CashDrawerService");

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
    // @ts-ignore
    console.log(`[Transition] Processing paid sale #${sale.id}`);

    // Audit sale status change
    await auditLogger.logUpdate(
      "Sale",
      // @ts-ignore
      sale.id,
      { status: "initiated" },
      { status: "paid" },
      "system",
    );

    // 1. Decrease stock for each sold item
    // @ts-ignore
    for (const item of sale.saleItems) {
      const product = item.product;
      const oldStock = product.stockQty;
      product.stockQty -= item.quantity;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      const movement = this.movementRepo.create({
        movementType: "sale",
        qtyChange: -item.quantity,
        // @ts-ignore
        notes: `Sale #${sale.id}`,
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

    // 2. Handle loyalty points
    // @ts-ignore
    if (sale.customer) {
      const rateSetting = await this.dataSource
        .getRepository(SystemSetting)
        .findOne({
          where: { key: "loyalty_points_rate", setting_type: "sales" },
        });
      const rate = rateSetting ? parseInt(rateSetting.value, 10) : 20; // default 20 currency per point

      // @ts-ignore
      const subtotal = sale.saleItems.reduce(
        (
          /** @type {number} */ sum,
          /** @type {{ unitPrice: number; quantity: number; }} */ item,
        ) => sum + item.unitPrice * item.quantity,
        0,
      );
      const pointsEarned = Math.floor(subtotal / rate);

      if (pointsEarned > 0) {
        const customer = await this.customerRepo.findOne({
          // @ts-ignore
          where: { id: sale.customer.id },
        });
        if (customer) {
          const oldBalance = customer.loyaltyPointsBalance;
          customer.loyaltyPointsBalance += pointsEarned;
          customer.updatedAt = new Date();
          await updateDb(this.customerRepo, customer);

          const loyaltyTx = this.loyaltyRepo.create({
            pointsChange: pointsEarned,
            // @ts-ignore
            notes: `Sale #${sale.id}`,
            customer,
            sale,
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

    // 3. Print receipt
    const printer = new PrinterService(); // or inject driver
    await printer.printReceipt(sale);

    // 4. Open cash drawer (only for cash payments)
    // @ts-ignore
    if (sale.paymentMethod === "cash") {
      const drawer = new CashDrawerService(); // or inject driver
      await drawer.openDrawer("sale");
    }

    // @ts-ignore
    console.log(`[Transition] Completed paid sale #${sale.id}`);
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
}

module.exports = { SaleStateTransitionService };
