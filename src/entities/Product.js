const { EntitySchema } = require("typeorm");

const Product = new EntitySchema({
  name: "Product",
  tableName: "pos_products",
  columns: {
    id: { type: "int", primary: true, generated: true },

    sku: { type: "varchar", unique: true },
    name: { type: "varchar" },
    price: { type: "int" },
    // ✅ Stock fields for POS + inventory sync
    stock: { type: "int", default: 0 }, // current stock level
    min_stock: { type: "int", default: 0 }, // threshold for alerts

    // ✅ Single source of truth for sync
    stock_item_id: { type: "varchar", nullable: true },

    // ✅ New fields for category/supplier support
    category_name: { type: "varchar", nullable: true },
    supplier_name: { type: "varchar", nullable: true },
    
    // ✅ Additional product details
    barcode: { type: "varchar", nullable: true, unique: true },
    description: { type: "text", nullable: true },
    cost_price: { type: "int", nullable: true }, // For profit calculation
    is_active: { type: "boolean", default: true },
    
    // ✅ Reorder information
    reorder_quantity: { type: "int", default: 0 },
    last_reorder_date: { type: "datetime", nullable: true },

    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
    is_deleted: { type: "boolean", default: false }, // soft delete flag
    
    // ✅ Price tracking
    last_price_change: { type: "datetime", nullable: true },
    original_price: { type: "int", nullable: true }, // Original price for discounts
  },

  relations: {
    saleItems: {
      type: "one-to-many",
      target: "SaleItem",
      inverseSide: "product",
    },
    // ✅ Price history relation
    price_history: {
      type: "one-to-many",
      target: "PriceHistory",
      inverseSide: "product",
    },
    parent_product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "parent_product_id" },
      nullable: true,
      onDelete: "CASCADE",
    },
  },

indices: [
  { columns: ["sku"], unique: true },
  { columns: ["name"] },
  { columns: ["stock_item_id"] },
  { columns: ["barcode"], unique: true },
  { columns: ["is_active"] },
  { columns: ["is_deleted"] },
  { columns: ["stock"] },
  { columns: ["category_name"] }, // added for filtering
  { columns: ["supplier_name"] }, // added for filtering
],
});

module.exports = Product;