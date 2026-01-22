// loyalty/redemptions/redeem.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { RedemptionHistory } = require("../../../../entities/RedemptionHistory");
const { RewardItem } = require("../../../../entities/RewardItem");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ customer_id: any; reward_id: any; quantity?: 1 | undefined; notes: any; fulfillment_method?: "in_store" | undefined; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function redeemReward(params, queryRunner) {
  const {
    customer_id,
    reward_id,
    quantity = 1,
    notes,
    fulfillment_method = "in_store",
    _userId,
  } = params;

  try {
    const loyaltyRepo = queryRunner.manager.getRepository(LoyaltyCustomer);
    const rewardRepo = queryRunner.manager.getRepository(RewardItem);
    const redemptionRepo = queryRunner.manager.getRepository(RedemptionHistory);
    const pointsRepo = queryRunner.manager.getRepository(PointsTransaction);

    // Get loyalty customer
    const loyaltyCustomer = await loyaltyRepo.findOne({
      where: { customer_id: customer_id },
    });

    if (!loyaltyCustomer) {
      return {
        status: false,
        message: "Customer not enrolled in loyalty program",
        data: null,
      };
    }

    // Get reward
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

    // Check eligibility
    const totalPointsCost = reward.points_cost * quantity;
    
    if (loyaltyCustomer.available_points < totalPointsCost) {
      return {
        status: false,
        message: "Insufficient points balance",
        data: null,
      };
    }

    if (!reward.is_active) {
      return {
        status: false,
        message: "Reward is not active",
        data: null,
      };
    }

    if (reward.stock_quantity >= 0 && reward.stock_quantity < quantity) {
      return {
        status: false,
        message: "Insufficient stock for this reward",
        data: null,
      };
    }

    // Check if customer is eligible for this reward tier
    if (!reward.eligible_tiers.includes(loyaltyCustomer.tier)) {
      return {
        status: false,
        message: `This reward is only available for ${reward.eligible_tiers.join(", ")} tier customers`,
        data: null,
      };
    }

    // Check minimum points balance
    if (loyaltyCustomer.available_points < reward.min_points_balance) {
      return {
        status: false,
        message: `Minimum points balance of ${reward.min_points_balance} required for this reward`,
        data: null,
      };
    }

    // Deduct points
    const balanceBefore = loyaltyCustomer.available_points;
    const balanceAfter = balanceBefore - totalPointsCost;

    loyaltyCustomer.available_points = balanceAfter;
    loyaltyCustomer.total_points_redeemed += totalPointsCost;
    loyaltyCustomer.last_points_activity = new Date();
    await loyaltyRepo.save(loyaltyCustomer);

    // Create points transaction
    const pointsTransaction = pointsRepo.create({
      customer_id,
      loyalty_customer_id: loyaltyCustomer.id,
      transaction_type: "redeem",
      points_amount: totalPointsCost,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: "redemption",
      description: `Redeemed ${reward.reward_name} (${quantity}x)`,
      status: "active",
      created_by: _userId,
    });

    await pointsRepo.save(pointsTransaction);

    // Update reward stock
    if (reward.stock_quantity >= 0) {
      reward.stock_quantity -= quantity;
      reward.total_redemptions += quantity;
      await rewardRepo.save(reward);
    }

    // Create redemption record
    const redemptionCode = `REDEEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const redemption = redemptionRepo.create({
      redemption_code: redemptionCode,
      customer_id,
      loyalty_customer_id: loyaltyCustomer.id,
      reward_id: reward.id,
      reward_name: reward.reward_name,
      points_cost: totalPointsCost,
      quantity,
      status: "pending",
      fulfillment_method,
      notes,
      created_by: _userId,
    });

    await redemptionRepo.save(redemption);

    // Log activity
    await log_audit("redeem", "RedemptionHistory", redemption.id, _userId, {
      customer_id,
      reward_id,
      reward_name: reward.reward_name,
      points_cost: totalPointsCost,
      redemption_code: redemptionCode,
    });

    return {
      status: true,
      message: "Reward redeemed successfully",
      data: redemption,
    };
  } catch (error) {
    console.error("redeemReward error:", error);
    
    await log_audit("error", "RedemptionHistory", 0, _userId, {
      customer_id,
      reward_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to redeem reward: ${error.message}`,
      data: null,
    };
  }
}

module.exports = redeemReward;