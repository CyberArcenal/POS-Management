//@ts-check

const customerService = require("../../../services/Customer");

/**
 * Directly set loyalty points (use with caution; prefer add/redeem)
 * @param {Object} params
 * @param {number} params.id - Customer ID
 * @param {number} params.points - New points balance
 * @param {string} [params.notes] - Reason for change
 * @param {string} [params.userId] - User performing action
 * @param {import("typeorm").QueryRunner} [queryRunner] - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const {
      id,
      points,
      notes = "Manual adjustment",
      userId = "system",
    } = params;

    if (!id || isNaN(id)) {
      throw new Error("Valid customer ID is required");
    }
    if (points === undefined || isNaN(points)) {
      throw new Error("Points value is required");
    }

    // Get current customer to compute delta
    const customer = await customerService.findById(Number(id));
    const currentPoints = customer.loyaltyPointsBalance;
    const delta = Number(points) - currentPoints;

    if (delta === 0) {
      return {
        status: true,
        message: "No change in loyalty points",
        data: customer,
      };
    }

    // Use add/redeem methods to ensure transaction logging
    let result;
    if (delta > 0) {
      result = await customerService.addLoyaltyPoints(
        Number(id),
        delta,
        notes,
        null,
        userId,
      );
    } else {
      result = await customerService.redeemLoyaltyPoints(
        Number(id),
        -delta,
        notes,
        null,
        userId,
      );
    }

    return {
      status: true,
      message: "Loyalty points updated successfully",
      data: result.customer,
    };
  } catch (error) {
    console.error("Error in updateLoyaltyPoints:", error);
    return {
      status: false,
      message: error.message || "Failed to update loyalty points",
      data: null,
    };
  }
};
