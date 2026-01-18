const { EntitySchema } = require("typeorm");

const SaleItem = new EntitySchema({
  name: "SaleItem",
  tableName: "sale_items",
  columns: {
    id: { type: "int", primary: true, generated: true },

    sale_id: { type: "int" }, // FK to Sale
    product_id: { type: "int" }, // FK to Product

    stock_item_id: { type: "varchar", nullable: true }, // sync reference to inventory StockItem

    quantity: { type: "int", nullable: false },
    unit_price: { type: "int", nullable: false },
    total_price: { type: "int", nullable: false },
    
    // ✅ Discount support
    discount_percentage: { type: "decimal", precision: 5, scale: 2, default: 0 },
    discount_amount: { type: "int", default: 0 },
    price_before_discount: { type: "int", nullable: true },
    
    // ✅ Cost and profit tracking
    cost_price: { type: "int", nullable: true },
    profit: { type: "int", nullable: true },
    
    // ✅ Return tracking
    returned_quantity: { type: "int", default: 0 },
    is_returned: { type: "boolean", default: false },
    return_reason: { type: "varchar", nullable: true },

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
  ],
});

module.exports = SaleItem;