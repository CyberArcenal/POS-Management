// src/entities/Product.js
const { EntitySchema } = require("typeorm");

const ProductStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DISCONTINUED: "discontinued",
  OUT_OF_STOCK: "out_of_stock",
  LOW_STOCK: "low_stock",
};

const ProductType = {
  SIMPLE: "simple",
  VARIABLE: "variable",
  BUNDLE: "bundle",
  SERVICE: "service",
  DIGITAL: "digital",
};

const TaxType = {
  NONE: "none",
  INCLUSIVE: "inclusive",
  EXCLUSIVE: "exclusive",
};

const Product = new EntitySchema({
  name: "Product",
  tableName: "products",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // ✅ BASIC PRODUCT INFORMATION
    sku: {
      type: "varchar",
      length: 100,
      unique: true,
      nullable: false,
    },
    barcode: {
      type: "varchar",
      length: 100,
      nullable: true,
      unique: true,
    },
    upc: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    display_name: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    description: {
      type: "text",
      nullable: true,
    },

    // ✅ PRODUCT CLASSIFICATION
    product_type: {
      type: "varchar",
      name: "product_type",
      nullable: false,
      default: ProductType.SIMPLE,
    },
    category_id: {
      type: "int",
      nullable: true,
    },
    subcategory_id: {
      type: "int",
      nullable: true,
    },
    brand_id: {
      type: "int",
      nullable: true,
    },

    // ✅ PRICING INFORMATION
    cost_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
    },
    selling_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    wholesale_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
    },
    min_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
    },
    max_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
    },
    markup_percentage: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },

    // ✅ INVENTORY INFORMATION
    stock: {
      type: "int",
      default: 0,
    },
    reserved_stock: {
      type: "int",
      default: 0,
    },
    available_stock: {
      type: "int",
      default: 0,
    },
    min_stock_level: {
      type: "int",
      default: 5,
    },
    max_stock_level: {
      type: "int",
      nullable: true,
    },
    reorder_level: {
      type: "int",
      default: 10,
    },

    // ✅ TAX & DISCOUNT
    tax_rate: {
      type: "decimal",
      precision: 5,
      scale: 2,
      default: 0,
    },
    tax_type: {
      type: "varchar",
      name: "tax_type",
      nullable: false,
      default: TaxType.EXCLUSIVE,
    },
    is_taxable: {
      type: "boolean",
      default: true,
    },
    discount_percentage: {
      type: "decimal",
      precision: 5,
      scale: 2,
      default: 0,
    },
    discount_amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },

    // ✅ PRODUCT DIMENSIONS & WEIGHT
    weight: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    weight_unit: {
      type: "varchar",
      default: "kg",
    },
    length: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    width: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    height: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    dimension_unit: {
      type: "varchar",
      default: "cm",
    },

    // ✅ SUPPLIER INFORMATION
    supplier_id: {
      type: "int",
      nullable: true,
    },
    supplier_sku: {
      type: "varchar",
      nullable: true,
    },
    supplier_price: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
    },
    lead_time_days: {
      type: "int",
      default: 7,
    },

    // ✅ EXPIRY & BATCH
    has_expiry: {
      type: "boolean",
      default: false,
    },
    shelf_life_days: {
      type: "int",
      nullable: true,
    },
    track_batch: {
      type: "boolean",
      default: false,
    },
    track_serial: {
      type: "boolean",
      default: false,
    },

    // ✅ IMAGES & MEDIA
    image_url: {
      type: "varchar",
      nullable: true,
    },
    image_urls: {
      type: "simple-array",
      nullable: true,
    },
    thumbnail_url: {
      type: "varchar",
      nullable: true,
    },

    // ✅ POS SPECIFIC FIELDS
    pos_quick_code: {
      type: "varchar",
      nullable: true,
    },
    pos_category_id: {
      type: "int",
      nullable: true,
    },
    is_quick_sale: {
      type: "boolean",
      default: false,
    },
    is_hidden: {
      type: "boolean",
      default: false,
    },
    kitchen_printer_id: {
      type: "int",
      nullable: true,
    },
    preparation_time: {
      type: "int",
      default: 0,
    }, // in minutes

    // ✅ LOYALTY & REWARDS
    loyalty_points_earn: {
      type: "int",
      default: 0,
    },
    is_reward_product: {
      type: "boolean",
      default: false,
    },
    reward_points_cost: {
      type: "int",
      default: 0,
    },

    // ✅ STATUS & FLAGS
    status: {
      type: "varchar",
      name: "status",
      nullable: false,
      default: ProductStatus.ACTIVE,
    },
    is_active: {
      type: "boolean",
      default: true,
    },
    is_deleted: {
      type: "boolean",
      default: false,
    },
    is_bestseller: {
      type: "boolean",
      default: false,
    },
    is_featured: {
      type: "boolean",
      default: false,
    },
    is_new: {
      type: "boolean",
      default: true,
    },

    // ✅ METADATA
    tags: {
      type: "simple-array",
      nullable: true,
    },
    attributes: {
      type: "simple-json",
      nullable: true,
    }, // For variable products
    specifications: {
      type: "simple-json",
      nullable: true,
    },

    // ✅ TIMESTAMPS
    created_at: {
      type: "datetime",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "datetime",
      updateDate: true,
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
    deleted_at: {
      type: "datetime",
      nullable: true,
    },
    last_sold_at: {
      type: "datetime",
      nullable: true,
    },
    last_received_at: {
      type: "datetime",
      nullable: true,
    },

    // ✅ AUDIT FIELDS
    created_by: {
      type: "int",
      nullable: true,
    },
    updated_by: {
      type: "int",
      nullable: true,
    },
    deleted_by: {
      type: "int",
      nullable: true,
    },

    // ✅ PERFORMANCE METRICS
    total_sold: {
      type: "int",
      default: 0,
    },
    total_returned: {
      type: "int",
      default: 0,
    },
    total_profit: {
      type: "decimal",
      precision: 12,
      scale: 2,
      default: 0,
    },
    average_rating: {
      type: "decimal",
      precision: 3,
      scale: 2,
      default: 0,
    },
    review_count: {
      type: "int",
      default: 0,
    },
  },

  relations: {
    // ✅ SALE ITEMS
    saleItems: {
      type: "one-to-many",
      target: "SaleItem",
      inverseSide: "product",
    },

    // ✅ CATEGORY
    category: {
      type: "many-to-one",
      target: "Category",
      joinColumn: { name: "category_id" },
      nullable: true,
    },

    // ✅ BRAND
    brand: {
      type: "many-to-one",
      target: "Brand",
      joinColumn: { name: "brand_id" },
      nullable: true,
    },

    // ✅ SUPPLIER
    supplier: {
      type: "many-to-one",
      target: "Supplier",
      joinColumn: { name: "supplier_id" },
      nullable: true,
    },

    // ✅ VARIANTS (for variable products)
    variants: {
      type: "one-to-many",
      target: "ProductVariant",
      inverseSide: "parent",
    },

    // ✅ INVENTORY TRANSACTIONS
    inventoryTransactions: {
      type: "one-to-many",
      target: "InventoryTransactionLog",
      inverseSide: "product",
    },

    // ✅ PRICE HISTORY
    priceHistory: {
      type: "one-to-many",
      target: "PriceHistory",
      inverseSide: "product",
    },

    // ✅ CREATED BY USER
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
    },

    // ✅ UPDATED BY USER
    updater: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "updated_by" },
    },

    // ✅ REWARDS (if product is used as reward)
    rewardItem: {
      type: "one-to-one",
      target: "RewardItem",
      joinColumn: { name: "id" },
      inverseSide: "product",
    },
  },

  indices: [
    {
      name: "idx_products_sku",
      columns: ["sku"],
      unique: true,
    },
    {
      name: "idx_products_barcode",
      columns: ["barcode"],
      unique: true,
    },
    {
      name: "idx_products_name",
      columns: ["name"],
    },
    {
      name: "idx_products_status",
      columns: ["status"],
    },
    {
      name: "idx_products_category",
      columns: ["category_id"],
    },
    {
      name: "idx_products_supplier",
      columns: ["supplier_id"],
    },
    {
      name: "idx_products_stock",
      columns: ["stock"],
    },
    {
      name: "idx_products_active",
      columns: ["is_active"],
    },
    {
      name: "idx_products_price",
      columns: ["selling_price"],
    },
    {
      name: "idx_products_pos_quick_code",
      columns: ["pos_quick_code"],
    },
    {
      name: "idx_products_type",
      columns: ["product_type"],
    },
    {
      name: "idx_products_created",
      columns: ["created_at"],
    },
    {
      name: "idx_products_sku_name",
      columns: ["sku", "name"],
    },
    {
      name: "idx_products_supplier_sku",
      columns: ["supplier_sku"],
    },
    {
      name: "idx_products_total_sold",
      columns: ["total_sold"],
    },
    {
      name: "idx_products_is_deleted",
      columns: ["is_deleted"],
    },
  ],
});

// ✅ Virtual Property (for computed available stock)
// Note: This needs to be handled in the application layer
Product.computedProperties = {
  available_stock: {
    get() {
      return Math.max(0, this.stock - this.reserved_stock);
    },
    set(value) {
      // Read-only computed property
    },
  },
};

module.exports = {
  Product,
  ProductStatus,
  ProductType,
  TaxType,
};
