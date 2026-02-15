// src/main/ipc/loyalty/add_points.ipc.js
//@ts-check
const auditLogger = require("../../../utils/auditLogger");

/**
 * Add loyalty points to a customer (wrapper around create)
 * @param {Object} params
 * @param {number} params.customerId
 * @param {number} params.points - Positive number of points to add
 * @param {string} [params.notes]
 * @param {number} [params.saleId]
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    if (!params.customerId) {
      return { status: false, message: 'customerId is required', data: null };
    }
    if (!params.points || params.points <= 0) {
      return { status: false, message: 'points must be a positive number', data: null };
    }

    // Reuse create handler logic but ensure points are positive
    const createHandler = require('./create.ipc');
    const result = await createHandler(
      {
        customerId: params.customerId,
        pointsChange: params.points,
        notes: params.notes || 'Points added',
        saleId: params.saleId,
        user: params.user,
      },
      queryRunner
    );

    return result;
  } catch (error) {
    console.error('Error in addLoyaltyPoints:', error);
    return {
      status: false,
      message: error.message || 'Failed to add loyalty points',
      data: null,
    };
  }
};