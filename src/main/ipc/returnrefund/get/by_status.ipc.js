// @ts-check
const returnRefundService = require("../../../../services/ReturnRefundService");

/**
 * Get returns filtered by status.
 * @param {Object} params - Request parameters.
 * @param {string} params.status - Return status (pending, processed, cancelled).
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { status } = params;
    if (!status || typeof status !== "string") {
      throw new Error("Valid status is required");
    }

    const returns = await returnRefundService.findAll({ status });
    return {
      status: true,
      message: `Returns with status '${status}' fetched successfully`,
      data: returns,
    };
  } catch (error) {
    console.error("Error in getReturnsByStatus handler:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch returns by status",
      data: null,
    };
  }
};
