const { EntitySchema } = require("typeorm");

const SaleItem = new EntitySchema({
  name: "SaleItem",
  tableName: "sale_items",
  columns: {
    id: { type: "int", primary: true, generated: true },

    sale_id: { type: "int" },
    product_id: { type: "int" },
    
    // ✅ WAREHOUSE & INVENTORY SYNC
    warehouse_id: { type: "varchar", nullable: true },
    sync_id: { type: "varchar", nullable: true }, // product_variant_sync_id
    inventory_synced: { type: "boolean", default: false },
    
    // ✅ PRODUCT DETAILS (cached at time of sale)
    product_name: { type: "varchar" },
    product_barcode: { type: "varchar", nullable: true },
    product_sku: { type: "varchar", nullable: true },
    is_variant: { type: "boolean", default: false },
    variant_name: { type: "varchar", nullable: true },
    
    // ✅ PRICING
    quantity: { type: "int", nullable: false },
    unit_price: { type: "int", nullable: false },
    total_price: { type: "int", nullable: false },
    
    // ✅ COST & PROFIT
    cost_price: { type: "int", nullable: true },
    profit: { type: "int", nullable: true },
    
    // ✅ DISCOUNTS
    discount_percentage: { type: "decimal", precision: 5, scale: 2, default: 0 },
    discount_amount: { type: "int", default: 0 },
    price_before_discount: { type: "int", nullable: true },
    
    // ✅ RETURN TRACKING
    returned_quantity: { type: "int", default: 0 },
    is_returned: { type: "boolean", default: false },
    return_reason: { type: "varchar", nullable: true },
    return_date: { type: "datetime", nullable: true },

    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },

  relations: {
    sale: {
      type: "many-to-one",
      target: "Sale",
      joinColumn: { name: "sale_id" },
      onDelete: "CASCADE",
    },
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "product_id" },
      onDelete: "SET NULL",
    },
  },

  indices: [
    { name: "idx_sale_items_sale_id", columns: ["sale_id"] },
    { name: "idx_sale_items_product_id", columns: ["product_id"] },
    { name: "idx_sale_items_is_returned", columns: ["is_returned"] },
    { name: "idx_sale_items_sync_id", columns: ["sync_id"] },
    { name: "idx_sale_items_inventory_synced", columns: ["inventory_synced"] },
  ],
});

module.exports = SaleItem;