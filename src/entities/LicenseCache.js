// src/entities/LicenseCache.js
const { EntitySchema } = require("typeorm");

const LicenseCache = new EntitySchema({
  name: "LicenseCache",
  tableName: "license_cache",
  columns: {
    id: {
      type: "integer",
      primary: true,
      generated: "increment",
    },
    license_key: {
      type: "text",
      unique: true,
      nullable: true, // allowed null if status = 'trial'
    },
    license_type: {
      type: "text",
      nullable: false,
    },
    status: {
      type: "text",
      nullable: false,
    },

    // Validity
    expires_at: { type: "datetime", nullable: true },
    activated_at: { type: "datetime", nullable: true },
    days_remaining: { type: "integer", nullable: true },

    // Features & Limits
    features: { type: "text", default: "[]", nullable: true },
    limits: { type: "text", default: "{}", nullable: true },
    usage: { type: "text", default: "{}", nullable: true },
    max_devices: { type: "integer", default: 1 },
    current_devices: { type: "integer", default: 0 },

    // Sync Info
    last_sync: { type: "datetime", nullable: true },
    next_sync_due: { type: "datetime", nullable: true },
    sync_interval_days: { type: "integer", default: 30 },

    // Device Info
    device_id: { type: "text", nullable: true },
    activated_on_device: { type: "datetime", nullable: true },

    // Server Response
    server_response: { type: "text", nullable: true },

    // Extra fields
    activation_id: { type: "text", nullable: true },
    grace_period_days: { type: "integer", default: 7 },
    server_timestamp: { type: "datetime", nullable: true },
    offline_activation: { type: "boolean", default: false },

    // Trial control
    trial_consumed: { type: "boolean", default: false },
    last_deactivated: { type: "datetime", nullable: true },

    // Timestamps
    created_at: {
      type: "datetime",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "datetime",
      updateDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  indices: [
    { name: "idx_license_key", columns: ["license_key"] },
    { name: "idx_expires_at", columns: ["expires_at"] },
    { name: "idx_next_sync", columns: ["next_sync_due"] },
    { name: "idx_license_status_expires", columns: ["status", "expires_at"] },
  ],
});


module.exports = 
  LicenseCache
