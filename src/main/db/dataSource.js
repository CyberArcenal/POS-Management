// dataSource.js placeholder
//@ts-check
const { DataSource } = require("typeorm");
const { getDatabaseConfig } = require("./database");
const Sale = require("../../entities/Sale");
const SaleItem = require("../../entities/SaleItem");
const Product = require("../../entities/Product");
const AuditTrail = require("../../entities/AuditTrail");
const User = require("../../entities/User");
const SyncData = require("../../entities/SyncData");
const { InventoryAction } = require("../../entities/InventoryTransactionLogs");
const InventoryTransactionLog = require("../../entities/InventoryTransactionLogs");
const PriceHistory = require("../../entities/PriceHistory");
const { SystemSetting } = require("../../entities/systemSettings");
const UserActivity = require("../../entities/UserActivity");
const LicenseCache = require("../../entities/LicenseCache");

const config = getDatabaseConfig();

const entities = [
  Sale,
  SaleItem,
  Product,
  AuditTrail,
  User,
  SyncData,
  InventoryTransactionLog,
  PriceHistory,
  SystemSetting,
  UserActivity,
  LicenseCache,
];

// @ts-ignore
const AppDataSource = new DataSource({
  ...config,
  entities: entities,
});

module.exports = { AppDataSource };
