// loyalty/redemptions/history.ipc.js
//@ts-check

const { RedemptionHistory } = require("../../../../entities/RedemptionHistory");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} userId
 */
// @ts-ignore
async function getRedemptionHistory(filters = {}, userId) {
  try {
    const redemptionRepo = AppDataSource.getRepository(RedemptionHistory);
    
    const queryBuilder = redemptionRepo
      .createQueryBuilder("redemption")
      .leftJoinAndSelect("redemption.customer", "customer")
      .leftJoinAndSelect("redemption.reward", "reward")
      .orderBy("redemption.redemption_date", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.customer_id) {
      queryBuilder.andWhere("redemption.customer_id = :customer_id", {
        // @ts-ignore
        customer_id: filters.customer_id,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("redemption.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.reward_id) {
      queryBuilder.andWhere("redemption.reward_id = :reward_id", {
        // @ts-ignore
        reward_id: filters.reward_id,
      });
    }

    // @ts-ignore
    if (filters.fulfillment_method) {
      queryBuilder.andWhere("redemption.fulfillment_method = :method", {
        // @ts-ignore
        method: filters.fulfillment_method,
      });
    }

    // @ts-ignore
    if (filters.start_date) {
      queryBuilder.andWhere("redemption.redemption_date >= :start_date", {
        // @ts-ignore
        start_date: new Date(filters.start_date),
      });
    }

    // @ts-ignore
    if (filters.end_date) {
      queryBuilder.andWhere("redemption.redemption_date <= :end_date", {
        // @ts-ignore
        end_date: new Date(filters.end_date),
      });
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.customer_code LIKE :search OR redemption.redemption_code LIKE :search OR reward.reward_name LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // Pagination
    // @ts-ignore
    const page = filters.page || 1;
    // @ts-ignore
    const pageSize = filters.pageSize || 50;
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);

    const redemptions = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate summary stats
    const summary = await redemptionRepo
      .createQueryBuilder("redemption")
      .select([
        "COUNT(*) as total_redemptions",
        "SUM(redemption.points_cost) as total_points_redeemed",
        "SUM(CASE WHEN redemption.status = 'completed' THEN 1 ELSE 0 END) as completed_redemptions",
        "SUM(CASE WHEN redemption.status = 'pending' THEN 1 ELSE 0 END) as pending_redemptions",
        "SUM(CASE WHEN redemption.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_redemptions",
      ])
      .getRawOne();

    // Group by status for chart
    const statusDistribution = await redemptionRepo
      .createQueryBuilder("redemption")
      .select("redemption.status, COUNT(*) as count, SUM(redemption.points_cost) as total_points")
      .groupBy("redemption.status")
      .getRawMany();

    // Most popular rewards
    const popularRewards = await redemptionRepo
      .createQueryBuilder("redemption")
      .select([
        "redemption.reward_id",
        "reward.reward_name",
        "COUNT(*) as redemption_count",
        "SUM(redemption.points_cost) as total_points_cost",
      ])
      .leftJoin("redemption.reward", "reward")
      .groupBy("redemption.reward_id")
      .orderBy("redemption_count", "DESC")
      .limit(10)
      .getRawMany();

    return {
      status: true,
      message: "Redemption history retrieved successfully",
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      summary: {
        total_redemptions: parseInt(summary.total_redemptions) || 0,
        total_points_redeemed: parseInt(summary.total_points_redeemed) || 0,
        completed_redemptions: parseInt(summary.completed_redemptions) || 0,
        pending_redemptions: parseInt(summary.pending_redemptions) || 0,
        cancelled_redemptions: parseInt(summary.cancelled_redemptions) || 0,
        completion_rate: summary.total_redemptions > 0 ? 
          (parseInt(summary.completed_redemptions) / parseInt(summary.total_redemptions)) * 100 : 0,
      },
      analytics: {
        status_distribution: statusDistribution.map(item => ({
          status: item.redemption_status,
          count: parseInt(item.count),
          total_points: parseInt(item.total_points) || 0,
        })),
        popular_rewards: popularRewards.map(item => ({
          reward_id: item.redemption_reward_id,
          reward_name: item.reward_reward_name,
          redemption_count: parseInt(item.redemption_count),
          total_points_cost: parseInt(item.total_points_cost) || 0,
        })),
      },
      data: redemptions,
    };
  } catch (error) {
    console.error("getRedemptionHistory error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get redemption history: ${error.message}`,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      summary: {
        total_redemptions: 0,
        total_points_redeemed: 0,
        completed_redemptions: 0,
        pending_redemptions: 0,
        cancelled_redemptions: 0,
        completion_rate: 0,
      },
      analytics: {
        status_distribution: [],
        popular_rewards: [],
      },
    };
  }
}

module.exports = getRedemptionHistory;