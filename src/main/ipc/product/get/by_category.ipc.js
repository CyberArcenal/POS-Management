//@ts-check
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get products by category
 * @param {string} categoryName
 * @param {Object} filters
 * @param {number} userId
 */
async function getProductsByCategory(categoryName, filters = {}, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("product.category_name = :category_name", { category_name: categoryName });

    // Apply additional filters
    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("product.is_active = :is_active", {
        // @ts-ignore
        is_active: filters.is_active,
      });
    }

    // @ts-ignore
    if (filters.in_stock_only) {
      queryBuilder.andWhere("product.stock > 0");
    }

    // @ts-ignore
    if (filters.low_stock_only) {
      queryBuilder.andWhere("product.stock <= product.min_stock AND product.stock > 0");
    }

    // Sort
    // @ts-ignore
    if (filters.sort_by) {
      // @ts-ignore
      const direction = filters.sort_order === 'desc' ? 'DESC' : 'ASC';
      // @ts-ignore
      queryBuilder.orderBy(`product.${filters.sort_by}`, direction);
    } else {
      queryBuilder.orderBy("product.name", "ASC");
    }

    const products = await queryBuilder.getMany();

    await log_audit("fetch_by_category", "Product", 0, userId, {
      categoryName,
      count: products.length
    });

    return {
      status: true,
      message: "Products fetched by category",
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

module.exports = getProductsByCategory;