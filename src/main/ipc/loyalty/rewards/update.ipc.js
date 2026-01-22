// loyalty/rewards/update.ipc.js
//@ts-check

const { RewardItem } = require("../../../../entities/RewardItem");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ reward_id: any; reward_data: any; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateReward(params, queryRunner) {
  const { reward_id, reward_data, _userId } = params;
  
  try {
    const rewardRepo = queryRunner.manager.getRepository(RewardItem);
    
    // Get existing reward
    const reward = await rewardRepo.findOne({
      where: { id: reward_id },
    });

    if (!reward) {
      return {
        status: false,
        message: "Reward not found",
        data: null,
      };
    }

    // Save old data for audit
    const oldData = {
      reward_name: reward.reward_name,
      points_cost: reward.points_cost,
      stock_quantity: reward.stock_quantity,
      is_active: reward.is_active,
    };

    // Update reward
    Object.assign(reward, reward_data, {
      updated_by: _userId,
      updated_at: new Date(),
    });

    await rewardRepo.save(reward);

    // Log activity
    await log_audit("update", "RewardItem", reward.id, _userId, {
      reward_code: reward.reward_code,
      old_data: oldData,
      new_data: {
        reward_name: reward.reward_name,
        points_cost: reward.points_cost,
        stock_quantity: reward.stock_quantity,
        is_active: reward.is_active,
      },
    });

    return {
      status: true,
      message: "Reward updated successfully",
      data: reward,
    };
  } catch (error) {
    console.error("updateReward error:", error);
    
    await log_audit("error", "RewardItem", 0, _userId, {
      reward_id,
      reward_data: JSON.stringify(reward_data),
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update reward: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateReward;