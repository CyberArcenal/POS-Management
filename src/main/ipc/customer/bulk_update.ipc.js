

const Customer = require("../../../entities/Customer");

/**
 * Bulk update customers (partial updates)
 * @param {Object} params
 * @param {Array<{id: number, name?: string, contactInfo?: string, loyaltyPointsBalance?: number}>} params.updates - Array of updates
 * @param {string} [params.userId] - User
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { updates, userId = "system" } = params;
  const updated = [];
  const errors = [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return {
      status: false,
      message: "Updates array is required and must not be empty",
      data: null,
    };
  }

  try {
    const repo = queryRunner.manager.getRepository(Customer);
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    for (const item of updates) {
      try {
        const { id, ...changes } = item;
        if (!id || isNaN(id)) {
          errors.push({ item, error: "Missing or invalid id" });
          continue;
        }

        const customer = await repo.findOne({ where: { id: Number(id) } });
        if (!customer) {
          errors.push({ id, error: "Customer not found" });
          continue;
        }

        const oldData = { ...customer };
        Object.assign(customer, changes);
        customer.updatedAt = new Date();

        const saved = await repo.save(customer);
        updated.push(saved);

        // Audit log
        const log = auditRepo.create({
          action: "UPDATE",
          entity: "Customer",
          entityId: saved.id,
          user: userId,
          oldData,
          newData: saved,
          timestamp: new Date(),
        });
        await auditRepo.save(log);
      } catch (err) {
        errors.push({ item, error: err.message });
      }
    }

    return {
      status: errors.length === 0,
      message:
        errors.length > 0
          ? `Bulk update completed with ${errors.length} error(s)`
          : "All customers updated successfully",
      data: { updated, errors },
    };
  } catch (error) {
    console.error("Error in bulkUpdateCustomers:", error);
    return {
      status: false,
      message: error.message || "Bulk update failed",
      data: null,
    };
  }
};
