// src/main/ipc/inventory/get/stock_alerts.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const Product = require("../../../../entities/Product");

/**
 * Get products with low stock (below threshold).
 * @param {Object} params
 * @param {number} [params.threshold=5] - Stock threshold.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const threshold = params.threshold || 5;

    const repo = queryRunner
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);

    const lowStockProducts = await repo
      .createQueryBuilder("product")
      .where("product.stockQty <= :threshold", { threshold })
      .andWhere("product.isActive = :active", { active: true })
      .orderBy("product.stockQty", "ASC")
      .getMany();

    return {
      status: true,
      message: "Stock alerts retrieved",
      data: lowStockProducts,
    };
  } catch (error) {
    console.error("Error in getStockAlerts:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve stock alerts",
      data: null,
    };
  }
};