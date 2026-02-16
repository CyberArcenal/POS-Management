// @ts-check
const returnRefundService = require("../../../../services/ReturnRefundService");

/**
 * Get a single return by its ID.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Return ID.
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { id } = params;
    if (!id || typeof id !== "number") {
      throw new Error("Valid return ID is required");
    }

    const returnRefund = await returnRefundService.findById(id);
    return {
      status: true,
      message: "Return fetched successfully",
      data: returnRefund,
    };
  } catch (error) {
    console.error("Error in getReturnById handler:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch return",
      data: null,
    };
  }
};
