

const { validateCustomerData } = require("../../../utils/customerUtils");

/**
 * Bulk create customers (within a transaction)
 * @param {Object} params
 * @param {Array<{name: string, contactInfo?: string, loyaltyPointsBalance?: number}>} params.customers - Array of customer data
 * @param {string} [params.userId] - User
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { customers, userId = "system" } = params;
  const created = [];
  const errors = [];

  if (!Array.isArray(customers) || customers.length === 0) {
    return {
      status: false,
      message: "Customers array is required and must not be empty",
      data: null,
    };
  }

  try {
    // Since customerService.create does not accept queryRunner, we'll use repository directly within transaction
    const repo = queryRunner.manager.getRepository("Customer");
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    for (const [index, data] of customers.entries()) {
      try {
        const validation = validateCustomerData(data);
        if (!validation.valid) {
          errors.push({ index, errors: validation.errors });
          continue;
        }

        const customer = repo.create({
          name: data.name,
          contactInfo: data.contactInfo || null,
          loyaltyPointsBalance: data.loyaltyPointsBalance || 0,
          createdAt: new Date(),
        });

        const saved = await repo.save(customer);
        created.push(saved);

        // Audit log
        const log = auditRepo.create({
          action: "CREATE",
          entity: "Customer",
          entityId: saved.id,
          user: userId,
          timestamp: new Date(),
        });
        await auditRepo.save(log);
      } catch (err) {
        errors.push({ index, error: err.message });
      }
    }

    return {
      status: errors.length === 0,
      message:
        errors.length > 0
          ? `Bulk create completed with ${errors.length} error(s)`
          : "All customers created successfully",
      data: { created, errors },
    };
  } catch (error) {
    console.error("Error in bulkCreateCustomers:", error);
    return {
      status: false,
      message: error.message || "Bulk create failed",
      data: null,
    };
  }
};
