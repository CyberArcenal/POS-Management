// src/main/ipc/inventory/get/by_id.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const InventoryMovement = require("../../../../entities/InventoryMovement");

/**
 * Get a single inventory movement by its ID.
 * @param {Object} params
 * @param {number} params.id - Movement ID.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { id } = params;
    if (!id || isNaN(id)) {
      return { status: false, message: "Valid movement ID is required", data: null };
    }

    const repo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);

    const movement = await repo.findOne({
      where: { id },
      relations: ["product", "sale"],
    });

    if (!movement) {
      return { status: false, message: `Inventory movement with ID ${id} not found`, data: null };
    }

    return {
      status: true,
      message: "Inventory movement retrieved successfully",
      data: movement,
    };
  } catch (error) {
    console.error("Error in getInventoryMovementById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve inventory movement",
      data: null,
    };
  }
};