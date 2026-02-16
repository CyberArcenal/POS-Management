// @ts-check
const returnRefundService = require("../../../../services/ReturnRefundService");

/**
 * Get aggregated statistics about returns.
 * @param {Object} params - (No parameters expected, kept for consistency)
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const statistics = await returnRefundService.getStatistics();
    return {
      status: true,
      message: "Return statistics fetched successfully",
      data: statistics,
    };
  } catch (error) {
    console.error("Error in getReturnStatistics handler:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch return statistics",
      data: null,
    };
  }
};
