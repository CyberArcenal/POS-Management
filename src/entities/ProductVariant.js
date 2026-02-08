// src/entities/ProductVariant.js
const { EntitySchema } = require("typeorm");

const ProductVariant = new EntitySchema({
  name: "ProductVariant",
  tableName: "product_variants",
  columns: {
    id: { type: "int", primary: true, generated: true },
    product_id: { type: "int", nullable: false },
    sku: { type: "varchar", unique: true, nullable: false },
    variant_name: { type: "varchar", nullable: false },
    attributes: { type: "simple-json", nullable: true }, // {color: "red", size: "M"}
    price_adjustment: { type: "decimal", precision: 10, scale: 2, default: 0 },
    stock: { type: "int", default: 0 },
    barcode: { type: "varchar", nullable: true, unique: true },
    image_url: { type: "varchar", nullable: true },
    is_active: { type: "boolean", default: true },
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },
  relations: {
    parent: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "product_id" },
    },
  },
  indices: [
    { name: "idx_variants_product", columns: ["product_id"] },
    { name: "idx_variants_sku", columns: ["sku"], unique: true },
  ],
});

module.exports = ProductVariant;