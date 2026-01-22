// src/entities/PointsEarningRule.js
const { EntitySchema } = require("typeorm");

const RuleType = {
  PURCHASE: "purchase",
  CATEGORY: "category",
  PRODUCT: "product",
  ACTION: "action",
  REFERRAL: "referral",
  SOCIAL: "social",
  BIRTHDAY: "birthday",
};

const PointsEarningRule = new EntitySchema({
  name: "PointsEarningRule",
  tableName: "points_earning_rules",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Rule Information
    rule_name: { type: "varchar", nullable: false },
    rule_type: {
      type: "varchar", // SQLite-safe (was enum)
      nullable: false,
      name: "rule_type",
      default: RuleType.PURCHASE,
    },

    // Points Calculation
    points_multiplier: { type: "decimal", precision: 10, scale: 2, default: 1.0 },
    fixed_points: { type: "int", nullable: true },
    minimum_purchase: { type: "decimal", precision: 10, scale: 2, nullable: true },
    maximum_points_per_transaction: { type: "int", nullable: true },

    // Applicability
    applicable_categories: { type: "simple-array", nullable: true },
    applicable_products: { type: "simple-array", nullable: true },
    excluded_products: { type: "simple-array", nullable: true },
    applicable_tiers: {
      type: "simple-array",
      nullable: true,
      default: "bronze,silver,gold,platinum",
      name: "applicable_tiers",
    },

    // Validity
    valid_days: { type: "simple-array", nullable: true }, // ["monday","tuesday",...]
    valid_period_start: { type: "datetime", nullable: true },
    valid_period_end: { type: "datetime", nullable: true },
    valid_time_start: { type: "time", nullable: true },
    valid_time_end: { type: "time", nullable: true },

    // Status
    is_active: { type: "boolean", default: true },
    priority: { type: "int", default: 1 }, // Lower number = higher priority

    // Additional Conditions
    require_coupon_code: { type: "varchar", nullable: true },
    max_uses_per_customer: { type: "int", nullable: true },

    // Timestamps
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    updated_at: { type: "datetime", updateDate: true, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },
    updated_by: { type: "int", nullable: true },
  },

  indices: [
    { name: "idx_earning_rules_active", columns: ["is_active"] },
    { name: "idx_earning_rules_type", columns: ["rule_type"] },
    { name: "idx_earning_rules_priority", columns: ["priority"] },
  ],
});

module.exports = { PointsEarningRule, RuleType };