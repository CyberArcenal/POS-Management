const { EntitySchema } = require("typeorm");

const PriceHistory = new EntitySchema({
  name: "PriceHistory",
  tableName: "price_history",
  columns: {
    id: { type: "int", primary: true, generated: true },
    product_id: { type: "int", nullable: false },
    old_price: { type: "int", nullable: false },
    new_price: { type: "int", nullable: false },
    change_type: { 
      type: "varchar", 
      nullable: true,
      default: "manual" // manual, discount, promotion, cost_based, seasonal
    },
    change_reason: { type: "text", nullable: true },
    effective_date: { 
      type: "datetime", 
      default: () => "CURRENT_TIMESTAMP" 
    },
    changed_by_id: { type: "int", nullable: true },
    
    // ✅ Reference to sale or promotion
    reference_id: { type: "varchar", nullable: true },
    reference_type: { type: "varchar", nullable: true },
    
    created_at: { type: "datetime", createDate: true },
  },

  relations: {
    product: {
      target: "Product",
      type: "many-to-one",
      joinColumn: { name: "product_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
    changed_by: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "changed_by_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },

  indices: [
    { columns: ["product_id"] },
    { columns: ["effective_date"] },
    { columns: ["change_type"] },
    { columns: ["product_id", "effective_date"] },
  ],
});

module.exports = PriceHistory;