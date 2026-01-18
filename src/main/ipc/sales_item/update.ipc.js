// sales_items/update.ipc.js
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
async function updateSaleItem(params, queryRunner) {
  const { 
    // @ts-ignore
    id, 
    // @ts-ignore
    updates = {},
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
      relations: ["sale", "product"],
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
        message: `Cannot update items in a ${saleItem.sale.status} sale`,
        data: null,
      };
    }

    // Define allowed updates
    const allowedUpdates = [
      'quantity', 'unit_price', 'discount_amount', 
      'discount_percentage', 'notes', 'variant_id'
    ];

    const updateData = {};
    const updateLog = {};

    allowedUpdates.forEach(field => {
      // @ts-ignore
      if (updates[field] !== undefined && updates[field] !== saleItem[field]) {
        // @ts-ignore
        updateData[field] = updates[field];
        // @ts-ignore
        updateLog[field] = {
          // @ts-ignore
          from: saleItem[field],
          to: updates[field],
        };
      }
    });

    // If no valid updates
    if (Object.keys(updateData).length === 0) {
      return {
        status: false,
        message: "No valid updates provided",
        data: null,
      };
    }

    // If quantity or price changed, recalculate total
    // @ts-ignore
    if (updateData.quantity || updateData.unit_price || updateData.discount_amount) {
      // @ts-ignore
      const newQuantity = updateData.quantity || saleItem.quantity;
      // @ts-ignore
      const newUnitPrice = updateData.unit_price || saleItem.unit_price;
      // @ts-ignore
      const newDiscount = updateData.discount_amount || saleItem.discount_amount || 0;
      
      // @ts-ignore
      updateData.total_price = (newQuantity * newUnitPrice) - newDiscount;
      
      // Recalculate profit if cost price exists
      // @ts-ignore
      if (saleItem.product && saleItem.product.cost_price) {
        // @ts-ignore
        updateData.profit = updateData.total_price - (saleItem.product.cost_price * newQuantity);
      }
    }

    updateData.updated_at = new Date();

    // Update the sale item
    await saleItemRepo.update(id, updateData);

    // Recalculate sale total
    const allItems = await saleItemRepo.find({
      // @ts-ignore
      where: { sale_id: saleItem.sale_id }
    });

    // @ts-ignore
    const newSaleTotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
    // @ts-ignore
    await saleRepo.update(saleItem.sale_id, {
      total: newSaleTotal,
      updated_at: new Date(),
    });

    const updatedItem = await saleItemRepo.findOne({
      where: { id },
      relations: ["product", "sale"],
    });

    // Log audit
    await log_audit("update", "SaleItem", id, _userId, {
      sale_id: saleItem.sale_id,
      updates: Object.keys(updateLog),
      previous_total: saleItem.total_price,
      // @ts-ignore
      new_total: updatedItem.total_price,
    });

    return {
      status: true,
      message: "Sale item updated successfully",
      data: {
        sale_item: updatedItem,
        sale_total: newSaleTotal,
        updates_applied: updateLog,
      },
    };
  } catch (error) {
    console.error("updateSaleItem error:", error);

    await log_audit("error", "SaleItem", id, _userId, {
      action: "update",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update sale item: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateSaleItem;