// src/main/ipc/supplier/update.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");
const supplierService = require("../../../services/SupplierService");

/**
 * Update an existing supplier (transactional)
 * @param {Object} params
 * @param {number} params.id - Supplier ID
 * @param {string} [params.name] - New name
 * @param {string} [params.contactInfo] - New contact info
 * @param {string} [params.address] - New address
 * @param {boolean} [params.isActive] - New active status
 * @param {string} [params.user] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const updated = await supplierService.update(params.id, params);

    return {
      status: true,
      data: updated,
    };
  } catch (error) {
    // @ts-ignore
    logger?.error("updateSupplier error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to update supplier",
      data: null,
    };
  }
};
