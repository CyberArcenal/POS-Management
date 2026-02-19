// Purchase.js
const { EntitySchema } = require("typeorm");

const Purchase = new EntitySchema({
  name: "Purchase",
  tableName: "purchases",
  columns: {
    id: { type: Number, primary: true, generated: true },
    referenceNo: { type: String }, // unique reference for audit
    orderDate: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "completed", "cacelled"],
    }, // pending, completed, cancelled
    totalAmount: { type: "decimal", default: 0 },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true },
  },
  relations: {
    supplier: {
      target: "Supplier",
      type: "many-to-one",
      joinColumn: true,
      eager: true,
    },
    purchaseItems: {
      target: "PurchaseItem",
      type: "one-to-many",
      inverseSide: "purchase",
      cascade: true,
    },
  },
});

module.exports = Purchase;
