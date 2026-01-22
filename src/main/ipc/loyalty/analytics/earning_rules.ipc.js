// loyalty/analytics/earning_rules.ipc.js
//@ts-check

const { PointsEarningRule } = require("../../../../entities/PointsEarningRule");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} userId
 */
// @ts-ignore
async function getPointsEarningRules(userId) {
  try {
    const rulesRepo = AppDataSource.getRepository(PointsEarningRule);
    
    const rules = await rulesRepo
      .createQueryBuilder("rule")
      .where("rule.is_active = :active", { active: true })
      .orderBy("rule.priority", "ASC")
      .addOrderBy("rule.created_at", "DESC")
      .getMany();

    // Categorize rules by type
    const rulesByType = rules.reduce((acc, rule) => {
      // @ts-ignore
      if (!acc[rule.rule_type]) {
        // @ts-ignore
        acc[rule.rule_type] = [];
      }
      // @ts-ignore
      acc[rule.rule_type].push(rule);
      return acc;
    }, {});

    // Calculate effectiveness stats (simplified - in real app, you'd track rule usage)
    const rulesWithStats = rules.map(rule => ({
      ...rule,
      effectiveness_score: calculateRuleEffectiveness(rule),
      estimated_impact: estimateRuleImpact(rule),
    }));

    return {
      status: true,
      message: "Points earning rules retrieved successfully",
      data: {
        rules: rulesWithStats,
        rules_by_type: rulesByType,
        total_rules: rules.length,
        active_rules: rules.filter(r => r.is_active).length,
        rule_types: Object.keys(rulesByType),
      },
    };
  } catch (error) {
    console.error("getPointsEarningRules error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get earning rules: ${error.message}`,
      data: {
        rules: [],
        rules_by_type: {},
        total_rules: 0,
        active_rules: 0,
        rule_types: [],
      },
    };
  }
}

// Helper functions
/**
 * @param {{ id?: any; rule_name?: any; rule_type?: any; points_multiplier: any; fixed_points?: any; minimum_purchase?: any; maximum_points_per_transaction?: any; applicable_categories: any; applicable_products: any; excluded_products?: any; applicable_tiers?: any; valid_days: any; valid_period_start?: any; valid_period_end?: any; valid_time_start?: any; valid_time_end?: any; is_active?: any; priority: any; require_coupon_code?: any; max_uses_per_customer?: any; created_at?: any; updated_at?: any; created_by?: any; updated_by?: any; }} rule
 */
function calculateRuleEffectiveness(rule) {
  let score = 0;
  
  // Higher priority rules get higher score
  score += (10 - Math.min(rule.priority, 10)) * 10;
  
  // Rules with specific conditions might be more targeted
  if (rule.applicable_categories && rule.applicable_categories.length > 0) {
    score += 20;
  }
  
  if (rule.applicable_products && rule.applicable_products.length > 0) {
    score += 15;
  }
  
  if (rule.valid_days && rule.valid_days.length > 0) {
    score += 10;
  }
  
  // Higher multiplier = more effective
  score += (rule.points_multiplier - 1) * 50;
  
  return Math.min(score, 100);
}

/**
 * @param {{ id?: any; rule_name?: any; rule_type?: any; points_multiplier: any; fixed_points: any; minimum_purchase?: any; maximum_points_per_transaction?: any; applicable_categories?: any; applicable_products?: any; excluded_products?: any; applicable_tiers?: any; valid_days?: any; valid_period_start?: any; valid_period_end?: any; valid_time_start?: any; valid_time_end?: any; is_active?: any; priority?: any; require_coupon_code?: any; max_uses_per_customer?: any; created_at?: any; updated_at?: any; created_by?: any; updated_by?: any; }} rule
 */
function estimateRuleImpact(rule) {
  let impact = 'low';
  const multiplier = rule.points_multiplier;
  
  if (multiplier >= 2) {
    impact = 'high';
  } else if (multiplier >= 1.5) {
    impact = 'medium';
  }
  
  // Fixed points rules have higher impact
  if (rule.fixed_points && rule.fixed_points >= 100) {
    impact = 'high';
  }
  
  return impact;
}

module.exports = getPointsEarningRules;