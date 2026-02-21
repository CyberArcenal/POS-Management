// src/entities/Notification.js
const { EntitySchema } = require("typeorm");

const Notification = new EntitySchema({
  name: "Notification",
  tableName: "notifications",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    userId: {
      type: Number,
      nullable: false,
      comment: "ID of the user who receives this notification",
    },
    title: {
      type: String,
      length: 255,
      nullable: false,
    },
    message: {
      type: "text",
      nullable: false,
    },
    type: {
      type: "varchar",
      length: 50,
      nullable: false,
      default: "info",
      enum: ["info", "success", "warning", "error", "purchase", "sale"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: "simple-json",
      nullable: true,
      comment: "Additional JSON data (e.g., related entity IDs)",
    },
    createdAt: {
      type: "datetime",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
      nullable: true,
    },
  },
  indices: [
    {
      name: "idx_notifications_user_read",
      columns: ["userId", "isRead"],
    },
    {
      name: "idx_notifications_created",
      columns: ["createdAt"],
    },
  ],
});

module.exports = Notification;