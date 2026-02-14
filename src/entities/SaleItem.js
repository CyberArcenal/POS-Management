// SaleItem.js
const { EntitySchema } = require("typeorm");

const SaleItem = new EntitySchema({
  name: "SaleItem",
  tableName: "sale_items",
  columns: {
    id: { type: Number, primary: true, generated: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: "decimal", default: 0.00 },
    discount: { type: "decimal", default: 0.00 },
    tax: { type: "decimal", default: 0.00 },
    lineTotal: { type: "decimal", default: 0.00 },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true }
  },
  relations: {
    sale: {
      target: "Sale",
      type: "many-to-one",
      joinColumn: true
    },
    product: {
      target: "Product",
      type: "many-to-one",
      joinColumn: true
    }
  }
});

module.exports = SaleItem;
