//@ts-check
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");


/**
 * Get all products (with optional filters)
 * @param {Object} filters
 * @param {number} userId
 */
async function getAllProducts(filters = {}, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false });

    // Apply filters
    // @ts-ignore
    if (filters.category_name) {
      queryBuilder.andWhere("product.category_name = :category_name", {
        // @ts-ignore
        category_name: filters.category_name,
      });
    }

    // @ts-ignore
    if (filters.supplier_name) {
      queryBuilder.andWhere("product.supplier_name = :supplier_name", {
        // @ts-ignore
        supplier_name: filters.supplier_name,
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

    // @ts-ignore
    if (filters.out_of_stock_only) {
      queryBuilder.andWhere("product.stock = 0");
    }

    // @ts-ignore
    if (filters.has_stock_item_id) {
      queryBuilder.andWhere("product.stock_item_id IS NOT NULL");
    }

    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("product.is_active = :is_active", {
        // @ts-ignore
        is_active: filters.is_active,
      });
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

    await log_audit("fetch_all", "Product", 0, userId, {
      filters,
      count: products.length
    });

    return {
      status: true,
      message: "Products fetched successfully",
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

module.exports = getAllProducts;