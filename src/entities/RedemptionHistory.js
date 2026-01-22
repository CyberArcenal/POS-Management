// src/entities/RedemptionHistory.js
const { EntitySchema } = require("typeorm");

const RedemptionStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  REFUNDED: "refunded",
};

const FulfillmentMethod = {
  IN_STORE: "in_store",
  SHIP: "ship",
  DIGITAL: "digital",
  EMAIL: "email",
  SMS: "sms",
};

const RedemptionHistory = new EntitySchema({
  name: "RedemptionHistory",
  tableName: "redemption_history",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Redemption Information
    redemption_code: { type: "varchar", unique: true, nullable: false },

    // Customer Reference
    customer_id: { type: "int", nullable: false },
    loyalty_customer_id: { type: "int", nullable: false },

    // Reward Reference
    reward_id: { type: "int", nullable: false },
    reward_name: { type: "varchar", nullable: false },
    points_cost: { type: "int", nullable: false },
    quantity: { type: "int", default: 1 },

    // Status (SQLite-safe: varchar, validate in app layer)
    status: {
      type: "varchar",
      nullable: false,
      default: RedemptionStatus.PENDING,
      name: "status",
    },

    // Dates
    redemption_date: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    approval_date: { type: "datetime", nullable: true },
    fulfillment_date: { type: "datetime", nullable: true },
    expiration_date: { type: "datetime", nullable: true },

    // Fulfillment
    fulfillment_method: {
      type: "varchar",
      nullable: true,
      name: "fulfillment_method",
    },
    tracking_number: { type: "varchar", nullable: true },
    carrier: { type: "varchar", nullable: true },

    // Delivery Information
    shipping_address: { type: "simple-json", nullable: true },
    digital_delivery_code: { type: "varchar", nullable: true },
    digital_delivery_expiry: { type: "datetime", nullable: true },

    // Notes
    notes: { type: "text", nullable: true },

    // Audit
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },
    approved_by: { type: "int", nullable: true },
    fulfilled_by: { type: "int", nullable: true },
  },

  relations: {
    loyalty_customer: {
      type: "many-to-one",
      target: "LoyaltyCustomer",
      joinColumn: { name: "loyalty_customer_id" },
    },
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: { name: "customer_id" },
    },
    reward: {
      type: "many-to-one",
      target: "RewardItem",
      joinColumn: { name: "reward_id" },
    },
  },

  indices: [
    { name: "idx_redemption_history_code", columns: ["redemption_code"], unique: true },
    { name: "idx_redemption_history_customer", columns: ["customer_id"] },
    { name: "idx_redemption_history_reward", columns: ["reward_id"] },
    { name: "idx_redemption_history_status", columns: ["status"] },
    { name: "idx_redemption_history_date", columns: ["redemption_date"] },
  ],
});

module.exports = { RedemptionHistory, RedemptionStatus, FulfillmentMethod };