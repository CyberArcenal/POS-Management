// Sale.js
const { EntitySchema } = require("typeorm");

const Sale = new EntitySchema({
  name: "Sale",
  tableName: "sales",
  columns: {
    id: { type: Number, primary: true, generated: true },
    timestamp: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    status: {
      type: "varchar",
      enum: ["initiated", "paid", "refunded", "voided"],
      default: "initiated",
    },
    paymentMethod: {
      type: "varchar",
      enum: ["cash", "card", "wallet"],
      default: "cash",
    },
    totalAmount: { type: "decimal", default: 0.0 },

    usedLoyalty: { type: Boolean, default: false },
    loyaltyRedeemed: { type: Number, default: 0 },
    usedDiscount: { type: Boolean, default: false },
    totalDiscount: { type: Number, default: 0 },
    usedVoucher: { type: Boolean, default: false },
    voucherCode: { type: "varchar", nullable: true },

    notes: { type: String, nullable: true },
    createdAt: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: Date, nullable: true },
  },
  relations: {
    customer: {
      target: "Customer",
      type: "many-to-one",
      joinColumn: true,
      nullable: true,
    },
    saleItems: {
      target: "SaleItem",
      type: "one-to-many",
      inverseSide: "sale",
    },
  },
});

module.exports = Sale;
