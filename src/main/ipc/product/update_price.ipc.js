// src/ipc/product/update_price.ipc.js
const PriceHistory = require("../../../entities/PriceHistory");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Update product price with history tracking
 * @param {{
 *   product_id: number,
 *   new_price: number,
 *   change_type?: string,
 *   change_reason?: string,
 *   effective_date?: string,
 *   reference_id?: string,
 *   reference_type?: string,
 *   _userId: number
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function updateProductPrice(params, queryRunner = null) {
  const {
    product_id,
    new_price,
    change_type = 'manual',
    change_reason = '',
    effective_date,
    reference_id,
    reference_type,
    _userId
  } = params;
  
  try {
    if (!new_price || new_price <= 0) {
      return {
        status: false,
        message: "Valid price is required",
        data: null,
      };
    }
    
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    const priceHistoryRepo = queryRunner 
      ? queryRunner.manager.getRepository(PriceHistory)
      : AppDataSource.getRepository(PriceHistory);
    
    const inventoryLogRepo = queryRunner 
      ? queryRunner.manager.getRepository(require("../../../entities/InventoryTransactionLogs"))
      : AppDataSource.getRepository(require("../../../entities/InventoryTransactionLogs"));
    
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
    
    // Check if price is actually changing
    const oldPrice = product.selling_price;
    if (oldPrice === new_price) {
      return {
        status: false,
        message: "New price is the same as current price",
        data: null,
      };
    }
    
    // Calculate percentage change
    const percentageChange = ((new_price - oldPrice) / oldPrice * 100).toFixed(2);
    
    // Update product price
    product.selling_price = new_price;
    product.updated_at = new Date();
    product.updated_by = _userId;
    
    await productRepo.save(product);
    
    // Create price history record
    const priceHistory = priceHistoryRepo.create({
      product_id,
      old_price: oldPrice,
      new_price,
      change_type,
      change_reason: change_reason || `Price updated by user ${_userId}`,
      effective_date: effective_date ? new Date(effective_date) : new Date(),
      changed_by_id: _userId,
      reference_id: reference_id || null,
      reference_type: reference_type || null,
    });
    
    await priceHistoryRepo.save(priceHistory);
    
    // Log inventory transaction for price change
    const inventoryLog = inventoryLogRepo.create({
      product_id: product_id.toString(),
      action: 'PRICE_CHANGE',
      change_amount: 0, // No quantity change
      quantity_before: product.stock,
      quantity_after: product.stock,
      price_before: oldPrice,
      price_after: new_price,
      reference_id: priceHistory.id.toString(),
      reference_type: 'price_change',
      performed_by_id: _userId ? _userId.toString() : null,
      notes: `Price change: ${oldPrice} → ${new_price} (${percentageChange}%) - ${change_reason}`,
    });
    
    await inventoryLogRepo.save(inventoryLog);
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "price_update",
        entity: "Product",
        entity_id: product_id,
        description: `Price updated for ${product.name}: ${oldPrice} → ${new_price} (${percentageChange}%)`,
      });
    }
    
    // Calculate impact on margin if cost price is available
    let marginImpact = null;
    if (product.cost_price) {
      const oldMargin = ((oldPrice - product.cost_price) / oldPrice * 100).toFixed(2);
      const newMargin = ((new_price - product.cost_price) / new_price * 100).toFixed(2);
      marginImpact = {
        old_margin_percentage: parseFloat(oldMargin),
        new_margin_percentage: parseFloat(newMargin),
        margin_change: (parseFloat(newMargin) - parseFloat(oldMargin)).toFixed(2),
      };
    }
    
    return {
      status: true,
      message: "Price updated successfully",
      data: {
        product_id,
        product_name: product.name,
        old_price: oldPrice,
        new_price,
        percentage_change: parseFloat(percentageChange),
        effective_date: priceHistory.effective_date,
        margin_impact: marginImpact,
        price_history_id: priceHistory.id,
      },
    };
    
  } catch (error) {
    console.error("Update price error:", error);
    return {
      status: false,
      message: error.message || "Failed to update price",
      data: null,
    };
  }
};