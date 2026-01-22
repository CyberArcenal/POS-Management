// loyalty/customers/get_by_id.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { LoyaltyProgram } = require("../../../../entities/LoyaltyProgram");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { RedemptionHistory } = require("../../../../entities/RedemptionHistory");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} customerId
 * @param {any} userId
 */
async function getLoyaltyCustomerById(customerId, userId) {
  try {
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    const pointsRepo = AppDataSource.getRepository(PointsTransaction);
    const redemptionRepo = AppDataSource.getRepository(RedemptionHistory);
    
    // Get loyalty customer with customer details
    const loyaltyCustomer = await loyaltyRepo
      .createQueryBuilder("loyalty")
      .leftJoinAndSelect("loyalty.customer", "customer")
      .where("loyalty.customer_id = :customerId", { customerId })
      .andWhere("loyalty.is_active = true")
      .getOne();

    if (!loyaltyCustomer) {
      return {
        status: false,
        message: "Loyalty customer not found",
        data: null,
      };
    }

    // Get recent transactions
    const recentTransactions = await pointsRepo
      .createQueryBuilder("transaction")
      .where("transaction.customer_id = :customerId", { customerId })
      .orderBy("transaction.created_at", "DESC")
      .take(10)
      .getMany();

    // Get recent redemptions
    const recentRedemptions = await redemptionRepo
      .createQueryBuilder("redemption")
      .where("redemption.customer_id = :customerId", { customerId })
      .orderBy("redemption.redemption_date", "DESC")
      .take(5)
      .getMany();

    // Calculate points expiring soon
    const expiringPoints = await pointsRepo
      .createQueryBuilder("transaction")
      .select("SUM(transaction.points_amount)", "points_expiring")
      .where("transaction.customer_id = :customerId", { customerId })
      .andWhere("transaction.expiration_date BETWEEN :now AND :future")
      .andWhere("transaction.status = 'active'")
      .setParameters({
        customerId,
        now: new Date(),
        future: new Date(new Date().setDate(new Date().getDate() + 30)),
      })
      .getRawOne();

    // Get loyalty program settings for tier information
    const loyaltyProgram = await AppDataSource
      .getRepository(LoyaltyProgram)
      .findOne({ where: { is_active: true } });

    let tierRequirements = {};
    let tierBenefits = {};
    
    if (loyaltyProgram) {
      if (loyaltyProgram.tier_requirements && typeof loyaltyProgram.tier_requirements === 'string') {
        tierRequirements = JSON.parse(loyaltyProgram.tier_requirements);
      }
      if (loyaltyProgram.tier_benefits && typeof loyaltyProgram.tier_benefits === 'string') {
        tierBenefits = JSON.parse(loyaltyProgram.tier_benefits);
      }
    }

    // Calculate next tier progress
    const currentTier = loyaltyCustomer.tier;
    const tiers = Object.keys(tierRequirements).sort((a, b) => 
      // @ts-ignore
      tierRequirements[a] - tierRequirements[b]
    );
    
    // @ts-ignore
    const currentIndex = tiers.indexOf(currentTier);
    let nextTier = null;
    let nextTierPointsNeeded = 0;
    
    if (currentIndex < tiers.length - 1) {
      nextTier = tiers[currentIndex + 1];
      // @ts-ignore
      nextTierPointsNeeded = tierRequirements[nextTier] - loyaltyCustomer.current_points;
    }

    // @ts-ignore
    loyaltyCustomer.next_tier = nextTier;
    loyaltyCustomer.next_tier_points_needed = Math.max(0, nextTierPointsNeeded);
    // @ts-ignore
    loyaltyCustomer.current_tier_benefits = tierBenefits[currentTier] || [];
    loyaltyCustomer.points_expiring_soon = parseInt(expiringPoints.points_expiring) || 0;
    // @ts-ignore
    loyaltyCustomer.recent_transactions = recentTransactions;
    // @ts-ignore
    loyaltyCustomer.recent_redemptions = recentRedemptions;

    // Log activity
    // @ts-ignore
    await log_audit("view", "LoyaltyCustomer", loyaltyCustomer.id, userId, {
      customer_id: customerId,
      tier: loyaltyCustomer.tier,
      points_balance: loyaltyCustomer.current_points,
    });

    return {
      status: true,
      message: "Loyalty customer retrieved successfully",
      data: loyaltyCustomer,
    };
  } catch (error) {
    console.error("getLoyaltyCustomerById error:", error);
    
    await log_audit("error", "LoyaltyCustomer", 0, userId, {
      customer_id: customerId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get loyalty customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getLoyaltyCustomerById;