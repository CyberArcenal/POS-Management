// src/main/ipc/loyalty/get/by_id.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const LoyaltyTransaction = require("../../../../entities/LoyaltyTransaction");

/**
 * Get a single loyalty transaction by ID
 * @param {Object} params
 * @param {number} params.id - Transaction ID
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    if (!params.id) {
      return {
        status: false,
        message: 'Missing required parameter: id',
        data: null,
      };
    }

    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);
    const transaction = await txRepo.findOne({
      where: { id: params.id },
      relations: ['customer', 'sale'],
    });

    if (!transaction) {
      return {
        status: false,
        message: `Loyalty transaction with ID ${params.id} not found`,
        data: null,
      };
    }

    return {
      status: true,
      data: transaction,
    };
  } catch (error) {
    console.error('Error in getLoyaltyTransactionById:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch loyalty transaction',
      data: null,
    };
  }
};