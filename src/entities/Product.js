// Product.js
const { EntitySchema } = require("typeorm");

const Product = new EntitySchema({
  name: "Product",
  tableName: "products",
  columns: {
    id: { type: Number, primary: true, generated: true },
    sku: { type: String },
    name: { type: String },
    barcode: { type: "varchar", unique: true },
    description: { type: String, nullable: true },
    price: { type: "decimal" },
    stockQty: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },   // threshold for auto-reorder
    reorderQty: { type: Number, default: 0 },     // default reorder quantity
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
    },
    category: {
      target: "Category",
      type: "many-to-one",
      joinColumn: true,
      eager: true
    },
    supplier: {
      target: "Supplier",
      type: "many-to-one",
      joinColumn: true,
      eager: true
    }
  }
});

module.exports = Product;
