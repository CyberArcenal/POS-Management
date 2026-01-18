// sales_items/delete.ipc.js
//@ts-check
const SaleItem = require("../../../entities/SaleItem");
const Sale = require("../../../entities/Sale");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function deleteSaleItem(params, queryRunner) {
  const { 
    // @ts-ignore
    id, 
    // @ts-ignore
    reason = "",
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!id) {
      return {
        status: false,
        message: "Sale Item ID is required",
        data: null,
      };
    }

    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const saleRepo = queryRunner.manager.getRepository(Sale);

    // Find the sale item
    const saleItem = await saleItemRepo.findOne({
      where: { id },
      relations: ["sale"],
    });

    if (!saleItem) {
      return {
        status: false,
        message: `Sale item with ID ${id} not found`,
        data: null,
      };
    }

    // Check if sale is modifiable
    // @ts-ignore
    if (!['pending', 'processing'].includes(saleItem.sale.status)) {
      return {
        status: false,
        // @ts-ignore
        message: `Cannot delete items from a ${saleItem.sale.status} sale`,
        data: null,
      };
    }

    const saleId = saleItem.sale_id;
    const itemTotal = saleItem.total_price;

    // Delete the sale item
    await saleItemRepo.delete(id);

    // Recalculate sale total
    const remainingItems = await saleItemRepo.find({
      // @ts-ignore
      where: { sale_id: saleId }
    });

    // @ts-ignore
    const newSaleTotal = remainingItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // @ts-ignore
    await saleRepo.update(saleId, {
      total: newSaleTotal,
      updated_at: new Date(),
    });

    // Check if sale is now empty
    const saleItemCount = await saleItemRepo.count({
      // @ts-ignore
      where: { sale_id: saleId }
    });

    if (saleItemCount === 0) {
      // @ts-ignore
      await saleRepo.update(saleId, {
        status: 'cancelled',
        cancellation_reason: 'All items removed',
        updated_at: new Date(),
      });
    }

    // Log audit
    await log_audit("delete", "SaleItem", id, _userId, {
      sale_id: saleId,
      reason,
      item_total: itemTotal,
      new_sale_total: newSaleTotal,
      remaining_items: saleItemCount,
    });

    return {
      status: true,
      message: "Sale item deleted successfully",
      data: {
        sale_id: saleId,
        deleted_item_total: itemTotal,
        new_sale_total: newSaleTotal,
        remaining_items_count: saleItemCount,
        sale_empty: saleItemCount === 0,
      },
    };
  } catch (error) {
    console.error("deleteSaleItem error:", error);

    await log_audit("error", "SaleItem", id, _userId, {
      action: "delete",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete sale item: ${error.message}`,
      data: null,
    };
  }
}

module.exports = deleteSaleItem;