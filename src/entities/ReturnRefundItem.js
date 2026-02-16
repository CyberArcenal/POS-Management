// ReturnRefundItem.js
const { EntitySchema } = require("typeorm");

const ReturnRefundItem = new EntitySchema({
  name: "ReturnRefundItem",
  tableName: "return_refund_items",
  columns: {
    id: { type: Number, primary: true, generated: true },
    quantity: { type: Number },
    unitPrice: { type: "decimal" },
    subtotal: { type: "decimal" },
    reason: { type: String, nullable: true },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" }
  },
  relations: {
    returnRefund: {
      target: "ReturnRefund",
      type: "many-to-one",
      joinColumn: true
    },
    product: {
      target: "Product",
      type: "many-to-one",
      joinColumn: true,
      eager: true
    }
  }
});

module.exports = ReturnRefundItem;
