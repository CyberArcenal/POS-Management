const { EntitySchema } = require("typeorm");

const Product = new EntitySchema({
  name: "Product",
  tableName: "pos_products",
  columns: {
    id: { type: "int", primary: true, generated: true },

    sku: { type: "varchar", unique: true },
    name: { type: "varchar" },
    price: { type: "int" },
    stock: { type: "int", default: 0 },
    min_stock: { type: "int", default: 0 },

    // ✅ UNIQUE SYNC IDENTIFIER PER WAREHOUSE
    sync_id: { 
      type: "varchar", 
      nullable: true,
      unique: true // Format: "itemId_warehouseId"
    },
    
    // ✅ WAREHOUSE INFORMATION
    warehouse_id: { type: "varchar", nullable: true },
    warehouse_name: { type: "varchar", nullable: true },
    
    // ✅ VARIANT HANDLING
    is_variant: { type: "boolean", default: false },
    variant_name: { type: "varchar", nullable: true },
    parent_product_id: { type: "varchar", nullable: true },
    
    // ✅ INVENTORY REFERENCE
    stock_item_id: { type: "varchar", nullable: true }, // Original item ID from inventory
    item_type: { 
      type: "varchar", 
      nullable: true,
      default: "product" // "product" or "variant"
    },
    
    // ✅ SYNC STATUS
    sync_status: { 
      type: "varchar", 
      default: "synced", // "synced", "pending", "error", "out_of_sync"
    },
    last_sync_at: { type: "datetime", nullable: true },
    
    // ✅ CATEGORY/SUPPLIER
    category_name: { type: "varchar", nullable: true },
    supplier_name: { type: "varchar", nullable: true },
    
    // ✅ PRODUCT DETAILS
    barcode: { type: "varchar", nullable: true, unique: true },
    description: { type: "text", nullable: true },
    cost_price: { type: "int", nullable: true },
    is_active: { type: "boolean", default: true },
    
    // ✅ TRACKING
    reorder_quantity: { type: "int", default: 0 },
    last_reorder_date: { type: "datetime", nullable: true },
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
    is_deleted: { type: "boolean", default: false },
    
    // ✅ PRICE HISTORY
    last_price_change: { type: "datetime", nullable: true },
    original_price: { type: "int", nullable: true },
  },

  relations: {
    saleItems: {
      type: "one-to-many",
      target: "SaleItem",
      inverseSide: "product",
    },
    price_history: {
      type: "one-to-many",
      target: "PriceHistory",
      inverseSide: "product",
    },
    stock_changes: {
      type: "one-to-many",
      target: "StockChange",
      inverseSide: "product",
    },
  },

  indices: [
    { columns: ["sku"], unique: true },
    { columns: ["name"] },
    { columns: ["sync_id"], unique: true },
    { columns: ["stock_item_id"] },
    { columns: ["barcode"], unique: true },
    { columns: ["is_active"] },
    { columns: ["is_deleted"] },
    { columns: ["stock"] },
    { columns: ["category_name"] },
    { columns: ["supplier_name"] },
    { columns: ["warehouse_id"] },
    { columns: ["is_variant"] },
    { columns: ["parent_product_id"] },
    { columns: ["sync_status"] },
  ],
});

module.exports = Product;