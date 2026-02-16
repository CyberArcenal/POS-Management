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
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { name, contactInfo, address, isActive = true, user = "system" } = params;

  if (!name || typeof name !== "string") {
    return {
      status: false,
      message: "Supplier name is required",
      data: null,
    };
  }

  try {
    // Use queryRunner's manager to keep transaction
    const Supplier = require("../../../entities/Supplier");
    const supplierRepo = queryRunner.manager.getRepository(Supplier);

    // Check uniqueness
    const existing = await supplierRepo.findOne({ where: { name } });
    if (existing) {
      return {
        status: false,
        message: `Supplier with name "${name}" already exists`,
        data: null,
      };
    }

    const supplier = supplierRepo.create({
      name,
      contactInfo,
      address,
      isActive,
      createdAt: new Date(),
    });

    const saved = await supplierRepo.save(supplier);

    // Audit log (use queryRunner for consistency)
    await auditLogger.logCreate("Supplier", saved.id, saved, user, queryRunner.manager);

    logger?.info(`Supplier created: #${saved.id} - ${saved.name}`);
    return {
      status: true,
      data: saved,
    };
  } catch (error) {
    logger?.error("createSupplier error:", error);
    return {
      status: false,
      message: error.message || "Failed to create supplier",
      data: null,
    };
  }
};