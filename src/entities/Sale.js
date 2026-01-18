const { EntitySchema } = require("typeorm");

const Sale = new EntitySchema({
  name: "Sale",
  tableName: "sales",
  columns: {
    id: { type: "int", primary: true, generated: true },

    datetime: { type: "datetime", default: () => "CURRENT_TIMESTAMP" },
    total: { type: "int" },

    // ✅ Extra fields for audit/sync clarity
    reference_number: { type: "varchar", nullable: true }, // POS receipt or invoice no.
    status: { type: "varchar", length: 20, default: "completed" }, // completed | refunded | cancelled
    stock_item_id: { type: "varchar", nullable: true }, // link to inventory StockItem if needed

    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },

  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
      onDelete: "SET NULL",
    },
    items: {
      type: "one-to-many",
      target: "SaleItem",
      inverseSide: "sale",
      cascade: true,
    },
  },

  indices: [
    { name: "idx_sales_datetime", columns: ["datetime"] },
    { name: "idx_sales_status", columns: ["status"] },
    { name: "idx_sales_reference_number", columns: ["reference_number"] },
  ],
});

module.exports = Sale;