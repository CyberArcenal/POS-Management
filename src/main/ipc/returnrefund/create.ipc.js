// @ts-check
const returnRefundService = require("../../../services/ReturnRefundService");

/**
 * Create a new return/refund.
 * @param {Object} params - Return creation data.
 * @param {string} params.referenceNo - Unique reference number.
 * @param {number} params.saleId - ID of the original sale.
 * @param {number} params.customerId - ID of the customer.
 * @param {string} [params.reason] - Overall reason for return.
 * @param {string} params.refundMethod - 'Cash', 'Card', 'Store Credit'.
 * @param {string} [params.status='pending'] - Initial status.
 * @param {Array<{productId: number, quantity: number, unitPrice: number, reason?: string}>} params.items - Returned items.
 * @param {string} [user='system'] - Username performing action (can be passed in params).
 * @param {import('typeorm').QueryRunner} [queryRunner] - Transaction runner.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { user = "system", ...returnData } = params;
    // Basic validation
    if (
      !returnData.referenceNo ||
      !returnData.saleId ||
      !returnData.customerId ||
      !returnData.refundMethod ||
      !Array.isArray(returnData.items) ||
      returnData.items.length === 0
    ) {
      throw new Error(
        "Missing required fields: referenceNo, saleId, customerId, refundMethod, items",
      );
    }

    // If queryRunner is provided, we could pass a transactional entity manager to the service.
    // For now, we call the service directly (service does not use queryRunner yet).
    const created = await returnRefundService.create(returnData, user);
    return {
      status: true,
      message: "Return created successfully",
      data: created,
    };
  } catch (error) {
    console.error("Error in createReturn handler:", error);
    return {
      status: false,
      message: error.message || "Failed to create return",
      data: null,
    };
  }
};
