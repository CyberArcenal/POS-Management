const customerService = require("../../../../services/Customer");

/**
 * Get loyalty details for a customer (just returns the customer)
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
    // Return only relevant loyalty fields if needed
    const loyaltyData = {
      id: customer.id,
      name: customer.name,
      loyaltyPointsBalance: customer.loyaltyPointsBalance,
    };

    return {
      status: true,
      message: "Loyalty info retrieved successfully",
      data: loyaltyData,
    };
  } catch (error) {
    console.error("Error in getCustomerLoyalty:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve loyalty info",
      data: null,
    };
  }
};
