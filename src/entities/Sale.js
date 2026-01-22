const { EntitySchema } = require("typeorm");

const Sale = new EntitySchema({
  name: "Sale",
  tableName: "sales",
  columns: {
    id: { type: "int", primary: true, generated: true },

    datetime: { type: "datetime", default: () => "CURRENT_TIMESTAMP" },
    total: { type: "int" },

    // ✅ WAREHOUSE INFORMATION
    warehouse_id: { type: "varchar", nullable: true },
    warehouse_name: { type: "varchar", nullable: true },
    
    // ✅ CUSTOMER INFORMATION
    customer_id: { type: "int", nullable: true },
    customer_name: { type: "varchar", nullable: true },
    customer_phone: { type: "varchar", nullable: true },
    customer_email: { type: "varchar", nullable: true },
    
    // ✅ PAYMENT & DISCOUNTS
    subtotal: { type: "int", default: 0 },
    discount_amount: { type: "int", default: 0 },
    tax_amount: { type: "int", default: 0 },
    payment_method: { 
      type: "varchar", 
      default: "cash",
      check: "payment_method IN ('cash', 'card', 'transfer', 'credit')"
    },
    
    // ✅ STATUS & TRACKING
    status: { 
      type: "varchar", 
      default: "completed",
      check: "status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')"
    },
    reference_number: { type: "varchar", nullable: true, unique: true },
    
    // ✅ INVENTORY SYNC STATUS
    inventory_synced: { type: "boolean", default: false },
    inventory_sync_date: { type: "datetime", nullable: true },
    
    // ✅ AUDIT FIELDS
    user_id: { type: "int", nullable: true },
    user_name: { type: "varchar", nullable: true },
    notes: { type: "text", nullable: true },
    
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
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: { name: "customer_id" },
      onDelete: "SET NULL",
    },
  },

  indices: [
    { name: "idx_sales_datetime", columns: ["datetime"] },
    { name: "idx_sales_status", columns: ["status"] },
    { name: "idx_sales_reference_number", columns: ["reference_number"] },
    { name: "idx_sales_warehouse", columns: ["warehouse_id"] },
    { name: "idx_sales_customer", columns: ["customer_id"] },
    { name: "idx_sales_inventory_synced", columns: ["inventory_synced"] },
  ],
});

module.exports = Sale;