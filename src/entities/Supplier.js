// Supplier.js
const { EntitySchema } = require("typeorm");

const Supplier = new EntitySchema({
  name: "Supplier",
  tableName: "suppliers",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    contactInfo: { type: String, nullable: true },
    email: {type: String, nullable:true},
    phone: {type: String, nullable: true},
    address: { type: String, nullable: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true },
  },
  relations: {
    products: {
      target: "Product",
      type: "one-to-many",
      inverseSide: "supplier",
    },
  },
});

module.exports = Supplier;
