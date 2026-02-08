// src/ipc/product/bulk_update_prices.ipc.js
// @ts-nocheck
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const PriceHistory = require("../../../entities/PriceHistory");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Bulk update prices with different strategies
 * @param {{
 *   strategy: 'percentage' | 'fixed' | 'cost_plus' | 'rounding',
 *   value: number,
 *   product_ids?: number[],
 *   filters?: object,
 *   round_to?: number,
 *   min_price?: number,
 *   max_price?: number,
 *   change_reason?: string,
 *   _userId: number
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function bulkUpdatePrices(params, queryRunner = null) {
  const {
    strategy,
    value,
    product_ids,
    filters,
    round_to = 0.99,
    min_price,
    max_price,
    change_reason,
    _userId
  } = params;
  
  try {
    if (!strategy || value === undefined) {
      return {
        status: false,
        message: "Strategy and value are required",
        data: null,
      };
    }
    
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    const priceHistoryRepo = queryRunner 
      ? queryRunner.manager.getRepository(PriceHistory)
      : AppDataSource.getRepository(PriceHistory);
    
    // Determine which products to update
    let whereCondition = { 
      is_deleted: false,
      is_active: true 
    };
    
    if (product_ids && product_ids.length > 0) {
      whereCondition.id = product_ids;
    } else if (filters) {
      // Build query from filters
      Object.keys(filters).forEach(key => {
        whereCondition[key] = filters[key];
      });
    } else {
      return {
        status: false,
        message: "No products specified for price update",
        data: null,
      };
    }
    
    // Find products to update
    const products = await productRepo.find({
      where: whereCondition
    });
    
    if (products.length === 0) {
      return {
        status: false,
        message: "No products found matching criteria",
        data: null,
      };
    }
    
    // Apply price updates
    const updatedProducts = [];
    const priceHistories = [];
    const errors = [];
    
    for (const product of products) {
      try {
        const oldPrice = product.selling_price;
        let newPrice;
        
        // Calculate new price based on strategy
        switch (strategy) {
          case 'percentage':
            // Percentage increase/decrease
            newPrice = oldPrice * (1 + value / 100);
            break;
            
          case 'fixed':
            // Fixed amount increase/decrease
            newPrice = oldPrice + value;
            break;
            
          case 'cost_plus':
            // Cost plus markup percentage
            if (!product.cost_price) {
              errors.push({
                product_id: product.id,
                product_name: product.name,
                error: "Cost price not available for cost-plus calculation",
              });
              continue;
            }
            newPrice = product.cost_price * (1 + value / 100);
            break;
            
          case 'rounding':
            // Round to nearest X.99 or X.95
            newPrice = Math.floor(oldPrice) + round_to;
            break;
            
          default:
            errors.push({
              product_id: product.id,
              product_name: product.name,
              error: `Invalid strategy: ${strategy}`,
            });
            continue;
        }
        
        // Apply min/max price constraints
        if (min_price !== undefined && newPrice < min_price) {
          newPrice = min_price;
        }
        if (max_price !== undefined && newPrice > max_price) {
          newPrice = max_price;
        }
        
        // Round to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;
        
        // Skip if price hasn't changed
        if (oldPrice === newPrice) {
          continue;
        }
        
        // Update product
        product.selling_price = newPrice;
        product.updated_at = new Date();
        product.updated_by = _userId;
        
        const savedProduct = await productRepo.save(product);
        updatedProducts.push(savedProduct);
        
        // Create price history record
        const priceHistory = priceHistoryRepo.create({
          product_id: product.id,
          old_price: oldPrice,
          new_price: newPrice,
          change_type: `bulk_${strategy}`,
          change_reason: change_reason || `Bulk price update using ${strategy} strategy`,
          changed_by_id: _userId,
        });
        
        const savedHistory = await priceHistoryRepo.save(priceHistory);
        priceHistories.push(savedHistory);
        
      } catch (error) {
        errors.push({
          product_id: product.id,
          product_name: product.name,
          error: error.message,
        });
      }
    }
    
    // Generate summary statistics
    let summary = null;
    if (updatedProducts.length > 0) {
      const totalOldValue = updatedProducts.reduce((sum, p) => sum + (p.selling_price || 0), 0);
      const averageChange = updatedProducts.reduce((sum, p) => {
        const history = priceHistories.find(h => h.product_id === p.id);
        return sum + (history ? (history.new_price - history.old_price) : 0);
      }, 0) / updatedProducts.length;
      
      const maxIncrease = Math.max(...priceHistories.map(h => h.new_price - h.old_price));
      const maxDecrease = Math.min(...priceHistories.map(h => h.new_price - h.old_price));
      
      summary = {
        products_updated: updatedProducts.length,
        average_price_change: parseFloat(averageChange.toFixed(2)),
        total_value_change: parseFloat((totalOldValue * (value / 100)).toFixed(2)),
        max_price_increase: parseFloat(maxIncrease.toFixed(2)),
        max_price_decrease: parseFloat(maxDecrease.toFixed(2)),
        strategy_used: strategy,
        value_applied: value,
      };
    }
    
    // Log activity
    if (_userId && updatedProducts.length > 0) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "bulk_price_update",
        entity: "Product",
        entity_id: null,
        description: `Bulk price update for ${updatedProducts.length} products using ${strategy} strategy`,
        details: JSON.stringify({
          strategy,
          value,
          updated_count: updatedProducts.length,
          error_count: errors.length,
          summary,
        }),
      });
    }
    
    return {
      status: true,
      message: `Bulk price update completed. Updated: ${updatedProducts.length}, Failed: ${errors.length}`,
      data: {
        updated_count: updatedProducts.length,
        error_count: errors.length,
        summary,
        sample_changes: priceHistories.slice(0, 5).map(h => ({
          product_id: h.product_id,
          old_price: h.old_price,
          new_price: h.new_price,
          change: parseFloat((h.new_price - h.old_price).toFixed(2)),
          percentage_change: parseFloat(((h.new_price - h.old_price) / h.old_price * 100).toFixed(2)),
        })),
        errors: errors.length > 0 ? errors : null,
      },
    };
    
  } catch (error) {
    console.error("Bulk update prices error:", error);
    return {
      status: false,
      message: error.message || "Failed to perform bulk price update",
      data: null,
    };
  }
};