// Category.js
const { EntitySchema } = require("typeorm");

const Category = new EntitySchema({
  name: "Category",
  tableName: "categories",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    description: { type: String, nullable: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true },
  },
  relations: {
    products: {
      target: "Product",
      type: "one-to-many",
      inverseSide: "category",
    },
  },
});

module.exports = Category;
