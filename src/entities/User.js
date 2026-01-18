const { EntitySchema } = require("typeorm");

const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: "int", primary: true, generated: true },

    username: { type: "varchar", unique: true },
    role: { type: "varchar" },
    
    // ✅ Password field for authentication
    password: { type: "varchar", nullable: true },
    
    // ✅ Additional user details
    first_name: { type: "varchar", nullable: true },
    last_name: { type: "varchar", nullable: true },
    display_name: { type: "varchar", nullable: true },

    // ✅ Snake_case timestamps
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },

    // ✅ Optional audit fields
    email: { type: "varchar", nullable: true },
    is_active: { type: "boolean", default: true },
    
    // ✅ For inventory transactions
    employee_id: { type: "varchar", nullable: true },
    department: { type: "varchar", nullable: true },
    
    // ✅ Permissions for product management
    can_manage_products: { type: "boolean", default: false },
    can_adjust_inventory: { type: "boolean", default: false },
    can_view_reports: { type: "boolean", default: true },
    
    last_login_at: { type: "datetime", nullable: true },
  },

  relations: {
    sales: {
      type: "one-to-many",
      target: "Sale",
      inverseSide: "user",
    },
    inventory_transactions: {
      type: "one-to-many",
      target: "InventoryTransactionLog",
      inverseSide: "performed_by",
    },
    price_changes: {
      type: "one-to-many",
      target: "PriceHistory",
      inverseSide: "changed_by",
    },
    activities: {
      type: "one-to-many",
      target: "UserActivity",
      inverseSide: "user",
    },
  },

  indices: [
    { name: "idx_users_username", columns: ["username"], unique: true },
    { name: "idx_users_role", columns: ["role"] },
    { name: "idx_users_is_active", columns: ["is_active"] },
    { name: "idx_users_email", columns: ["email"] },
    { name: "idx_users_employee_id", columns: ["employee_id"] },
  ],
});

module.exports = User;