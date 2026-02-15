// src/main/ipc/loyalty/get/statistics.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const LoyaltyTransaction = require("../../../../entities/LoyaltyTransaction");

/**
 * Get loyalty statistics (totals, trends, top customers)
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async () => {
  try {
    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);

    // Total points earned
    const earnedResult = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.pointsChange)', 'total')
      .where('tx.pointsChange > 0')
      .getRawOne();
    const totalEarned = parseFloat(earnedResult?.total) || 0;

    // Total points redeemed
    const redeemedResult = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.pointsChange))', 'total')
      .where('tx.pointsChange < 0')
      .getRawOne();
    const totalRedeemed = parseFloat(redeemedResult?.total) || 0;

    // Transaction counts
    const earnCount = await txRepo.count({ where: { pointsChange: { $gt: 0 } } }); // adjust if SQLite syntax differs
    const redeemCount = await txRepo.count({ where: { pointsChange: { $lt: 0 } } });

    // Top customers by transaction count
    const topCustomers = await txRepo
      .createQueryBuilder('tx')
      .select('tx.customerId', 'customerId')
      .addSelect('COUNT(*)', 'transactionCount')
      .addSelect('SUM(tx.pointsChange)', 'netPoints')
      .groupBy('tx.customerId')
      .orderBy('transactionCount', 'DESC')
      .limit(5)
      .getRawMany();

    // Monthly trends (last 6 months)
    const monthly = await txRepo
      .createQueryBuilder('tx')
      .select([
        "strftime('%Y-%m', tx.timestamp) as month",
        'COUNT(*) as count',
        "SUM(CASE WHEN tx.pointsChange > 0 THEN tx.pointsChange ELSE 0 END) as earned",
        "SUM(CASE WHEN tx.pointsChange < 0 THEN ABS(tx.pointsChange) ELSE 0 END) as redeemed",
      ])
      .where("tx.timestamp >= date('now', '-6 months')")
      .groupBy("strftime('%Y-%m', tx.timestamp)")
      .orderBy('month', 'DESC')
      .getRawMany();

    return {
      status: true,
      data: {
        totalEarned,
        totalRedeemed,
        netPoints: totalEarned - totalRedeemed,
        transactionCounts: { earn: earnCount, redeem: redeemCount },
        topCustomers,
        monthlyTrends: monthly,
      },
    };
  } catch (error) {
    console.error('Error in getLoyaltyStatistics:', error);
    return {
      status: false,
      message: error.message || 'Failed to compute loyalty statistics',
      data: null,
    };
  }
};