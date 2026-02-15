

const Customer = require("../../../entities/Customer");

/**
 * Soft delete a customer (mark as inactive) – hard delete not allowed.
 * Note: Since Customer entity lacks `isActive`, we return error.
 * @param {Object} params
 * @param {number} params.id - Customer ID
 * @param {string} [params.userId] - User performing action
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { id, userId = "system" } = params;

    if (!id || isNaN(id)) {
      throw new Error("Valid customer ID is required");
    }

    // Check if customer exists
    const repo = queryRunner.manager.getRepository(Customer);
    const customer = await repo.findOne({ where: { id: Number(id) } });
    if (!customer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    // Since no `isActive` field, we cannot soft delete.
    // Option: throw error or implement hard delete with caution.
    // For data integrity, we reject deletion.
    return {
      status: false,
      message:
        "Deletion of customers is not allowed to preserve historical records. Use deactivation (not implemented) instead.",
      data: null,
    };

    // If we had an isActive field:
    // customer.isActive = false;
    // await repo.save(customer);
    // await auditLogger.logUpdate("Customer", id, { isActive: true }, { isActive: false }, userId);
    // return { status: true, message: "Customer deactivated successfully", data: customer };
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    return {
      status: false,
      message: error.message || "Failed to delete customer",
      data: null,
    };
  }
};
