// InventoryMovement.js
const { EntitySchema } = require("typeorm");

const InventoryMovement = new EntitySchema({
  name: "InventoryMovement",
  tableName: "inventory_movements",
  columns: {
    id: { type: Number, primary: true, generated: true },
    movementType: {
      type: "varchar",
      enum: ["sale", "refund", "adjustment"],
      default: "sale"
    }, // sale, refund, adjustment
    qtyChange: { type: Number },
    timestamp: { type: Date, default: () => "CURRENT_TIMESTAMP" },
    notes: { type: String, nullable: true },
    updatedAt: { type: Date, nullable: true }
  },
  relations: {
    product: {
      target: "Product",
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

module.exports = InventoryMovement;
