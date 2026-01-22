// StockChange.js
const { EntitySchema } = require("typeorm");

const StockChange = new EntitySchema({
  name: "StockChange",
  tableName: "pos_stock_changes",
  columns: {
    id: { type: "int", primary: true, generated: true },
    
    // PRODUCT & WAREHOUSE
    product_id: { type: "int", nullable: false },
    warehouse_id: { type: "varchar", nullable: false },
    
    // CHANGE DETAILS
    quantity_change: { type: "int", nullable: false }, // + for increase, - for decrease
    quantity_before: { type: "int", nullable: false },
    quantity_after: { type: "int", nullable: false },
    
    // CHANGE TYPE
    change_type: { 
      type: "varchar", 
      nullable: false,
      check: "change_type IN ('sale', 'return', 'adjustment', 'transfer_in', 'transfer_out')"
    },
    
    // REFERENCE (sale, return, etc.)
    reference_id: { type: "varchar", nullable: true },
    reference_type: { type: "varchar", nullable: true }, // 'sale', 'return', 'manual'
    
    // SYNC STATUS
    synced_to_inventory: { type: "boolean", default: false },
    sync_date: { type: "datetime", nullable: true },
    inventory_transaction_id: { type: "varchar", nullable: true },
    
    // PERFORMED BY
    performed_by_id: { type: "varchar", nullable: true },
    performed_by_name: { type: "varchar", nullable: true },
    
    // NOTES
    notes: { type: "text", nullable: true },
    
    // TIMESTAMPS
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },
  
  relations: {
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "product_id" },
      nullable: false,
    },
  },
  
  indices: [
    { columns: ["product_id"] },
    { columns: ["warehouse_id", "synced_to_inventory"] },
    { columns: ["created_at"] },
    { columns: ["change_type"] },
    { columns: ["reference_id"] },
  ],
});

module.exports = StockChange;