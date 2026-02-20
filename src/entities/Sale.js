// Sale.js
const { EntitySchema } = require("typeorm");

const Sale = new EntitySchema({
  name: "Sale",
  tableName: "sales",
  columns: {
    id: { type: "integer", primary: true, generated: true },
    timestamp: { type: "datetime", default: () => "CURRENT_TIMESTAMP" },
    status: {
      type: "text",
      enum: ["initiated", "paid", "refunded", "voided"],
      default: "initiated",
    },
    paymentMethod: {
      type: "text",
      enum: ["cash", "card", "wallet"],
      default: "cash",
    },
    totalAmount: { type: "real", default: 0.0 }, // SQLite: use REAL for amounts

    usedLoyalty: { type: "boolean", default: false },
    loyaltyRedeemed: { type: "integer", default: 0 },
    usedDiscount: { type: "boolean", default: false },
    totalDiscount: { type: "real", default: 0.0 },
    usedVoucher: { type: "boolean", default: false },
    voucherCode: { type: "text", nullable: true },
    pointsEarn: { type: "real", default: 0.0 }, // REAL for fractional points

    notes: { type: "text", nullable: true },
    createdAt: { type: "datetime", default: () => "CURRENT_TIMESTAMP" },
    updatedAt: { type: "datetime", nullable: true },
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
