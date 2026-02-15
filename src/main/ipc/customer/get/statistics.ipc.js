const customerService = require("../../../../services/Customer");

/**
 * Get customer statistics
 * @param {Object} params - (unused, kept for consistency)
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const stats = await customerService.getStatistics();
    return {
      status: true,
      message: "Customer statistics retrieved successfully",
      data: stats,
    };
  } catch (error) {
    console.error("Error in getCustomerStatistics:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve statistics",
      data: null,
    };
  }
};
