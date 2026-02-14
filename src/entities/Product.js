// Product.js
const { EntitySchema } = require("typeorm");

const Product = new EntitySchema({
  name: "Product",
  tableName: "products",
  columns: {
    id: { type: Number, primary: true, generated: true },
    sku: { type: String },
    name: { type: String },
    description: { type: String, nullable: true },
    price: { type: "decimal" },
    stockQty: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true }
  },
  relations: {
    saleItems: {
      target: "SaleItem",
      type: "one-to-many",
      inverseSide: "product"
    },
    inventoryMovements: {
      target: "InventoryMovement",
      type: "one-to-many",
      inverseSide: "product"
    }
  }
});

module.exports = Product;
