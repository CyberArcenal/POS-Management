const customerService = require("../../../../services/Customer");

/**
 * Get a single customer by ID
 * @param {Object} params
 * @param {number} params.id - Customer ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id } = params;
    if (!id || isNaN(id)) {
      throw new Error("Valid customer ID is required");
    }

    const customer = await customerService.findById(Number(id));
    return {
      status: true,
      message: "Customer retrieved successfully",
      data: customer,
    };
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve customer",
      data: null,
    };
  }
};
