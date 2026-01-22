// src/entities/CustomerTransaction.js
const { EntitySchema } = require("typeorm");

const TransactionType = {
  SALE: "sale",
  PAYMENT: "payment",
  REFUND: "refund",
  CREDIT_NOTE: "credit_note",
  DEBIT_NOTE: "debit_note",
  ADJUSTMENT: "adjustment",
};

const TransactionStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REVERSED: "reversed",
};

const CustomerTransaction = new EntitySchema({
  name: "CustomerTransaction",
  tableName: "customer_transactions",
  columns: {
    id: { type: "int", primary: true, generated: true },
    
    // ✅ Transaction details
    customer_id: { type: "int", nullable: false },
    transaction_type: {
      type: "varchar", // SQLite-safe (was enum)
      name: "transaction_type",
      nullable: false,
      default: TransactionType.SALE,
    },
    transaction_date: { type: "datetime", nullable: false },
    
    // ✅ Reference information
    reference_id: { type: "varchar", nullable: true },
    reference_type: { type: "varchar", nullable: true },
    
    // ✅ Amounts
    amount: { type: "decimal", precision: 10, scale: 2, nullable: false },
    balance_before: { type: "decimal", precision: 10, scale: 2, default: 0 },
    balance_after: { type: "decimal", precision: 10, scale: 2, default: 0 },
    
    // ✅ Description
    description: { type: "text", nullable: true },
    
    // ✅ Status
    status: {
      type: "varchar", // SQLite-safe (was enum)
      name: "status",
      nullable: false,
      default: TransactionStatus.COMPLETED,
    },
    
    // ✅ Timestamps
    created_at: { type: "datetime", createDate: true, default: () => "CURRENT_TIMESTAMP" },
    created_by: { type: "int", nullable: true },
  },

  relations: {
    // Belongs to a customer
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: { name: "customer_id" },
      inverseSide: "transactions",
    },
    
    // Created by user
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
    },
  },

  indices: [
    { name: "idx_customer_transactions_customer_id", columns: ["customer_id"] },
    { name: "idx_customer_transactions_type", columns: ["transaction_type"] },
    { name: "idx_customer_transactions_date", columns: ["transaction_date"] },
    { name: "idx_customer_transactions_status", columns: ["status"] },
  ],
});

module.exports = { CustomerTransaction, TransactionType, TransactionStatus };