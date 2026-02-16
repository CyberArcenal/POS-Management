// PurchaseItem.js
const { EntitySchema } = require("typeorm");

const PurchaseItem = new EntitySchema({
  name: "PurchaseItem",
  tableName: "purchase_items",
  columns: {
    id: { type: Number, primary: true, generated: true },
    quantity: { type: Number },
    unitPrice: { type: "decimal" },
    subtotal: { type: "decimal" },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" }
  },
  relations: {
    purchase: {
      target: "Purchase",
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

module.exports = PurchaseItem;
