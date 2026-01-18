// src/entities/AuditTrail.js
const { EntitySchema } = require("typeorm");

const AuditTrail = new EntitySchema({
  name: "AuditTrail",
  tableName: "audit_trails",
  columns: {
    id: { type: "int", primary: true, generated: true },
    action: { type: "varchar", length: 100, nullable: false },
    entity: { type: "varchar", length: 100, nullable: false },
    entity_id: { type: "int", name: "entity_id", nullable: false },
    details: { type: "text", nullable: true }, // optional context
    timestamp: {
      type: "datetime",
      name: "timestamp",
      createDateColumn: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    user_id: { type: "int", name: "user_id", nullable: false },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "user_id" },
      onDelete: "CASCADE",
    },
  },
  indices: [
    { name: "idx_audit_entity", columns: ["entity", "entity_id"] },
    { name: "idx_audit_user", columns: ["user_id"] },
    { name: "idx_audit_action_time", columns: ["action", "timestamp"] },
  ],
});

module.exports = AuditTrail;