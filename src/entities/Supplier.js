// src/entities/Supplier.js
const { EntitySchema } = require("typeorm");

const Supplier = new EntitySchema({
  name: "Supplier",
  tableName: "suppliers",
  columns: {
    id: { type: "int", primary: true, generated: true },
    code: { type: "varchar", unique: true, nullable: false },
    name: { type: "varchar", nullable: false },
    contact_person: { type: "varchar", nullable: true },
    email: { type: "varchar", nullable: true },
    phone: { type: "varchar", nullable: true },
    address: { type: "text", nullable: true },
    tax_id: { type: "varchar", nullable: true },
    payment_terms: { type: "varchar", nullable: true },
    is_active: { type: "boolean", default: true },
    notes: { type: "text", nullable: true },
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },
  relations: {
    products: {
      type: "one-to-many",
      target: "Product",
      inverseSide: "supplier",
    },
  },
  indices: [
    { name: "idx_suppliers_code", columns: ["code"], unique: true },
    { name: "idx_suppliers_name", columns: ["name"] },
  ],
});

module.exports = Supplier;