// src/entities/LoyaltyCustomer.js
const { EntitySchema } = require("typeorm");

const EnrollmentSource = {
  MANUAL: "manual",
  SIGNUP: "signup",
  PROMOTION: "promotion",
  AUTO: "auto",
};

const Tier = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
};

const LoyaltyCustomer = new EntitySchema({
  name: "LoyaltyCustomer",
  tableName: "loyalty_customers",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Customer Reference
    customer_id: { type: "int", nullable: false },
    customer_code: { type: "varchar", nullable: false },

    // Tier Information
    tier: {
      type: "varchar",
      nullable: false,
      default: Tier.BRONZE,
      name: "tier",
    },

    // Points Information
    current_points: { type: "int", default: 0 },
    total_points_earned: { type: "int", default: 0 },
    total_points_redeemed: { type: "int", default: 0 },
    available_points: { type: "int", default: 0 },
    pending_points: { type: "int", default: 0 },
    points_expiring_soon: { type: "int", default: 0 },

    // Tier Progress
    next_tier_points_needed: { type: "int", default: 0 },
    last_tier_upgrade: { type: "datetime", nullable: true },

    // Membership Dates
    membership_start_date: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    membership_end_date: { type: "datetime", nullable: true },
    last_points_activity: { type: "datetime", nullable: true },

    // Status
    is_active: { type: "boolean", default: true },
    enrollment_source: {
      type: "varchar",
      nullable: true,
      name: "enrollment_source",
    },

    // Preferences
    receive_points_notifications: { type: "boolean", default: true },
    receive_tier_notifications: { type: "boolean", default: true },

    // Timestamps
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    updated_at: { type: "datetime", updateDate: true, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },

    // Audit fields (optional)
    created_by: { type: "int", nullable: true },
    updated_by: { type: "int", nullable: true },
  },

  relations: {
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: { name: "customer_id" },
      nullable: false,
    },
    transactions: {
      type: "one-to-many",
      target: "PointsTransaction",
      inverseSide: "loyalty_customer",
    },
    redemptions: {
      type: "one-to-many",
      target: "RedemptionHistory",
      inverseSide: "loyalty_customer",
    },
  },

  indices: [
    {
      name: "idx_loyalty_customers_customer",
      columns: ["customer_id"],
      unique: true,
    },
    { name: "idx_loyalty_customers_tier", columns: ["tier"] },
    { name: "idx_loyalty_customers_active", columns: ["is_active"] },
    { name: "idx_loyalty_customers_points", columns: ["available_points"] },
  ],
});

module.exports = { LoyaltyCustomer, EnrollmentSource, Tier };