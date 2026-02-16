// src/main/ipc/supplier/update.ipc
// @ts-check
const { logger } = require("../../../utils/logger");
const auditLogger = require("../../../utils/auditLogger");

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
  const { id, name, contactInfo, address, isActive, user = "system" } = params;

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

    const oldData = { ...supplier };

    // If name is changing, check uniqueness
    if (name && name !== supplier.name) {
      const existing = await supplierRepo.findOne({ where: { name } });
      if (existing) {
        return {
          status: false,
          message: `Supplier with name "${name}" already exists`,
          data: null,
        };
      }
      supplier.name = name;
    }

    if (contactInfo !== undefined) supplier.contactInfo = contactInfo;
    if (address !== undefined) supplier.address = address;
    if (isActive !== undefined) supplier.isActive = isActive;
    supplier.updatedAt = new Date();

    const updated = await supplierRepo.save(supplier);

    await auditLogger.logUpdate("Supplier", id, oldData, updated, user, queryRunner.manager);

    logger?.info(`Supplier updated: #${id}`);
    return {
      status: true,
      data: updated,
    };
  } catch (error) {
    logger?.error("updateSupplier error:", error);
    return {
      status: false,
      message: error.message || "Failed to update supplier",
      data: null,
    };
  }
};