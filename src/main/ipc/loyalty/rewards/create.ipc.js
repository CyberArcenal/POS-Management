// loyalty/rewards/create.ipc.js
//@ts-check

const { RewardItem } = require("../../../../entities/RewardItem");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ reward_data: any; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function createReward(params, queryRunner) {
  const { reward_data, _userId } = params;
  
  try {
    const rewardRepo = queryRunner.manager.getRepository(RewardItem);

    // Generate unique reward code
    const rewardCode = `REWARD-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Create reward
    const reward = rewardRepo.create({
      ...reward_data,
      reward_code: rewardCode,
      created_by: _userId,
      is_active: true,
    });

    await rewardRepo.save(reward);

    // Log activity
    await log_audit("create", "RewardItem", reward.id, _userId, {
      reward_code: rewardCode,
      reward_name: reward.reward_name,
      points_cost: reward.points_cost,
      category: reward.category,
    });

    return {
      status: true,
      message: "Reward created successfully",
      data: reward,
    };
  } catch (error) {
    console.error("createReward error:", error);
    
    await log_audit("error", "RewardItem", 0, _userId, {
      reward_data: JSON.stringify(reward_data),
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create reward: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createReward;