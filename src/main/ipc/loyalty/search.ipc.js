// src/main/ipc/loyalty/search.ipc.js
//@ts-check

const LoyaltyTransaction = require("../../../entities/LoyaltyTransaction");
const { AppDataSource } = require("../../db/datasource");

/**
 * Search loyalty transactions by various criteria
 * @param {Object} params
 * @param {string} [params.query] - Search term for notes or customer name
 * @param {number} [params.customerId]
 * @param {number} [params.saleId]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {number} [params.minPoints]
 * @param {number} [params.maxPoints]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);
    const queryBuilder = txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.sale', 'sale');

    if (params.query) {
      queryBuilder.andWhere(
        '(tx.notes LIKE :query OR customer.name LIKE :query)',
        { query: `%${params.query}%` }
      );
    }
    if (params.customerId) {
      queryBuilder.andWhere('tx.customerId = :customerId', { customerId: params.customerId });
    }
    if (params.saleId) {
      queryBuilder.andWhere('tx.saleId = :saleId', { saleId: params.saleId });
    }
    if (params.startDate) {
      queryBuilder.andWhere('tx.timestamp >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere('tx.timestamp <= :endDate', { endDate: params.endDate });
    }
    if (params.minPoints !== undefined) {
      queryBuilder.andWhere('ABS(tx.pointsChange) >= :minPoints', { minPoints: params.minPoints });
    }
    if (params.maxPoints !== undefined) {
      queryBuilder.andWhere('ABS(tx.pointsChange) <= :maxPoints', { maxPoints: params.maxPoints });
    }

    queryBuilder.orderBy('tx.timestamp', 'DESC');

    if (params.page && params.limit) {
      const skip = (params.page - 1) * params.limit;
      queryBuilder.skip(skip).take(params.limit);
    }

    const transactions = await queryBuilder.getMany();
    const total = await queryBuilder.getCount(); // optional: add total count

    return {
      status: true,
      data: {
        transactions,
        total,
        page: params.page || 1,
        limit: params.limit || transactions.length,
      },
    };
  } catch (error) {
    console.error('Error in searchLoyaltyTransactions:', error);
    return {
      status: false,
      message: error.message || 'Failed to search loyalty transactions',
      data: null,
    };
  }
};