// loyalty/rewards/get_all.ipc.js
//@ts-check

const { RewardItem } = require("../../../../entities/RewardItem");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} userId
 */
// @ts-ignore
async function getRewardsCatalog(filters = {}, userId) {
  try {
    const rewardRepo = AppDataSource.getRepository(RewardItem);
    
    const queryBuilder = rewardRepo
      .createQueryBuilder("reward")
      .orderBy("reward.points_cost", "ASC");

    // Apply filters
    // @ts-ignore
    if (filters.category) {
      queryBuilder.andWhere("reward.category = :category", {
        // @ts-ignore
        category: filters.category,
      });
    }

    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("reward.is_active = :is_active", {
        // @ts-ignore
        is_active: filters.is_active,
      });
    }

    // @ts-ignore
    if (filters.min_points !== undefined) {
      queryBuilder.andWhere("reward.points_cost >= :min_points", {
        // @ts-ignore
        min_points: filters.min_points,
      });
    }

    // @ts-ignore
    if (filters.max_points !== undefined) {
      queryBuilder.andWhere("reward.points_cost <= :max_points", {
        // @ts-ignore
        max_points: filters.max_points,
      });
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(reward.reward_name LIKE :search OR reward.description LIKE :search OR reward.reward_code LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // @ts-ignore
    if (filters.eligible_tiers) {
      queryBuilder.andWhere("reward.eligible_tiers LIKE :tier", {
        // @ts-ignore
        tier: `%${filters.eligible_tiers}%`,
      });
    }

    // Check validity dates
    queryBuilder.andWhere(
      "(reward.valid_from IS NULL OR reward.valid_from <= :now) AND (reward.valid_to IS NULL OR reward.valid_to >= :now)",
      { now: new Date() }
    );

    const rewards = await queryBuilder.getMany();

    return {
      status: true,
      message: "Rewards catalog retrieved successfully",
      data: rewards,
    };
  } catch (error) {
    console.error("getRewardsCatalog error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get rewards catalog: ${error.message}`,
      data: [],
    };
  }
}

module.exports = getRewardsCatalog;