// src/main/ipc/supplier/create.ipc
// @ts-check
const supplierService = require("../../../services/SupplierService");
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");

/**
 * Create a new supplier (transactional)
 * @param {Object} params
 * @param {string} params.name - Supplier name (required)
 * @param {string} [params.contactInfo] - Contact info
 * @param {string} [params.address] - Address
 * @param {boolean} [params.isActive] - Active status (default true)
 * @param {string} [params.user] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 */
module.exports = async (params, queryRunner) => {
  try {
    const saveSupplier = await supplierService.create(params);
    return {
      status: true,
      message: "Supplier created successfully",
      data: saveSupplier,
    };
  } catch (error) {
    // @ts-ignore
    logger?.error("createSupplier error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to create supplier",
      data: null,
    };
  }
};
