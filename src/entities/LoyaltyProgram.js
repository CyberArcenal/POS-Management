// src/entities/LoyaltyProgram.js
const { EntitySchema } = require("typeorm");

const LoyaltyProgram = new EntitySchema({
  name: "LoyaltyProgram",
  tableName: "loyalty_programs",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Program Information
    program_name: { type: "varchar", nullable: false },
    program_description: { type: "text", nullable: true },
    points_currency_name: { type: "varchar", default: "Points" },
    points_per_currency: { type: "decimal", precision: 10, scale: 2, default: 1.0 },
    minimum_redemption_points: { type: "int", default: 100 },
    expiration_months: { type: "int", default: 12 },

    // Bonus Points
    signup_bonus_points: { type: "int", default: 0 },
    birthday_bonus_points: { type: "int", default: 0 },
    anniversary_bonus_points: { type: "int", default: 0 },

    // Tier Configuration stored as JSON string (SQLite-safe)
    tier_requirements: {
      type: "text",
      nullable: true,
      default: JSON.stringify({
        bronze: 0,
        silver: 1000,
        gold: 5000,
        platinum: 20000,
      }),
      name: "tier_requirements",
    },
    tier_benefits: {
      type: "text",
      nullable: true,
      default: JSON.stringify({
        bronze: ["5% discount on all purchases"],
        silver: ["10% discount", "Free shipping on orders over $100"],
        gold: ["15% discount", "Free shipping", "Priority support"],
        platinum: ["20% discount", "Free shipping", "VIP support", "Early access to sales"],
      }),
      name: "tier_benefits",
    },

    // Status
    is_active: { type: "boolean", default: true },

    // Timestamps
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    updated_at: { type: "datetime", updateDate: true, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },
    updated_by: { type: "int", nullable: true },
  },

  relations: {
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
    },
    updater: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "updated_by" },
    },
  },

  indices: [
    { name: "idx_loyalty_programs_active", columns: ["is_active"] },
    { name: "idx_loyalty_programs_created", columns: ["created_at"] },
  ],
});

module.exports = { LoyaltyProgram };