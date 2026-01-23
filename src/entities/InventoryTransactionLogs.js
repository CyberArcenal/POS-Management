const { EntitySchema } = require("typeorm");

// ✅ Define enums as constants
const InventoryAction = {
  ORDER_ALLOCATION: "order_allocation",
  ORDER_CANCELLATION: "order_cancellation",
  ORDER_CONFIRMATION: "order_confirmation",
  ORDER_COMPLETED: "order_completed",
  ORDER_REFUND: "order_refund",
  MANUAL_ADJUSTMENT: "manual_adjustment",
  RETURN: "return",
  TRANSFER_IN: "transfer_in",
  TRANSFER_OUT: "transfer_out",
  DAMAGE: "damage",
  REPLENISHMENT: "replenishment",
  STOCK_TAKE: "stock_take",
  EXPIRY: "expiry",
  FOUND: "found",
  THEFT: "theft",
  CORRECTION: "correction",
  QUICK_INCREASE: "quick_increase",
  QUICK_DECREASE: "quick_decrease",
  BULK_INCREASE: "bulk_increase",
  BULK_DECREASE: "bulk_decrease",
  VARIANT_ADJUSTMENT: "variant_adjustment",
  QUARANTINE: "quarantine",
  CONSIGNMENT: "consignment",
  DONATION: "donation",
  PRODUCTION: "production",
  RECALL: "recall",
  PURCHASE_RECEIVE: "purchase_receive",
  PURCHASE_CANCEL: "purchase_cancel",
  // ✅ New actions for IPC methods
  SALE: "sale",
  PRICE_CHANGE: "price_change",
  STOCK_SYNC: "stock_sync",
  CATEGORY_CHANGE: "category_change",
  SUPPLIER_CHANGE: "supplier_change",
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_ARCHIVED: "product_archived",
  PRODUCT_RESTORED: "product_restored",
};

const InventoryTransactionLog = new EntitySchema({
  name: "InventoryTransactionLog",
  tableName: "inventory_transaction_logs",
  columns: {
    id: { type: "int", primary: true, generated: true },

    product_id: { type: "varchar", nullable: true },
    warehouse_id: {type: "varchar", nullable: true},

    // ✅ Enum via varchar + constants
    action: {
      type: "varchar",
      length: 50,
      nullable: false,
      default: InventoryAction.MANUAL_ADJUSTMENT,
    },

    change_amount: { type: "int", nullable: false },
    quantity_before: { type: "int", nullable: false },
    quantity_after: { type: "int", nullable: false },
    
    // ✅ Price information for price history
    price_before: { type: "int", nullable: true },
    price_after: { type: "int", nullable: true },
    
    // ✅ Additional reference fields
    reference_id: { type: "varchar", nullable: true }, // sale_id, return_id, etc.
    reference_type: { type: "varchar", length: 50, nullable: true }, // sale, return, adjustment

    performed_by_id: { type: "varchar", nullable: true },

    notes: { type: "text", nullable: true },
    
    batch_number: { type: "varchar", nullable: true },
    expiry_date: { type: "datetime", nullable: true },

    created_at: {
      type: "datetime",
      default: () => "CURRENT_TIMESTAMP",
      createDate: true,
    },
    
    // ✅ For auditing
    ip_address: { type: "varchar", nullable: true },
    user_agent: { type: "varchar", nullable: true },
  },

  relations: {
    product: {
      target: "Product",
      type: "many-to-one",
      joinColumn: { name: "product_id" },
      nullable: true,
      onDelete: "CASCADE",
    },
    performed_by: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "performed_by_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },

  indices: [
    { name: "idx_inventory_transaction_logs_created_at", columns: ["created_at"] },
    { name: "idx_inventory_transaction_logs_action", columns: ["action"] },
    { name: "idx_inventory_transaction_logs_product", columns: ["product_id"] },
    { name: "idx_inventory_transaction_logs_reference", columns: ["reference_id", "reference_type"] },
    { name: "idx_inventory_transaction_logs_user", columns: ["performed_by_id"] },
    { name: "idx_inventory_transaction_logs_date_action", columns: ["created_at", "action"] },
  ],
});

// ✅ Export the enum constants
module.exports = InventoryTransactionLog;
module.exports.InventoryAction = InventoryAction;