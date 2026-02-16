// @ts-check
const returnRefundService = require("../../../../services/ReturnRefundService");

/**
 * Get items belonging to a specific return.
 * @param {Object} params - Request parameters.
 * @param {number} params.returnId - Return ID.
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { returnId } = params;
    if (!returnId || typeof returnId !== "number") {
      throw new Error("Valid return ID is required");
    }

    const returnRefund = await returnRefundService.findById(returnId);
    // The service already includes items relation.
    return {
      status: true,
      message: "Return items fetched successfully",
      data: returnRefund?.items || [],
    };
  } catch (error) {
    console.error("Error in getReturnItems handler:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch return items",
      data: null,
    };
  }
};
