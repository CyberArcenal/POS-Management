// entities/RewardItem.js
const { EntitySchema } = require("typeorm");

const RewardCategory = {
  DISCOUNT: "discount",
  PRODUCT: "product",
  SERVICE: "service",
  VOUCHER: "voucher",
  GIFT_CARD: "gift_card",
  FREE_ITEM: "free_item",
};

const RewardItem = new EntitySchema({
  name: "RewardItem",
  tableName: "reward_items",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Basic Information
    reward_code: { type: "varchar", unique: true, nullable: false },
    reward_name: { type: "varchar", nullable: false },
    description: { type: "text", nullable: true },

    // Category (SQLite-safe: varchar, validate in app layer)
    category: {
      type: "varchar",
      nullable: false,
      default: RewardCategory.DISCOUNT,
      name: "category",
    },

    // Points Cost
    points_cost: { type: "int", nullable: false },
    cash_value: { type: "decimal", precision: 10, scale: 2, nullable: true },
    discount_percentage: { type: "decimal", precision: 5, scale: 2, nullable: true },

    // Inventory
    stock_quantity: { type: "int", default: -1 }, // -1 for unlimited
    max_redemptions_per_customer: { type: "int", default: 1 },
    total_redemptions: { type: "int", default: 0 },

    // Validity
    validity_period_days: { type: "int", default: 30 },
    valid_from: { type: "datetime", nullable: true },
    valid_to: { type: "datetime", nullable: true },

    // Product Association
    product_id: { type: "int", nullable: true },
    product_quantity: { type: "int", default: 1 },

    // Status
    is_active: { type: "boolean", default: true },

    // Media
    image_url: { type: "varchar", nullable: true },
    terms_conditions: { type: "text", nullable: true },

    // Eligibility
    // simple-array stores as comma-separated string in DB; default must be a string
    eligible_tiers: {
      type: "simple-array",
      nullable: true,
      default: "bronze,silver,gold,platinum",
      name: "eligible_tiers",
    },
    min_points_balance: { type: "int", default: 0 },

    // Timestamps
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    updated_at: { type: "datetime", updateDate: true, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },
    updated_by: { type: "int", nullable: true },
  },

  relations: {
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "product_id" },
    },
    redemptions: {
      type: "one-to-many",
      target: "RedemptionHistory",
      inverseSide: "reward",
    },
  },

  indices: [
    { name: "idx_reward_items_code", columns: ["reward_code"], unique: true },
    { name: "idx_reward_items_category", columns: ["category"] },
    { name: "idx_reward_items_active", columns: ["is_active"] },
    { name: "idx_reward_items_points", columns: ["points_cost"] },
  ],
});

module.exports = { RewardItem, RewardCategory };