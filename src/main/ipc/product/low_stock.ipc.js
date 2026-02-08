// src/ipc/product/low_stock.ipc.js
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Get low stock products
 * @param {number} threshold
 * @param {number} userId
 */
module.exports = async function getLowStockProducts(threshold, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    // If no threshold provided, use product's min_stock_level
    const queryBuilder = productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere('product.stock > 0') // Not completely out of stock
      .orderBy('product.stock', 'ASC');
    
    if (threshold && threshold > 0) {
      // Use provided threshold
      queryBuilder.andWhere('product.stock <= :threshold', { threshold });
    } else {
      // Use product's own min_stock_level
      queryBuilder.andWhere('product.stock <= product.min_stock_level');
    }
    
    const lowStockProducts = await queryBuilder.getMany();
    
    // Categorize by severity
    const critical = []; // Stock = 0 or below safety level
    const warning = [];  // Stock below reorder level
    const notice = [];   // Stock approaching reorder level
    
    lowStockProducts.forEach(product => {
      const safetyStock = product.min_stock_level || 5;
      const reorderLevel = product.reorder_level || 10;
      
      if (product.stock <= 0) {
        critical.push({ ...product, severity: 'critical', days_of_supply: 0 });
      } else if (product.stock <= safetyStock) {
        critical.push({ 
          ...product, 
          severity: 'critical', 
          days_of_supply: Math.floor(product.stock / (product.average_daily_sales || 1))
        });
      } else if (product.stock <= reorderLevel) {
        warning.push({ 
          ...product, 
          severity: 'warning', 
          days_of_supply: Math.floor(product.stock / (product.average_daily_sales || 1))
        });
      } else {
        notice.push({ 
          ...product, 
          severity: 'notice', 
          days_of_supply: Math.floor(product.stock / (product.average_daily_sales || 1))
        });
      }
    });
    
    // Calculate summary statistics
    const totalValueAtRisk = lowStockProducts.reduce((sum, product) => {
      return sum + ((product.cost_price || 0) * product.stock);
    }, 0);
    
    const totalPotentialLostSales = lowStockProducts.reduce((sum, product) => {
      const idealStock = product.max_stock_level || (product.min_stock_level * 3) || 30;
      const stockShortage = Math.max(0, idealStock - product.stock);
      return sum + (stockShortage * product.selling_price);
    }, 0);
    
    return {
      status: true,
      message: "Low stock products retrieved",
      data: {
        critical,
        warning,
        notice,
        summary: {
          total_low_stock_items: lowStockProducts.length,
          total_value_at_risk: totalValueAtRisk,
          total_potential_lost_sales: totalPotentialLostSales,
          critical_count: critical.length,
          warning_count: warning.length,
          notice_count: notice.length,
        },
        recommendations: lowStockProducts.length > 0 ? [
          'Consider placing purchase orders for critical items',
          'Review reorder levels for frequently low-stock items',
          'Check supplier lead times'
        ] : [],
      },
    };
    
  } catch (error) {
    console.error("Get low stock products error:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve low stock products",
      data: null,
    };
  }
};