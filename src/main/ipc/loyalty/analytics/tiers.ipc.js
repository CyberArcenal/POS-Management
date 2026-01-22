// loyalty/analytics/tiers.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { LoyaltyProgram } = require("../../../../entities/LoyaltyProgram");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} userId
 */
// @ts-ignore
async function getLoyaltyTiers(userId) {
  try {
    const loyaltyProgramRepo = AppDataSource.getRepository(LoyaltyProgram);
    const loyaltyCustomerRepo = AppDataSource.getRepository(LoyaltyCustomer);
    
    // Get loyalty program settings
    const program = await loyaltyProgramRepo.findOne({
      where: { is_active: true },
    });

    if (!program) {
      return {
        status: false,
        message: "No active loyalty program found",
        data: [],
      };
    }

    // Parse tier settings
    let tierRequirements = {};
    let tierBenefits = {};
    
    if (program.tier_requirements && typeof program.tier_requirements === 'string') {
      tierRequirements = JSON.parse(program.tier_requirements);
    }
    
    if (program.tier_benefits && typeof program.tier_benefits === 'string') {
      tierBenefits = JSON.parse(program.tier_benefits);
    }

    // Get customer counts per tier
    const tierStats = await loyaltyCustomerRepo
      .createQueryBuilder("customer")
      .select([
        "customer.tier",
        "COUNT(*) as member_count",
        "AVG(customer.current_points) as avg_points",
        "SUM(customer.current_points) as total_points",
        "AVG(customer.total_points_earned) as avg_points_earned",
        "AVG(customer.total_points_redeemed) as avg_points_redeemed",
      ])
      .where("customer.is_active = true")
      .groupBy("customer.tier")
      .getRawMany();

    // Get tier upgrade history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const tierUpgrades = await loyaltyCustomerRepo
      .createQueryBuilder("customer")
      .select("customer.tier, COUNT(*) as upgrades")
      .where("customer.last_tier_upgrade >= :date", { date: thirtyDaysAgo })
      .groupBy("customer.tier")
      .getRawMany();

    // Get monthly tier progression
    const monthlyProgression = await loyaltyCustomerRepo
      .createQueryBuilder("customer")
      .select([
        "DATE_FORMAT(customer.membership_start_date, '%Y-%m') as month",
        "customer.tier",
        "COUNT(*) as new_members",
      ])
      .where("customer.membership_start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)")
      .groupBy("month, customer.tier")
      .orderBy("month", "ASC")
      .getRawMany();

    // Build tier information
    const tiers = Object.keys(tierRequirements).map(tierName => {
      const stats = tierStats.find(s => s.customer_tier === tierName);
      const upgrades = tierUpgrades.find(u => u.customer_tier === tierName);
      
      return {
        tier_id: tierName,
        tier_name: tierName.charAt(0).toUpperCase() + tierName.slice(1),
        // @ts-ignore
        min_points: tierRequirements[tierName] || 0,
        // @ts-ignore
        max_points: tierRequirements[Object.keys(tierRequirements)[Object.keys(tierRequirements).indexOf(tierName) + 1]] || 999999,
        // @ts-ignore
        color: this.getTierColor(tierName),
        // @ts-ignore
        benefits: tierBenefits[tierName] || [],
        // @ts-ignore
        discount_percentage: this.getTierDiscount(tierName),
        // @ts-ignore
        bonus_points_multiplier: this.getTierMultiplier(tierName),
        priority_processing: tierName === 'platinum' || tierName === 'gold',
        free_shipping: tierName === 'platinum' || tierName === 'gold',
        exclusive_offers: tierName === 'platinum',
        member_count: stats ? parseInt(stats.member_count) : 0,
        avg_points: stats ? parseFloat(stats.avg_points) : 0,
        total_points: stats ? parseInt(stats.total_points) : 0,
        upgrades_last_30_days: upgrades ? parseInt(upgrades.upgrades) : 0,
        conversion_rate: stats && stats.member_count > 0 ? 
          (parseInt(stats.avg_points_earned) / parseInt(stats.avg_points_redeemed)) || 0 : 0,
      };
    });

    return {
      status: true,
      message: "Loyalty tiers retrieved successfully",
      data: {
        tiers,
        program_settings: {
          program_name: program.program_name,
          points_per_currency: program.points_per_currency,
          expiration_months: program.expiration_months,
        },
        statistics: {
          total_members: tierStats.reduce((sum, tier) => sum + parseInt(tier.member_count), 0),
          total_points: tierStats.reduce((sum, tier) => sum + parseInt(tier.total_points), 0),
          monthly_progression: monthlyProgression,
        },
      },
    };
  } catch (error) {
    console.error("getLoyaltyTiers error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get loyalty tiers: ${error.message}`,
      data: {
        tiers: [],
        program_settings: {},
        statistics: {
          total_members: 0,
          total_points: 0,
          monthly_progression: [],
        },
      },
    };
  }
}

// Helper functions
/**
 * @param {string | number} tier
 */
// @ts-ignore
function getTierColor(tier) {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };
  // @ts-ignore
  return colors[tier] || '#6B7280';
}

/**
 * @param {string | number} tier
 */
// @ts-ignore
function getTierDiscount(tier) {
  const discounts = {
    bronze: 5,
    silver: 10,
    gold: 15,
    platinum: 20,
  };
  // @ts-ignore
  return discounts[tier] || 0;
}

/**
 * @param {string | number} tier
 */
// @ts-ignore
function getTierMultiplier(tier) {
  const multipliers = {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.2,
    platinum: 1.5,
  };
  // @ts-ignore
  return multipliers[tier] || 1.0;
}

module.exports = getLoyaltyTiers;