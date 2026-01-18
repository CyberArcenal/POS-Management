//@ts-check
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get low stock products
 * @param {number} threshold - Custom threshold (optional)
 * @param {number} userId
 */
async function getLowStockProducts(threshold, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("product.stock > 0"); // Not completely out of stock

    if (threshold !== undefined) {
      queryBuilder.andWhere("product.stock <= :threshold", { threshold });
    } else {
      queryBuilder.andWhere("product.stock <= product.min_stock");
    }

    const products = await queryBuilder
      .orderBy("product.stock", "ASC")
      .getMany();

    const stats = {
      totalLowStock: products.length,
      // @ts-ignore
      criticalItems: products.filter(p => p.stock <= 2).length,
      // @ts-ignore
      warningItems: products.filter(p => p.stock > 2 && p.stock <= p.min_stock).length,
      // @ts-ignore
      totalValueAtRisk: products.reduce((sum, p) => sum + (p.stock * p.price), 0)
    };

    await log_audit("fetch_low_stock", "Product", 0, userId, stats);

    return {
      status: true,
      message: "Low stock products fetched",
      data: {
        products,
        stats
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: []
    };
  }
}

module.exports = getLowStockProducts;