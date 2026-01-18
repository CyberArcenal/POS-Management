// src/entities/UserActivity.js
const { EntitySchema } = require("typeorm");

const UserActivity = new EntitySchema({
  name: "UserActivity",
  tableName: "user_activities",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },

    user_id: {
      type: "int",
      name: "user_id", // 👈 snake_case sa DB
      nullable: false,
    },

    action: {
      type: "varchar",
      length: 100,
      nullable: false, // e.g. "login", "update_profile"
    },

    entity: {
      type: "varchar",
      length: 100,
      nullable: true, // optional target entity
    },

    entity_id: {
      type: "int",
      name: "entity_id",
      nullable: true, // optional target entity id
    },

    ip_address: {
      type: "varchar",
      length: 45,
      name: "ip_address",
      nullable: true, // IPv4/IPv6
    },

    user_agent: {
      type: "varchar",
      length: 255,
      name: "user_agent",
      nullable: true, // browser/device info
    },

    details: {
      type: "text",
      nullable: true, // JSON or free text
    },

    created_at: {
      type: "datetime",
      name: "created_at",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
  },

  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "user_id" }, // explicit FK column
      onDelete: "CASCADE",
    },
  },

  indices: [
    { name: "idx_user_activity_user", columns: ["user_id"] },
    { name: "idx_user_activity_action", columns: ["action"] },
    { name: "idx_user_activity_entity", columns: ["entity", "entity_id"] },
  ],
});

module.exports = UserActivity;
