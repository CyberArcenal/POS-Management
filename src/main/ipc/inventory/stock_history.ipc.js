// src/main/ipc/inventory/get/stock_history.ipc.js
//@ts-check

const InventoryMovement = require("../../../entities/InventoryMovement");
const { AppDataSource } = require("../../db/datasource");

/**
 * Get stock change history for a specific product over time.
 * @param {Object} params
 * @param {number} params.productId
 * @param {string} [params.startDate] - ISO date.
 * @param {string} [params.endDate] - ISO date.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { productId, startDate, endDate } = params;
    if (!productId || isNaN(productId)) {
      return { status: false, message: "Valid product ID is required", data: null };
    }

    const repo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);

    const queryBuilder = repo
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.product", "product")
      .leftJoinAndSelect("movement.sale", "sale")
      .where("movement.productId = :productId", { productId })
      .orderBy("movement.timestamp", "ASC");

    if (startDate) {
      queryBuilder.andWhere("movement.timestamp >= :startDate", { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere("movement.timestamp <= :endDate", { endDate });
    }

    const movements = await queryBuilder.getMany();

    // Optionally compute running balance (if needed, can be done client-side)
    return {
      status: true,
      message: "Stock history retrieved",
      data: movements,
    };
  } catch (error) {
    console.error("Error in getProductStockHistory:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve stock history",
      data: null,
    };
  }
};