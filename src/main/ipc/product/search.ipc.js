//@ts-check
const Product = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Search products by name, SKU, barcode, or description
 * @param {string} query
 * @param {number} userId
 */
async function searchProducts(query, userId) {
  try {
    if (!query || query.trim().length < 2) {
      return {
        status: false,
        message: "Search query must be at least 2 characters",
        data: []
      };
    }

    const productRepo = AppDataSource.getRepository(Product);
    
    const products = await productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere(
        "(product.name LIKE :query OR product.sku LIKE :query OR product.barcode LIKE :query OR product.description LIKE :query OR product.category_name LIKE :query OR product.supplier_name LIKE :query)",
        { query: `%${query}%` }
      )
      .orderBy("product.name", "ASC")
      .limit(50)
      .getMany();

    await log_audit("search", "Product", 0, userId, {
      query,
      results: products.length
    });

    return {
      status: true,
      message: "Search completed",
      data: products
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

module.exports = searchProducts;