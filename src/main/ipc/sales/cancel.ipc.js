// sales/cancel.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const Product = require("../../../entities/Product");
const { InventoryAction } = require("../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function cancelSale(params, queryRunner) {
  // @ts-ignore
  const { sale_id, reason = "", _userId } = params;
  
  try {
    if (!sale_id) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    const saleRepo = queryRunner.manager.getRepository(Sale);
    const productRepo = queryRunner.manager.getRepository(Product);
    const inventoryLogRepo = queryRunner.manager.getRepository(InventoryTransactionLog);

    // Find the sale with items
    const sale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["items", "items.product"],
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${sale_id} not found`,
        data: null,
      };
    }

    // Check if sale can be cancelled
    if (sale.status === 'cancelled') {
      return {
        status: false,
        message: "Sale is already cancelled",
        data: null,
      };
    }

    if (sale.status === 'refunded') {
      return {
        status: false,
        message: "Cannot cancel a refunded sale",
        data: null,
      };
    }

    // Restore stock for each item
    const restoredItems = [];
    // @ts-ignore
    for (const item of sale.items) {
      if (item.product) {
        const product = await productRepo.findOne({
          where: { id: item.product_id }
        });

        if (product) {
          const newStock = product.stock + item.quantity;
          await productRepo.update(item.product_id, {
            stock: newStock,
            updated_at: new Date(),
          });

          // Log inventory transaction for stock restoration
          const inventoryLog = inventoryLogRepo.create({
            product_id: item.product_id.toString(),
            action: InventoryAction.ORDER_CANCELLATION,
            change_amount: item.quantity,
            quantity_before: product.stock,
            quantity_after: newStock,
            price_before: product.price,
            price_after: product.price,
            reference_id: sale_id.toString(),
            reference_type: "sale_cancellation",
            performed_by_id: _userId.toString(),
            notes: `Sale cancellation: ${reason || 'No reason provided'}`,
          });

          await inventoryLogRepo.save(inventoryLog);
          restoredItems.push({
            product_id: item.product_id,
            product_name: product.name,
            quantity_restored: item.quantity,
            new_stock: newStock,
          });
        }
      }
    }

    // Update sale status
    await saleRepo.update(sale_id, {
      status: 'cancelled',
      // @ts-ignore
      cancellation_reason: reason,
      cancelled_at: new Date(),
      updated_at: new Date(),
    });

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["user", "items"],
    });

    // Log audit
    await log_audit("cancel", "Sale", sale_id, _userId, {
      reason,
      restored_items_count: restoredItems.length,
      original_total: sale.total,
      previous_status: sale.status,
    });

    return {
      status: true,
      message: `Sale #${sale.reference_number} cancelled successfully`,
      data: {
        sale: updatedSale,
        restored_items: restoredItems,
        cancellation_details: {
          reason,
          cancelled_by: _userId,
          cancelled_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("cancelSale error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "cancel",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to cancel sale: ${error.message}`,
      data: null,
    };
  }
}

module.exports = cancelSale;