// src/main/ipc/inventory/search.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/datasource");
const InventoryMovement = require("../../../entities/InventoryMovement");

/**
 * Search inventory movements by keyword (notes) and optional filters.
 * @param {Object} params
 * @param {string} params.keyword - Search term.
 * @param {number} [params.limit] - Max results.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { keyword, limit = 50 } = params;
    if (!keyword || keyword.trim() === "") {
      return { status: false, message: "Search keyword is required", data: null };
    }

    const repo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);

    const movements = await repo
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.product", "product")
      .leftJoinAndSelect("movement.sale", "sale")
      .where("movement.notes LIKE :keyword", { keyword: `%${keyword}%` })
      .orderBy("movement.timestamp", "DESC")
      .take(limit)
      .getMany();

    return {
      status: true,
      message: "Search completed",
      data: movements,
    };
  } catch (error) {
    console.error("Error in searchInventoryMovements:", error);
    return {
      status: false,
      message: error.message || "Search failed",
      data: null,
    };
  }
};