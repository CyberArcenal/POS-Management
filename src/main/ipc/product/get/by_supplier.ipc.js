//@ts-check
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get products by supplier
 * @param {string} supplierName
 * @param {Object} filters
 * @param {number} userId
 */
async function getProductsBySupplier(supplierName, filters = {}, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("product.supplier_name = :supplier_name", { supplier_name: supplierName });

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

    await log_audit("fetch_by_supplier", "Product", 0, userId, {
      supplierName,
      count: products.length
    });

    return {
      status: true,
      message: "Products fetched by supplier",
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

module.exports = getProductsBySupplier;