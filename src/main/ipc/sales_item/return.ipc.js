// sales_items/return.ipc.js
//@ts-check
const SaleItem = require("../../../entities/SaleItem");
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
async function returnSaleItem(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_item_id, 
    // @ts-ignore
    return_quantity, 
    // @ts-ignore
    reason = "",
    // @ts-ignore
    refund_amount = null,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!sale_item_id || !return_quantity || return_quantity <= 0) {
      return {
        status: false,
        message: "Sale Item ID and valid return quantity are required",
        data: null,
      };
    }

    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const saleRepo = queryRunner.manager.getRepository(Sale);
    const productRepo = queryRunner.manager.getRepository(Product);
    const inventoryLogRepo = queryRunner.manager.getRepository(InventoryTransactionLog);

    // Find the sale item
    const saleItem = await saleItemRepo.findOne({
      where: { id: sale_item_id },
      relations: ["sale", "product"],
    });

    if (!saleItem) {
      return {
        status: false,
        message: `Sale item with ID ${sale_item_id} not found`,
        data: null,
      };
    }

    // Check if sale is eligible for returns
    // @ts-ignore
    if (saleItem.sale.status === 'cancelled') {
      return {
        status: false,
        message: "Cannot return items from a cancelled sale",
        data: null,
      };
    }

    // Check if already returned
    const alreadyReturned = saleItem.returned_quantity;
    // @ts-ignore
    const maxReturnable = saleItem.quantity - alreadyReturned;
    
    if (return_quantity > maxReturnable) {
      return {
        status: false,
        message: `Cannot return ${return_quantity} items. Maximum returnable: ${maxReturnable}`,
        data: null,
      };
    }

    // Calculate refund amount if not provided
    const calculatedRefund = refund_amount !== null ? refund_amount : 
      // @ts-ignore
      (saleItem.unit_price * return_quantity) - 
      // @ts-ignore
      (saleItem.discount_amount * (return_quantity / saleItem.quantity));

    // Update sale item
    const newReturnedQuantity = alreadyReturned + return_quantity;
    const isFullyReturned = newReturnedQuantity === saleItem.quantity;
    
    await saleItemRepo.update(sale_item_id, {
      returned_quantity: newReturnedQuantity,
      is_returned: isFullyReturned,
      return_reason: reason,
      updated_at: new Date(),
    });

    // Restore stock if product exists
    // @ts-ignore
    if (saleItem.product) {
      const product = await productRepo.findOne({
        // @ts-ignore
        where: { id: saleItem.product_id }
      });

      if (product) {
        const newStock = product.stock + return_quantity;
        // @ts-ignore
        await productRepo.update(saleItem.product_id, {
          stock: newStock,
          updated_at: new Date(),
        });

        // Log inventory transaction
        const inventoryLog = inventoryLogRepo.create({
          // @ts-ignore
          product_id: saleItem.product_id.toString(),
          action: InventoryAction.RETURN,
          change_amount: return_quantity,
          quantity_before: product.stock,
          quantity_after: newStock,
          price_before: product.price,
          price_after: product.price,
          // @ts-ignore
          reference_id: saleItem.sale_id.toString(),
          reference_type: "item_return",
          performed_by_id: _userId.toString(),
          notes: `Return: ${reason || 'No reason provided'}`,
        });

        await inventoryLogRepo.save(inventoryLog);
      }
    }

    // Update sale if all items are returned
    const allItems = await saleItemRepo.find({
      // @ts-ignore
      where: { sale_id: saleItem.sale_id }
    });

    const allFullyReturned = allItems.every(item => item.is_returned);
    
    if (allFullyReturned) {
      // @ts-ignore
      await saleRepo.update(saleItem.sale_id, {
        status: 'refunded',
        // @ts-ignore
        refund_amount: saleItem.sale.total,
        refunded_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      // Update sale refund amount
      const totalRefunded = allItems.reduce((sum, item) => 
        // @ts-ignore
        sum + (item.returned_quantity * item.unit_price), 0);
      
      // @ts-ignore
      await saleRepo.update(saleItem.sale_id, {
        refund_amount: totalRefunded,
        updated_at: new Date(),
      });
    }

    const updatedItem = await saleItemRepo.findOne({
      where: { id: sale_item_id },
      relations: ["product"],
    });

    // Log audit
    await log_audit("return", "SaleItem", sale_item_id, _userId, {
      sale_id: saleItem.sale_id,
      product_id: saleItem.product_id,
      return_quantity,
      refund_amount: calculatedRefund,
      reason,
      previous_returned: alreadyReturned,
      new_returned: newReturnedQuantity,
    });

    return {
      status: true,
      message: "Item returned successfully",
      data: {
        sale_item: updatedItem,
        return_details: {
          return_quantity,
          refund_amount: calculatedRefund,
          reason,
          // @ts-ignore
          stock_restored: saleItem.product ? return_quantity : 0,
          is_fully_returned: isFullyReturned,
        },
        sale_status_update: allFullyReturned ? 'Sale marked as fully refunded' : 'Sale updated with partial refund',
      },
    };
  } catch (error) {
    console.error("returnSaleItem error:", error);

    await log_audit("error", "SaleItem", sale_item_id, _userId, {
      action: "return",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to return item: ${error.message}`,
      data: null,
    };
  }
}

module.exports = returnSaleItem;