// src/ipc/product/search.ipc.js
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");
/**
 * Search products with various criteria (for POS quick search)
 * @param {string} query
 * @param {number} userId
 */
module.exports = async function searchProducts(query, userId) {
  try {
    if (!query || query.trim() === '') {
      return {
        status: false,
        message: "Search query is required",
        data: null,
      };
    }
    
    const productRepo = AppDataSource.getRepository(Product);
    
    // Search across multiple fields with priority scoring
    const products = await productRepo.createQueryBuilder('product')
      .where('product.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere(
        '(product.name LIKE :query OR ' +
        'product.sku LIKE :query OR ' +
        'product.barcode LIKE :query OR ' +
        'product.description LIKE :query OR ' +
        'product.pos_quick_code LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy(
        `CASE 
          WHEN product.sku = :exactQuery THEN 1
          WHEN product.barcode = :exactQuery THEN 2
          WHEN product.pos_quick_code = :exactQuery THEN 3
          WHEN product.name LIKE :startQuery THEN 4
          ELSE 5
         END`,
        'ASC'
      )
      .setParameters({
        exactQuery: query,
        startQuery: `${query}%`
      })
      .take(50) // Limit results for POS
      .getMany();
    
    // Enhance with availability info
    const enhancedProducts = products.map(product => {
      const availableStock = Math.max(0, product.stock - product.reserved_stock);
      return {
        ...product,
        available_stock: availableStock,
        is_out_of_stock: availableStock <= 0,
        is_low_stock: availableStock <= product.min_stock_level,
        search_score: 0, // Can be calculated based on match quality
      };
    });
    
    return {
      status: true,
      message: products.length > 0 ? "Products found" : "No products found",
      data: {
        products: enhancedProducts,
        count: products.length,
        search_query: query,
      },
    };
    
  } catch (error) {
    console.error("Search products error:", error);
    return {
      status: false,
      message: error.message || "Failed to search products",
      data: null,
    };
  }
};