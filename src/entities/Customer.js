// Customer.js
const { EntitySchema } = require("typeorm");

const Customer = new EntitySchema({
  name: "Customer",
  tableName: "customers",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    contactInfo: { type: String, nullable: true },
    loyaltyPointsBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true }
  },
  relations: {
    sales: {
      target: "Sale",
      type: "one-to-many",
      inverseSide: "customer"
    },
    loyaltyTransactions: {
      target: "LoyaltyTransaction",
      type: "one-to-many",
      inverseSide: "customer"
    }
  }
});

module.exports = Customer;
