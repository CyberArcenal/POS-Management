// src/main/ipc/supplier/get/with_product_count.ipc
// @ts-check
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get suppliers with product count (active only)
 * @param {Object} params - (unused)
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const Supplier = require("../../../entities/Supplier");
    const supplierRepo = AppDataSource.getRepository(Supplier);

    const result = await supplierRepo
      .createQueryBuilder("supplier")
      .leftJoin("supplier.products", "product")
      .select("supplier.id", "id")
      .addSelect("supplier.name", "name")
      .addSelect("COUNT(product.id)", "productCount")
      .where("supplier.isActive = :isActive", { isActive: true })
      .groupBy("supplier.id")
      .orderBy("productCount", "DESC")
      .getRawMany();

    return {
      status: true,
      data: result,
    };
  } catch (error) {
    logger?.error("getSuppliersWithProductCount error:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch suppliers with product count",
      data: null,
    };
  }
};