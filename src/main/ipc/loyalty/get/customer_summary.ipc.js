// src/main/ipc/loyalty/get/customer_summary.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const Customer = require("../../../../entities/Customer");
const LoyaltyTransaction = require("../../../../entities/LoyaltyTransaction");

/**
 * Get loyalty summary for a specific customer
 * @param {Object} params
 * @param {number} params.customerId - Customer ID
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

    const customerRepo = AppDataSource.getRepository(Customer);
    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);

    const customer = await customerRepo.findOne({
      where: { id: params.customerId },
    });

    if (!customer) {
      return {
        status: false,
        message: `Customer with ID ${params.customerId} not found`,
        data: null,
      };
    }

    // Recent transactions
    const recentTransactions = await txRepo.find({
      where: { customer: { id: params.customerId } },
      relations: ['sale'],
      order: { timestamp: 'DESC' },
      take: 10,
    });

    // Points earned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const earnedThisMonth = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.pointsChange)', 'total')
      .where('tx.customerId = :customerId', { customerId: params.customerId })
      .andWhere('tx.pointsChange > 0')
      .andWhere('tx.timestamp >= :start', { start: startOfMonth })
      .getRawOne();

    // Points redeemed this month
    const redeemedThisMonth = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.pointsChange))', 'total')
      .where('tx.customerId = :customerId', { customerId: params.customerId })
      .andWhere('tx.pointsChange < 0')
      .andWhere('tx.timestamp >= :start', { start: startOfMonth })
      .getRawOne();

    return {
      status: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          loyaltyPointsBalance: customer.loyaltyPointsBalance,
        },
        summary: {
          earnedThisMonth: parseFloat(earnedThisMonth?.total) || 0,
          redeemedThisMonth: parseFloat(redeemedThisMonth?.total) || 0,
        },
        recentTransactions,
      },
    };
  } catch (error) {
    console.error('Error in getCustomerLoyaltySummary:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch customer loyalty summary',
      data: null,
    };
  }
};