// src/main/ipc/loyalty/get/by_customer.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const LoyaltyTransaction = require("../../../../entities/LoyaltyTransaction");

/**
 * Get loyalty transactions for a specific customer
 * @param {Object} params
 * @param {number} params.customerId - Customer ID
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    if (!params.customerId) {
      return {
        status: false,
        message: 'Missing required parameter: customerId',
        data: null,
      };
    }

    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);
    const queryBuilder = txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.sale', 'sale')
      .where('tx.customerId = :customerId', { customerId: params.customerId })
      .orderBy('tx.timestamp', 'DESC');

    if (params.page && params.limit) {
      const skip = (params.page - 1) * params.limit;
      queryBuilder.skip(skip).take(params.limit);
    }

    const transactions = await queryBuilder.getMany();

    return {
      status: true,
      data: transactions,
    };
  } catch (error) {
    console.error('Error in getLoyaltyTransactionsByCustomer:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch transactions for customer',
      data: null,
    };
  }
};