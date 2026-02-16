// @ts-check
const returnRefundService = require("../../../../services/ReturnRefundService");

/**
 * Get returns within a date range.
 * @param {Object} params - Request parameters.
 * @param {string} params.startDate - ISO date string (e.g., '2025-01-01').
 * @param {string} [params.endDate] - ISO date string (defaults to now).
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { startDate, endDate } = params;
    if (!startDate || typeof startDate !== "string") {
      throw new Error("Valid startDate is required");
    }

    const filters = {
      startDate: new Date(startDate),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    const returns = await returnRefundService.findAll(filters);
    return {
      status: true,
      message: "Returns by date fetched successfully",
      data: returns,
    };
  } catch (error) {
    console.error("Error in getReturnsByDate handler:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch returns by date",
      data: null,
    };
  }
};
