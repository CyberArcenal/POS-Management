// entities/Customer.js
const { EntitySchema } = require("typeorm");

const CustomerType = {
  INDIVIDUAL: "individual",
  BUSINESS: "business",
  WHOLESALE: "wholesale",
  RETAIL: "retail",
};

const CustomerStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BLOCKED: "blocked",
};

const Customer = new EntitySchema({
  name: "Customer",
  tableName: "customers",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // ✅ Basic customer information
    customer_code: { type: "varchar", unique: true, nullable: false },
    first_name: { type: "varchar", nullable: true },
    last_name: { type: "varchar", nullable: true },
    display_name: { type: "varchar", nullable: true },

    // ✅ Contact information
    email: { type: "varchar", nullable: true },
    phone: { type: "varchar", nullable: true },
    mobile: { type: "varchar", nullable: true },

    // ✅ Address information
    address_line1: { type: "varchar", nullable: true },
    address_line2: { type: "varchar", nullable: true },
    city: { type: "varchar", nullable: true },
    state: { type: "varchar", nullable: true },
    postal_code: { type: "varchar", nullable: true },
    country: { type: "varchar", nullable: true },

    // ✅ Business information
    company_name: { type: "varchar", nullable: true },
    tax_id: { type: "varchar", nullable: true },
    customer_type: {
      type: "varchar",
      name: "customer_type",
      nullable: false,
      default: CustomerType.INDIVIDUAL,
    },
    status: {
      type: "varchar",
      name: "status",
      nullable: false,
      default: CustomerStatus.ACTIVE,
    },

    credit_limit: { type: "decimal", precision: 10, scale: 2, default: 0 },
    current_balance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    payment_terms: { type: "varchar", nullable: true },
    preferred_payment_method: { type: "varchar", nullable: true },

    // ✅ Customer classification
    customer_group: { type: "varchar", nullable: true },
    customer_rating: { type: "int", default: 0 },

    // ✅ Notes and additional info
    notes: { type: "text", nullable: true },
    tags: { type: "simple-array", nullable: true },

    // ✅ Marketing preferences
    allow_marketing_emails: { type: "boolean", default: true },
    allow_sms_notifications: { type: "boolean", default: true },

    // ✅ Timestamps
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
    last_purchase_at: { type: "datetime", nullable: true },

    // ✅ Audit fields
    created_by: { type: "int", nullable: true },
    updated_by: { type: "int", nullable: true },
  },

  relations: {
    // Customer has many sales
    sales: {
      type: "one-to-many",
      target: "Sale",
      inverseSide: "customer",
    },

    // // Customer can have multiple contacts
    contacts: {
      type: "one-to-many",
      target: "CustomerContact",
      inverseSide: "customer",
    },

    // Customer transaction history
    transactions: {
      type: "one-to-many",
      target: "CustomerTransaction",
      inverseSide: "customer",
    },

    // Customer payment history
    // payments: {
    //   type: "one-to-many",
    //   target: "CustomerPayment",
    //   inverseSide: "customer",
    // },

    // Created by user
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
    },

    // Updated by user
    updater: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "updated_by" },
    },
  },

  indices: [
    {
      name: "idx_customers_customer_code",
      columns: ["customer_code"],
      unique: true,
    },
    { name: "idx_customers_email", columns: ["email"] },
    { name: "idx_customers_phone", columns: ["phone"] },
    { name: "idx_customers_status", columns: ["status"] },
    { name: "idx_customers_customer_type", columns: ["customer_type"] },
    { name: "idx_customers_company_name", columns: ["company_name"] },
    { name: "idx_customers_last_purchase", columns: ["last_purchase_at"] },
  ],
});

module.exports = { CustomerType, CustomerStatus , Customer};
