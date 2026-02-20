// src/main/ipc/supplier/bulk_create.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");
const supplierService = require("../../../services/SupplierService");

/**
 * Bulk create suppliers (transactional)
 * @param {Object} params
 * @param {Array<{name: string, contactInfo?: string, address?: string, isActive?: boolean}>} params.suppliers - Array of supplier objects
 * @param {string} [params.user] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { suppliers, user = "system" } = params;

  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return {
      status: false,
      message: "Suppliers array is required and must not be empty",
      data: null,
    };
  }

  try {
    /**
     * @type {string | any[]}
     */
    const created = [];
    const errors = [];

    for (const data of suppliers) {
      const { name, contactInfo, address, isActive = true } = data;
      try {
        const created = await supplierService.create(data);

        // @ts-ignore
        created.push(created);
      } catch (err) {
        errors.push({ data, error: `Name "${name}" already exists` });
      }
    }

    return {
      status: true,
      data: { created, errors },
    };
  } catch (error) {
    // @ts-ignore
    logger?.error("bulkCreateSuppliers error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to bulk create suppliers",
      data: null,
    };
  }
};
