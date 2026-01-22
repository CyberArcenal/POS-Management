// loyalty/analytics/stats.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { RedemptionHistory } = require("../../../../entities/RedemptionHistory");
const { RewardItem } = require("../../../../entities/RewardItem");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
async function getLoyaltyStats(date_range = {}, userId) {
  try {
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    const pointsRepo = AppDataSource.getRepository(PointsTransaction);
    const redemptionRepo = AppDataSource.getRepository(RedemptionHistory);
    const rewardRepo = AppDataSource.getRepository(RewardItem);

    // Date filters
    // @ts-ignore
    const startDate = date_range.start_date ? new Date(date_range.start_date) : new Date();
    // @ts-ignore
    const endDate = date_range.end_date ? new Date(date_range.end_date) : new Date();
    
    // @ts-ignore
    if (!date_range.start_date) {
      startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
    }

    // Total members
    const totalMembers = await loyaltyRepo.count({ where: { is_active: true } });
    const activeMembers = await loyaltyRepo.count({ 
      where: { 
        is_active: true,
        last_points_activity: { $gte: startDate } 
      } 
    });

    // Points statistics
    const pointsStats = await pointsRepo
      .createQueryBuilder("transaction")
      .select([
        "SUM(CASE WHEN transaction.transaction_type IN ('earn', 'bonus') THEN transaction.points_amount ELSE 0 END) as total_points_issued",
        "SUM(CASE WHEN transaction.transaction_type = 'redeem' THEN transaction.points_amount ELSE 0 END) as total_points_redeemed",
      ])
      .where("transaction.created_at BETWEEN :start AND :end", { start: startDate, end: endDate })
      .getRawOne();

    // Outstanding points
    const outstandingPoints = await loyaltyRepo
      .createQueryBuilder("customer")
      .select("SUM(customer.available_points)", "outstanding_points")
      .where("customer.is_active = true")
      .getRawOne();

    // Redemptions
    const redemptionsToday = await redemptionRepo.count({
      where: {
        redemption_date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const redemptionsThisMonth = await redemptionRepo.count({
      where: {
        redemption_date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // Signups
    const signupsToday = await loyaltyRepo.count({
      where: {
        created_at: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    // Tier distribution
    const tierDistribution = await loyaltyRepo
      .createQueryBuilder("customer")
      .select("customer.tier, COUNT(*) as count")
      .where("customer.is_active = true")
      .groupBy("customer.tier")
      .orderBy("count", "DESC")
      .getRawMany();

    const totalActive = tierDistribution.reduce((sum, tier) => sum + parseInt(tier.count), 0);
    
    const tierDistributionWithPercentage = tierDistribution.map(tier => ({
      tier: tier.customer_tier,
      count: parseInt(tier.count),
      percentage: totalActive > 0 ? (parseInt(tier.count) / totalActive) * 100 : 0,
    }));

    // Points expiring soon (next 30 days)
    const expiringSoon = await pointsRepo
      .createQueryBuilder("transaction")
      .select("SUM(transaction.points_amount)", "points_expiring_soon")
      .where("transaction.expiration_date BETWEEN :now AND :future", {
        now: new Date(),
        future: new Date(new Date().setDate(new Date().getDate() + 30)),
      })
      .andWhere("transaction.status = 'active'")
      .getRawOne();

    // Total reward value (estimated)
    const rewards = await rewardRepo.find({ where: { is_active: true } });
    const totalRewardValue = rewards.reduce((sum, reward) => {
      if (reward.cash_value) {
        // @ts-ignore
        return sum + reward.cash_value;
      } else if (reward.discount_percentage) {
        // Estimate value based on discount
        // @ts-ignore
        return sum + (reward.discount_percentage / 100) * 100; // Assuming $100 average purchase
      }
      return sum;
    }, 0);

    // Average points per member
    const averagePointsPerMember = totalMembers > 0 ? 
      (outstandingPoints.outstanding_points || 0) / totalMembers : 0;

    const stats = {
      total_members: totalMembers,
      active_members: activeMembers,
      total_points_issued: parseInt(pointsStats.total_points_issued) || 0,
      total_points_redeemed: parseInt(pointsStats.total_points_redeemed) || 0,
      outstanding_points: parseInt(outstandingPoints.outstanding_points) || 0,
      average_points_per_member: Math.round(averagePointsPerMember),
      redemptions_today: redemptionsToday,
      redemptions_this_month: redemptionsThisMonth,
      signups_today: signupsToday,
      tier_distribution: tierDistributionWithPercentage,
      points_expiring_soon: parseInt(expiringSoon.points_expiring_soon) || 0,
      total_reward_value: totalRewardValue,
    };

    return {
      status: true,
      message: "Loyalty stats retrieved successfully",
      data: stats,
    };
  } catch (error) {
    console.error("getLoyaltyStats error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get loyalty stats: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getLoyaltyStats;