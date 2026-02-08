// src/entities/Category.js
const { EntitySchema } = require("typeorm");

const Category = new EntitySchema({
  name: "Category",
  tableName: "categories",
  columns: {
    id: { type: "int", primary: true, generated: true },
    name: { type: "varchar", nullable: false },
    description: { type: "text", nullable: true },
    parent_id: { type: "int", nullable: true },
    sort_order: { type: "int", default: 0 },
    image_url: { type: "varchar", nullable: true },
    is_active: { type: "boolean", default: true },
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },
  relations: {
    parent: {
      type: "many-to-one",
      target: "Category",
      joinColumn: { name: "parent_id" },
      nullable: true,
    },
    products: {
      type: "one-to-many",
      target: "Product",
      inverseSide: "category",
    },
  },
  indices: [
    { name: "idx_categories_name", columns: ["name"] },
    { name: "idx_categories_parent", columns: ["parent_id"] },
  ],
});

module.exports = Category;