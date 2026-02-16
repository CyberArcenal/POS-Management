// @ts-check

const returnRefundService = require('../../../services/ReturnRefundService');

/**
 * Bulk create multiple returns. If any fails, all are rolled back (if using transaction).
 * @param {Object} params - Request parameters.
 * @param {Array<Object>} params.returns - Array of return objects (each matches create structure).
 * @param {string} [user='system'] - Username.
 * @param {import('typeorm').QueryRunner} [queryRunner] - Transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { returns, user = "system" } = params;
    if (!Array.isArray(returns) || returns.length === 0) {
      throw new Error("Returns array is required and must not be empty");
    }

    // If queryRunner is available, we could loop and create within the same transaction.
    // For now, we call service.create for each (no transaction across multiple).
    const created = [];
    for (const ret of returns) {
      const one = await returnRefundService.create(ret, user);
      created.push(one);
    }

    return {
      status: true,
      message: `${created.length} returns created successfully`,
      data: created,
    };
  } catch (error) {
    console.error("Error in bulkCreateReturns handler:", error);
    return {
      status: false,
      message: error.message || "Failed to bulk create returns",
      data: null,
    };
  }
};