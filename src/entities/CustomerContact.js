// entities/CustomerContact.js
const { EntitySchema } = require("typeorm");

const ContactType = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  BILLING: "billing",
  SHIPPING: "shipping",
  TECHNICAL: "technical",
};

const CustomerContact = new EntitySchema({
  name: "CustomerContact",
  tableName: "customer_contacts",
  columns: {
    id: { type: "int", primary: true, generated: true },

    // ✅ Contact information
    customer_id: { type: "int", nullable: false },
    contact_type: {
      type: "varchar", // SQLite-safe (was enum)
      name: "contact_type",
      nullable: false,
      default: ContactType.PRIMARY,
    },
    first_name: { type: "varchar", nullable: true },
    last_name: { type: "varchar", nullable: true },
    position: { type: "varchar", nullable: true },

    // ✅ Contact details
    email: { type: "varchar", nullable: true },
    phone: { type: "varchar", nullable: true },
    mobile: { type: "varchar", nullable: true },

    // ✅ Flags
    is_default_contact: { type: "boolean", default: false },
    receive_statements: { type: "boolean", default: true },
    receive_marketing: { type: "boolean", default: true },

    // ✅ Notes
    notes: { type: "text", nullable: true },

    // ✅ Timestamps
    created_at: { type: "datetime", createDate: true },
    updated_at: { type: "datetime", updateDate: true },
  },

  relations: {
    // Belongs to a customer
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: { name: "customer_id" },
      inverseSide: "contacts",
    },
  },

  indices: [
    { name: "idx_customer_contacts_customer_id", columns: ["customer_id"] },
    { name: "idx_customer_contacts_email", columns: ["email"] },
    {
      name: "idx_customer_contacts_is_default",
      columns: ["is_default_contact"],
    },
  ],
});

module.exports = { CustomerContact, ContactType };
