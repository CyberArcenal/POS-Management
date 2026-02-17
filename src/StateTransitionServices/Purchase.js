// src/services/PurchaseStateTransitionService.js
//@ts-check
const Product = require("../entities/Product");
const InventoryMovement = require("../entities/InventoryMovement");
const auditLogger = require("../utils/auditLogger");


class PurchaseStateTransitionService {
  /**
     * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; sku: unknown; name: unknown; description: unknown; price: unknown; stockQty: unknown; reorderLevel: unknown; reorderQty: unknown; isActive: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; movementType: unknown; qtyChange: unknown; timestamp: unknown; notes: unknown; updatedAt: unknown; }>) => any; }} dataSource
     */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.productRepo = dataSource.getRepository(Product);
    this.movementRepo = dataSource.getRepository(InventoryMovement);
  }

  /**
   * Handle side effects when a purchase is completed (stock increase, inventory movement)
   * @param {Object} purchase - Full purchase entity with items, product, supplier relations
   * @param {string} user
   */
  async onComplete(purchase, user = "system") {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Completing purchase #${purchase.id}`);

    // @ts-ignore
    for (const item of purchase.purchaseItems) {
      const product = item.product;
      const oldStock = product.stockQty;
      const newStock = oldStock + item.quantity;

      product.stockQty = newStock;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      // Inventory movement – we'll use movementType 'purchase' (assume added to enum) or 'adjustment'
      const movement = this.movementRepo.create({
        movementType: "purchase", // ensure this value exists in the enum of InventoryMovement
        qtyChange: item.quantity,
        // @ts-ignore
        notes: `Purchase #${purchase.id} - ${purchase.referenceNo}`,
        product,
        timestamp: new Date(),
        // If InventoryMovement has a purchase relation, add it; otherwise omit.
        // purchase: purchase, // uncomment if relation exists
      });
      await saveDb(this.movementRepo, movement);

      await auditLogger.logUpdate(
        "Product",
        product.id,
        { stockQty: oldStock },
        { stockQty: newStock },
        user
      );
      await auditLogger.logCreate("InventoryMovement", movement.id, movement, user);
    }

    // @ts-ignore
    console.log(`[Transition] Completed purchase #${purchase.id}`);
  }

  /**
   * Handle side effects when a purchase is cancelled
   * If it was previously completed, reverse the stock (subtract)
   * @param {Object} purchase - Full purchase entity
   * @param {string} oldStatus - Previous status
   * @param {string} user
   */
  async onCancel(purchase, oldStatus, user = "system") {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Cancelling purchase #${purchase.id}, old status: ${oldStatus}`);

    if (oldStatus === "completed") {
      // @ts-ignore
      for (const item of purchase.purchaseItems) {
        const product = item.product;
        const oldStock = product.stockQty;
        const newStock = oldStock - item.quantity;

        product.stockQty = newStock;
        product.updatedAt = new Date();
        await updateDb(this.productRepo, product);

        const movement = this.movementRepo.create({
          movementType: "adjustment",
          qtyChange: -item.quantity,
          // @ts-ignore
          notes: `Cancelled purchase #${purchase.id} - reversal of completed purchase`,
          product,
          timestamp: new Date(),
        });
        await saveDb(this.movementRepo, movement);

        await auditLogger.logUpdate(
          "Product",
          product.id,
          { stockQty: oldStock },
          { stockQty: newStock },
          user
        );
        await auditLogger.logCreate("InventoryMovement", movement.id, movement, user);
      }
    }
    // If it was pending, no stock change needed
    // @ts-ignore
    console.log(`[Transition] Completed cancellation of purchase #${purchase.id}`);
  }
}

module.exports = { PurchaseStateTransitionService };