//@ts-check

const customerService = require("../../../services/Customer");

/**
 * Update an existing customer
 * @param {Object} params
 * @param {number} params.id - Customer ID
 * @param {string} [params.name] - New name
 * @param {string} [params.contactInfo] - New contact info
 * @param {number} [params.loyaltyPointsBalance] - New points balance (use with caution)
 * @param {string} [params.userId] - User performing action
 * @param {import("typeorm").QueryRunner} [queryRunner] - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const {
      id,
      name,
      contactInfo,
      loyaltyPointsBalance,
      userId = "system",
    } = params;

    if (!id || isNaN(id)) {
      throw new Error("Valid customer ID is required");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (loyaltyPointsBalance !== undefined)
      updateData.loyaltyPointsBalance = Number(loyaltyPointsBalance);

    if (Object.keys(updateData).length === 0) {
      throw new Error("No update data provided");
    }

    const updatedCustomer = await customerService.update(
      Number(id),
      updateData,
      userId,
    );
    return {
      status: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    };
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    return {
      status: false,
      message: error.message || "Failed to update customer",
      data: null,
    };
  }
};
