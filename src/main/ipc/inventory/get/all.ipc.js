// src/main/ipc/inventory/get/all.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const InventoryMovement = require("../../../../entities/InventoryMovement");

/**
 * Get all inventory movements with optional filtering and pagination.
 * @param {Object} params - Query parameters.
 * @param {number} [params.page] - Page number (1-based).
 * @param {number} [params.limit] - Items per page.
 * @param {string} [params.sortBy] - Field to sort by.
 * @param {"ASC"|"DESC"} [params.sortOrder] - Sort order.
 * @param {number} [params.productId] - Filter by product ID.
 * @param {number} [params.saleId] - Filter by sale ID.
 * @param {string} [params.movementType] - Filter by exact movement type.
 * @param {string[]} [params.movementTypes] - Filter by multiple types.
 * @param {string} [params.startDate] - ISO date string.
 * @param {string} [params.endDate] - ISO date string.
 * @param {"increase"|"decrease"} [params.direction] - Filter by quantity direction.
 * @param {string} [params.search] - Search in notes.
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional transaction query runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);

    const queryBuilder = repo
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.product", "product")
      .leftJoinAndSelect("movement.sale", "sale");

    // Apply filters
    if (params.productId) {
      queryBuilder.andWhere("movement.productId = :productId", { productId: params.productId });
    }
    if (params.saleId) {
      queryBuilder.andWhere("movement.saleId = :saleId", { saleId: params.saleId });
    }
    if (params.movementType) {
      queryBuilder.andWhere("movement.movementType = :movementType", { movementType: params.movementType });
    }
    if (params.movementTypes?.length) {
      queryBuilder.andWhere("movement.movementType IN (:...movementTypes)", { movementTypes: params.movementTypes });
    }
    if (params.startDate) {
      queryBuilder.andWhere("movement.timestamp >= :startDate", { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere("movement.timestamp <= :endDate", { endDate: params.endDate });
    }
    if (params.direction === "increase") {
      queryBuilder.andWhere("movement.qtyChange > 0");
    } else if (params.direction === "decrease") {
      queryBuilder.andWhere("movement.qtyChange < 0");
    }
    if (params.search) {
      queryBuilder.andWhere("movement.notes LIKE :search", { search: `%${params.search}%` });
    }

    // Sorting
    const sortBy = params.sortBy || "timestamp";
    const sortOrder = params.sortOrder === "ASC" ? "ASC" : "DESC";
    queryBuilder.orderBy(`movement.${sortBy}`, sortOrder);

    // Pagination
    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit;
      queryBuilder.skip(offset).take(params.limit);
    }

    const movements = await queryBuilder.getMany();

    return {
      status: true,
      message: "Inventory movements retrieved successfully",
      data: movements,
    };
  } catch (error) {
    console.error("Error in getAllInventoryMovements:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve inventory movements",
      data: null,
    };
  }
};