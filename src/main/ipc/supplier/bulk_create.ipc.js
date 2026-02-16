// src/main/ipc/supplier/bulk_create.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");

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
    const Supplier = require("../../../entities/Supplier");
    const supplierRepo = queryRunner.manager.getRepository(Supplier);

    const created = [];
    const errors = [];

    for (const data of suppliers) {
      const { name, contactInfo, address, isActive = true } = data;

      if (!name || typeof name !== "string") {
        errors.push({ data, error: "Missing or invalid name" });
        continue;
      }

      // Check uniqueness within the batch (and existing DB)
      const existing = await supplierRepo.findOne({ where: { name } });
      if (existing) {
        errors.push({ data, error: `Name "${name}" already exists` });
        continue;
      }

      const supplier = supplierRepo.create({
        name,
        contactInfo,
        address,
        isActive,
        createdAt: new Date(),
      });
      const saved = await supplierRepo.save(supplier);
      created.push(saved);
    }

    // Audit log for each successful creation
    for (const sup of created) {
      await auditLogger.logCreate("Supplier", sup.id, sup, user, queryRunner.manager);
    }

    logger?.info(`Bulk created ${created.length} suppliers, ${errors.length} failed`);
    return {
      status: true,
      data: { created, errors },
    };
  } catch (error) {
    logger?.error("bulkCreateSuppliers error:", error);
    return {
      status: false,
      message: error.message || "Failed to bulk create suppliers",
      data: null,
    };
  }
};