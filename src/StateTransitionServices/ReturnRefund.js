// src/services/ReturnRefundStateTransitionService.js
//@ts-check
const Product = require("../entities/Product");
const InventoryMovement = require("../entities/InventoryMovement");
const auditLogger = require("../utils/auditLogger");


class ReturnRefundStateTransitionService {
  /**
     * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; sku: unknown; name: unknown; description: unknown; price: unknown; stockQty: unknown; reorderLevel: unknown; reorderQty: unknown; isActive: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; movementType: unknown; qtyChange: unknown; timestamp: unknown; notes: unknown; updatedAt: unknown; }>) => any; }} dataSource
     */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.productRepo = dataSource.getRepository(Product);
    this.movementRepo = dataSource.getRepository(InventoryMovement);
  }

  /**
   * Handle side effects when a return is processed (stock increase, inventory movement)
   * @param {Object} returnRefund - Full return entity with items, product, sale relations
   * @param {string} user
   */
  async onProcess(returnRefund, user = "system") {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Processing return #${returnRefund.id}`);

    // @ts-ignore
    for (const item of returnRefund.items) {
      const product = item.product;
      const oldStock = product.stockQty;
      const newStock = oldStock + item.quantity;

      product.stockQty = newStock;
      product.updatedAt = new Date();
      await updateDb(this.productRepo, product);

      const movement = this.movementRepo.create({
        movementType: "refund",
        qtyChange: item.quantity,
        // @ts-ignore
        notes: `Return #${returnRefund.id} - ${returnRefund.referenceNo}`,
        product,
        // @ts-ignore
        sale: returnRefund.sale,
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

    // @ts-ignore
    console.log(`[Transition] Completed return #${returnRefund.id}`);
  }

  /**
   * Handle side effects when a return is cancelled
   * If it was previously processed, reverse the stock (subtract)
   * @param {Object} returnRefund - Full return entity
   * @param {string} oldStatus - Previous status
   * @param {string} user
   */
  async onCancel(returnRefund, oldStatus, user = "system") {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    console.log(`[Transition] Cancelling return #${returnRefund.id}, old status: ${oldStatus}`);

    if (oldStatus === "processed") {
      // @ts-ignore
      for (const item of returnRefund.items) {
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
          notes: `Cancelled return #${returnRefund.id} - reversal of processed return`,
          product,
          // @ts-ignore
          sale: returnRefund.sale,
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
    console.log(`[Transition] Completed cancellation of return #${returnRefund.id}`);
  }
}

module.exports = { ReturnRefundStateTransitionService };