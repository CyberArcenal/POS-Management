// src/ipc/product/update_stock.ipc.js
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Manual stock adjustment
 * @param {{
 *   product_id: number,
 *   adjustment_type: 'increase' | 'decrease' | 'set',
 *   quantity: number,
 *   reason: string,
 *   reference_id?: string,
 *   reference_type?: string,
 *   warehouse_id?: string,
 *   _userId: number
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function updateProductStock(params, queryRunner = null) {
  const {
    product_id,
    adjustment_type,
    quantity,
    reason,
    reference_id,
    reference_type,
    warehouse_id,
    _userId
  } = params;
  
  try {
    if (quantity <= 0) {
      return {
        status: false,
        message: "Quantity must be greater than 0",
        data: null,
      };
    }
    
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    const inventoryLogRepo = queryRunner 
      ? queryRunner.manager.getRepository(InventoryTransactionLog)
      : AppDataSource.getRepository(InventoryTransactionLog);
    
    // Get product
    const product = await productRepo.findOne({
      where: { id: product_id, is_deleted: false }
    });
    
    if (!product) {
      return {
        status: false,
        message: `Product with ID ${product_id} not found`,
        data: null,
      };
    }
    
    // Calculate new stock
    const quantityBefore = product.stock;
    let quantityAfter;
    let changeAmount;
    
    switch (adjustment_type) {
      case 'increase':
        quantityAfter = quantityBefore + quantity;
        changeAmount = quantity;
        break;
      case 'decrease':
        if (quantityBefore < quantity) {
          return {
            status: false,
            message: `Insufficient stock. Available: ${quantityBefore}, requested: ${quantity}`,
            data: null,
          };
        }
        quantityAfter = quantityBefore - quantity;
        changeAmount = -quantity;
        break;
      case 'set':
        quantityAfter = quantity;
        changeAmount = quantity - quantityBefore;
        break;
      default:
        return {
          status: false,
          message: "Invalid adjustment type. Use 'increase', 'decrease', or 'set'",
          data: null,
        };
    }
    
    // Update product stock
    product.stock = quantityAfter;
    product.available_stock = Math.max(0, quantityAfter - product.reserved_stock);
    product.updated_at = new Date();
    product.updated_by = _userId;
    
    await productRepo.save(product);
    
    // Determine action type for logging
    let action;
    switch (adjustment_type) {
      case 'increase':
        action = quantity > 100 ? 'BULK_INCREASE' : 'QUICK_INCREASE';
        break;
      case 'decrease':
        action = quantity > 100 ? 'BULK_DECREASE' : 'QUICK_DECREASE';
        break;
      case 'set':
        action = 'MANUAL_ADJUSTMENT';
        break;
    }
    
    // Create inventory transaction log
    const inventoryLog = inventoryLogRepo.create({
      product_id: product_id.toString(),
      warehouse_id: warehouse_id || null,
      action: action,
      change_amount: changeAmount,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_id: reference_id || null,
      reference_type: reference_type || 'manual_adjustment',
      performed_by_id: _userId ? _userId.toString() : null,
      notes: reason || 'Manual stock adjustment',
    });
    
    await inventoryLogRepo.save(inventoryLog);
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "stock_adjustment",
        entity: "Product",
        entity_id: product_id,
        description: `Stock ${adjustment_type}: ${quantity} units for product ${product.name}. New stock: ${quantityAfter}`,
      });
    }
    
    return {
      status: true,
      message: `Stock ${adjustment_type} successful`,
      data: {
        product_id,
        product_name: product.name,
        adjustment_type,
        quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        change_amount: changeAmount,
        timestamp: new Date(),
        transaction_id: inventoryLog.id,
      },
    };
    
  } catch (error) {
    console.error("Update stock error:", error);
    return {
      status: false,
      message: error.message || "Failed to update stock",
      data: null,
    };
  }
};