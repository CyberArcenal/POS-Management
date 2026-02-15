

const customerService = require("../../../services/Customer");

/**
 * Export customers to CSV
 * @param {Object} params
 * @param {Object} [params.filters] - Same filters as findAll
 * @param {string} [params.userId] - User
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { filters = {}, userId = "system" } = params;
    const exportData = await customerService.exportCustomers(
      "csv",
      filters,
      userId,
    );
    return {
      status: true,
      message: "Export generated successfully",
      data: exportData,
    };
  } catch (error) {
    console.error("Error in exportCustomersToCSV:", error);
    return {
      status: false,
      message: error.message || "Failed to export customers",
      data: null,
    };
  }
};
