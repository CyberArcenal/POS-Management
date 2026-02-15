const customerService = require("../../../../services/Customer");

/**
 * Get all customers with optional filters
 * @param {Object} params
 * @param {string} [params.search] - Search term for name or contact
 * @param {number} [params.minPoints] - Minimum loyalty points
 * @param {number} [params.maxPoints] - Maximum loyalty points
 * @param {string} [params.sortBy] - Field to sort by
 * @param {string} [params.sortOrder] - Sort order ('ASC' or 'DESC')
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const options = {
      search: params.search,
      minPoints: params.minPoints,
      maxPoints: params.maxPoints,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page: params.page,
      limit: params.limit,
    };

    // Remove undefined keys
    Object.keys(options).forEach(
      (key) => options[key] === undefined && delete options[key],
    );

    const customers = await customerService.findAll(options);
    return {
      status: true,
      message: "Customers retrieved successfully",
      data: customers,
    };
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve customers",
      data: null,
    };
  }
};
