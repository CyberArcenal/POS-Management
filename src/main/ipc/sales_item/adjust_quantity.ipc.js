// sales_items/adjust_quantity.ipc.js
//@ts-check
const SaleItem = require("../../../entities/SaleItem");
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
async function adjustSaleItemQuantity(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_item_id, 
    // @ts-ignore
    new_quantity, 
    // @ts-ignore
    reason = "",
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!sale_item_id || !new_quantity || new_quantity < 0) {
      return {
        status: false,
        message: "Sale Item ID and valid new quantity are required",
        data: null,
      };
    }

    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
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

    // Check if sale is modifiable
    // @ts-ignore
    if (!['pending', 'processing'].includes(saleItem.sale.status)) {
      return {
        status: false,
        // @ts-ignore
        message: `Cannot adjust quantity in a ${saleItem.sale.status} sale`,
        data: null,
      };
    }

    // Check if already returned
    // @ts-ignore
    if (saleItem.returned_quantity > 0) {
      return {
        status: false,
        message: `Cannot adjust quantity. ${saleItem.returned_quantity} items have already been returned.`,
        data: null,
      };
    }

    // @ts-ignore
    const quantityDifference = new_quantity - saleItem.quantity;
    
    if (quantityDifference === 0) {
      return {
        status: false,
        message: "New quantity is the same as current quantity",
        data: null,
      };
    }

    // Check product stock for increase
    // @ts-ignore
    if (quantityDifference > 0 && saleItem.product) {
      const product = await productRepo.findOne({
        // @ts-ignore
        where: { id: saleItem.product_id }
      });

      // @ts-ignore
      if (product && product.stock < quantityDifference) {
        return {
          status: false,
          message: `Insufficient stock. Available: ${product.stock}, Needed: ${quantityDifference}`,
          data: null,
        };
      }
    }

    // Update sale item
    // @ts-ignore
    const newTotalPrice = (saleItem.unit_price * new_quantity) - (saleItem.discount_amount || 0);
    // @ts-ignore
    const newProfit = saleItem.cost_price > 0 ? 
      // @ts-ignore
      newTotalPrice - (saleItem.cost_price * new_quantity) : null;

    await saleItemRepo.update(sale_item_id, {
      quantity: new_quantity,
      total_price: newTotalPrice,
      // @ts-ignore
      profit: newProfit,
      updated_at: new Date(),
    });

    // Adjust product stock
    // @ts-ignore
    if (saleItem.product && quantityDifference !== 0) {
      const product = await productRepo.findOne({
        // @ts-ignore
        where: { id: saleItem.product_id }
      });

      if (product) {
        // @ts-ignore
        const newStock = product.stock - quantityDifference;
        // @ts-ignore
        await productRepo.update(saleItem.product_id, {
          stock: newStock,
          updated_at: new Date(),
        });

        // Log inventory transaction
        const inventoryLog = inventoryLogRepo.create({
          // @ts-ignore
          product_id: saleItem.product_id.toString(),
          action: quantityDifference > 0 ? InventoryAction.SALE : InventoryAction.RETURN,
          change_amount: -quantityDifference, // Negative because we're reducing stock for increase
          quantity_before: product.stock,
          quantity_after: newStock,
          price_before: product.price,
          price_after: product.price,
          // @ts-ignore
          reference_id: saleItem.sale_id.toString(),
          reference_type: "quantity_adjustment",
          performed_by_id: _userId.toString(),
          notes: `Quantity adjustment: ${reason || 'No reason provided'}`,
        });

        await inventoryLogRepo.save(inventoryLog);
      }
    }

    // Recalculate sale total
    const saleItems = await saleItemRepo.find({
      // @ts-ignore
      where: { sale_id: saleItem.sale_id }
    });

    // @ts-ignore
    const newSaleTotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
    
    const saleRepo = queryRunner.manager.getRepository("Sale");
    // @ts-ignore
    await saleRepo.update(saleItem.sale_id, {
      total: newSaleTotal,
      updated_at: new Date(),
    });

    const updatedItem = await saleItemRepo.findOne({
      where: { id: sale_item_id },
      relations: ["product"],
    });

    // Log audit
    await log_audit("adjust_quantity", "SaleItem", sale_item_id, _userId, {
      sale_id: saleItem.sale_id,
      product_id: saleItem.product_id,
      previous_quantity: saleItem.quantity,
      new_quantity,
      quantity_difference: quantityDifference,
      reason,
      // @ts-ignore
      stock_adjusted: saleItem.product ? Math.abs(quantityDifference) : 0,
    });

    return {
      status: true,
      message: "Item quantity adjusted successfully",
      data: {
        sale_item: updatedItem,
        adjustment_details: {
          previous_quantity: saleItem.quantity,
          new_quantity,
          // @ts-ignore
          quantity_difference,
          previous_total: saleItem.total_price,
          new_total: newTotalPrice,
          stock_adjusted: Math.abs(quantityDifference),
          adjustment_type: quantityDifference > 0 ? 'increase' : 'decrease',
        },
        sale_total_update: {
          // @ts-ignore
          previous_total: saleItem.sale.total,
          new_total: newSaleTotal,
        },
      },
    };
  } catch (error) {
    console.error("adjustSaleItemQuantity error:", error);

    await log_audit("error", "SaleItem", sale_item_id, _userId, {
      action: "adjust_quantity",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to adjust item quantity: ${error.message}`,
      data: null,
    };
  }
}

module.exports = adjustSaleItemQuantity;