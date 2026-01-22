// src/entities/PointsTransaction.js
const { EntitySchema } = require("typeorm");

const TransactionType = {
  EARN: "earn",
  REDEEM: "redeem",
  EXPIRE: "expire",
  ADJUSTMENT: "adjustment",
  BONUS: "bonus",
  CORRECTION: "correction",
};

const ReferenceType = {
  SALE: "sale",
  RETURN: "return",
  MANUAL: "manual",
  BIRTHDAY: "birthday",
  ANNIVERSARY: "anniversary",
  SIGNUP: "signup",
  PROMOTION: "promotion",
};

const TransactionStatus = {
  ACTIVE: "active",
  PENDING: "pending",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  REVERSED: "reversed",
};

const PointsTransaction = new EntitySchema({
  name: "PointsTransaction",
  tableName: "points_transactions",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // Customer Reference
    customer_id: { type: "int", nullable: false },
    loyalty_customer_id: { type: "int", nullable: false },

    // Transaction Details (SQLite-safe: varchar; validate in app layer)
    transaction_type: {
      type: "varchar",
      nullable: false,
      name: "transaction_type",
      default: TransactionType.EARN,
    },
    points_amount: { type: "int", nullable: false },
    balance_before: { type: "int", nullable: false },
    balance_after: { type: "int", nullable: false },

    // Reference Information
    reference_type: {
      type: "varchar",
      nullable: true,
      name: "reference_type",
    },
    reference_id: { type: "int", nullable: true },
    reference_number: { type: "varchar", nullable: true },

    // Description
    description: { type: "varchar", nullable: true },

    // Expiration
    expiration_date: { type: "datetime", nullable: true },

    // Status (SQLite-safe)
    status: {
      type: "varchar",
      nullable: false,
      default: TransactionStatus.ACTIVE,
      name: "status",
    },

    // Audit
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },

    // Reversal Information
    reversed_at: { type: "datetime", nullable: true },
    reversed_by: { type: "int", nullable: true },
    reversal_reason: { type: "varchar", nullable: true },
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
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
    },
  },

  indices: [
    { name: "idx_points_transactions_customer", columns: ["customer_id"] },
    { name: "idx_points_transactions_type", columns: ["transaction_type"] },
    { name: "idx_points_transactions_reference", columns: ["reference_type", "reference_id"] },
    { name: "idx_points_transactions_created", columns: ["created_at"] },
    { name: "idx_points_transactions_expiration", columns: ["expiration_date"] },
  ],
});

module.exports = { PointsTransaction, TransactionType, ReferenceType, TransactionStatus };