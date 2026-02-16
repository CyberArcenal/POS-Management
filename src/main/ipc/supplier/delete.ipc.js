// src/main/ipc/supplier/delete.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");

/**
 * Soft-delete a supplier (set isActive = false) (transactional)
 * @param {Object} params
 * @param {number} params.id - Supplier ID
 * @param {string} [params.user] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;

  if (!id || isNaN(Number(id))) {
    return {
      status: false,
      message: "Valid supplier ID is required",
      data: null,
    };
  }

  try {
    const Supplier = require("../../../entities/Supplier");
    const supplierRepo = queryRunner.manager.getRepository(Supplier);

    const supplier = await supplierRepo.findOne({ where: { id: Number(id) } });
    if (!supplier) {
      return {
        status: false,
        message: `Supplier with ID ${id} not found`,
        data: null,
      };
    }

    if (!supplier.isActive) {
      return {
        status: false,
        message: `Supplier #${id} is already inactive`,
        data: null,
      };
    }

    const oldData = { ...supplier };
    supplier.isActive = false;
    supplier.updatedAt = new Date();

    const updated = await supplierRepo.save(supplier);

    await auditLogger.logDelete("Supplier", id, oldData, user, queryRunner.manager);

    logger?.info(`Supplier deactivated: #${id}`);
    return {
      status: true,
      data: updated,
    };
  } catch (error) {
    logger?.error("deleteSupplier error:", error);
    return {
      status: false,
      message: error.message || "Failed to delete supplier",
      data: null,
    };
  }
};