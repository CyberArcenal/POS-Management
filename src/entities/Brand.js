// src/entities/Brand.js
const { EntitySchema } = require("typeorm");

const Brand = new EntitySchema({
  name: "Brand",
  tableName: "brands",
  columns: {
    id: { type: "int", primary: true, generated: true },
    name: { type: "varchar", nullable: false },
    description: { type: "text", nullable: true },
    logo_url: { type: "varchar", nullable: true },
    website: { type: "varchar", nullable: true },
    is_active: { type: "boolean", default: true },
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },
  relations: {
    products: {
      type: "one-to-many",
      target: "Product",
      inverseSide: "brand",
    },
  },
  indices: [
    { name: "idx_brands_name", columns: ["name"] },
  ],
});

module.exports = Brand;