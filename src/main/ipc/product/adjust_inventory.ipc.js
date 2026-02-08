// src/ipc/product/adjust_inventory.ipc.js
// @ts-nocheck
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Advanced inventory adjustments (for returns, damages, etc.)
 * @param {{
 *   product_id: number,
 *   action_type: string, // 'return', 'damage', 'found', 'theft', 'correction', 'transfer'
 *   quantity: number,
 *   reason: string,
 *   reference_id?: string,
 *   reference_type?: string,
 *   warehouse_id?: string,
 *   batch_number?: string,
 *   expiry_date?: string,
 *   _userId: number
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function adjustProductInventory(params, queryRunner = null) {
  const {
    product_id,
    action_type,
    quantity,
    reason,
    reference_id,
    reference_type,
    warehouse_id,
    batch_number,
    expiry_date,
    _userId
  } = params;
  
  try {
    if (!quantity || quantity <= 0) {
      return {
        status: false,
        message: "Valid quantity is required",
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
    
    // Determine if adjustment increases or decreases stock
    const adjustments = {
      'return': { change: quantity, action: 'RETURN' },
      'damage': { change: -quantity, action: 'DAMAGE' },
      'found': { change: quantity, action: 'FOUND' },
      'theft': { change: -quantity, action: 'THEFT' },
      'correction': { change: quantity, action: 'CORRECTION' },
      'transfer_in': { change: quantity, action: 'TRANSFER_IN' },
      'transfer_out': { change: -quantity, action: 'TRANSFER_OUT' },
      'expiry': { change: -quantity, action: 'EXPIRY' },
      'quarantine': { change: -quantity, action: 'QUARANTINE' },
      'donation': { change: -quantity, action: 'DONATION' },
    };
    
    const adjustment = adjustments[action_type];
    if (!adjustment) {
      return {
        status: false,
        message: `Invalid action type: ${action_type}`,
        data: null,
      };
    }
    
    // Check stock availability for decreases
    if (adjustment.change < 0 && Math.abs(adjustment.change) > product.stock) {
      return {
        status: false,
        message: `Insufficient stock. Available: ${product.stock}, requested adjustment: ${Math.abs(adjustment.change)}`,
        data: null,
      };
    }
    
    // Calculate new stock
    const quantityBefore = product.stock;
    const quantityAfter = quantityBefore + adjustment.change;
    const changeAmount = adjustment.change;
    
    // Update product stock
    product.stock = quantityAfter;
    product.available_stock = Math.max(0, quantityAfter - product.reserved_stock);
    product.updated_at = new Date();
    product.updated_by = _userId;
    
    // Update specific fields based on action
    if (action_type === 'damage' || action_type === 'expiry') {
      product.total_damaged = (product.total_damaged || 0) + quantity;
    } else if (action_type === 'return') {
      product.total_returned = (product.total_returned || 0) + quantity;
    }
    
    await productRepo.save(product);
    
    // Create inventory transaction log
    const inventoryLog = inventoryLogRepo.create({
      product_id: product_id.toString(),
      warehouse_id: warehouse_id || null,
      action: adjustment.action,
      change_amount: changeAmount,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_id: reference_id || null,
      reference_type: reference_type || action_type,
      performed_by_id: _userId ? _userId.toString() : null,
      notes: `${action_type}: ${reason || 'No reason provided'}`,
      batch_number: batch_number || null,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
    });
    
    await inventoryLogRepo.save(inventoryLog);
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "inventory_adjustment",
        entity: "Product",
        entity_id: product_id,
        description: `${action_type} adjustment: ${quantity} units for product ${product.name}. Reason: ${reason}`,
      });
    }
    
    // If stock falls below minimum, generate alert
    let alert = null;
    if (quantityAfter <= product.min_stock_level) {
      alert = {
        type: 'low_stock',
        product_id,
        product_name: product.name,
        current_stock: quantityAfter,
        min_stock_level: product.min_stock_level,
        severity: quantityAfter <= 0 ? 'critical' : 'warning',
        message: `Product "${product.name}" is ${quantityAfter <= 0 ? 'out of stock' : 'low on stock'}`,
      };
    }
    
    return {
      status: true,
      message: `${action_type} adjustment completed`,
      data: {
        product_id,
        product_name: product.name,
        action_type,
        quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        change_amount: changeAmount,
        timestamp: new Date(),
        transaction_id: inventoryLog.id,
        alert,
      },
    };
    
  } catch (error) {
    console.error("Inventory adjustment error:", error);
    return {
      status: false,
      message: error.message || "Failed to adjust inventory",
      data: null,
    };
  }
};