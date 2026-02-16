// ReturnRefund.js
const { EntitySchema } = require("typeorm");

const ReturnRefund = new EntitySchema({
  name: "ReturnRefund",
  tableName: "return_refunds",
  columns: {
    id: { type: Number, primary: true, generated: true },
    referenceNo: { type: String, unique:true }, // unique reference for audit
    reason: { type: String, nullable: true },
    refundMethod: { type: String }, // Cash, Card, Store Credit
    totalAmount: { type: "decimal", default: 0 },
    status: { type: String, default: "processed", enum: ["processed", "pending", "cancelled"] }, // processed, pending, cancelled
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true },
  },
  relations: {
    sale: {
      target: "Sale",
      type: "many-to-one",
      joinColumn: true,
      eager: true,
    },
    items: {
      target: "ReturnRefundItem",
      type: "one-to-many",
      inverseSide: "returnRefund",
      cascade: true,
    },
    customer: {
      target: "Customer",
      type: "many-to-one",
      joinColumn: true,
      eager: true,
    },
  },
});

module.exports = ReturnRefund;
