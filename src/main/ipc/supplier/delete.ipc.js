// src/main/ipc/supplier/delete.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");
const supplierService = require("../../../services/SupplierService");

/**
 * Soft-delete a supplier (set isActive = false) (transactional)
 * @param {Object} params
 * @param {number} params.id - Supplier ID
 * @param {string} [params.user] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const updated = await supplierService.delete(params.id);
    return {
      status: true,
      data: updated,
    };
  } catch (error) {
    // @ts-ignore
    logger?.error("deleteSupplier error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to delete supplier",
      data: null,
    };
  }
};
