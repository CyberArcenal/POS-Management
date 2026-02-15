// src/main/ipc/loyalty/points_history.ipc.js
//@ts-check

const LoyaltyTransaction = require("../../../entities/LoyaltyTransaction");
const { AppDataSource } = require("../../db/datasource");

/**
 * Generate points history for a specific customer (running balance over time)
 * @param {Object} params
 * @param {number} params.customerId
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    if (!params.customerId) {
      return { status: false, message: 'customerId is required', data: null };
    }

    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);

    const queryBuilder = txRepo
      .createQueryBuilder('tx')
      .where('tx.customerId = :customerId', { customerId: params.customerId })
      .orderBy('tx.timestamp', 'ASC');

    if (params.startDate) {
      queryBuilder.andWhere('tx.timestamp >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere('tx.timestamp <= :endDate', { endDate: params.endDate });
    }

    const transactions = await queryBuilder.getMany();

    // Compute running balance
    let balance = 0;
    const history = transactions.map(tx => {
      balance += tx.pointsChange;
      return {
        id: tx.id,
        date: tx.timestamp,
        pointsChange: tx.pointsChange,
        runningBalance: balance,
        notes: tx.notes,
        saleId: tx.saleId,
      };
    });

    return {
      status: true,
      data: {
        customerId: params.customerId,
        history,
        currentBalance: balance,
      },
    };
  } catch (error) {
    console.error('Error in generatePointsHistory:', error);
    return {
      status: false,
      message: error.message || 'Failed to generate points history',
      data: null,
    };
  }
};