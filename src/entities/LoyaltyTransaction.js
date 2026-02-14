// LoyaltyTransaction.js
const { EntitySchema } = require("typeorm");

const LoyaltyTransaction = new EntitySchema({
  name: "LoyaltyTransaction",
  tableName: "loyalty_transactions",
  columns: {
    id: { type: Number, primary: true, generated: true },
    pointsChange: { type: Number }, // + earned, - redeemed
    timestamp: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    notes: { type: String, nullable: true }, // optional context (e.g., promo, manual adjustment)
    updatedAt: { type: Date, nullable: true }
  },
  relations: {
    customer: {
      target: "Customer",
      type: "many-to-one",
      joinColumn: true
    },
    sale: {
      target: "Sale",
      type: "many-to-one",
      joinColumn: true,
      nullable: true
    }
  }
});

module.exports = LoyaltyTransaction;
