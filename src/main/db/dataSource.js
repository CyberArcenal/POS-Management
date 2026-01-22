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
const {Customer} = require("../../entities/Customer");
const { LoyaltyProgram } = require("../../entities/LoyaltyProgram");
const { LoyaltyCustomer } = require("../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../entities/PointsTransaction");
const { RewardItem } = require("../../entities/RewardItem");
const { RedemptionHistory } = require("../../entities/RedemptionHistory");
const { PointsEarningRule } = require("../../entities/PointsEarningRule");
const { CustomerContact } = require("../../entities/CustomerContact");
const { CustomerTransaction } = require("../../entities/CustomerTransaction");

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
  
  CustomerContact,
  CustomerTransaction,
  LoyaltyProgram,
  LoyaltyCustomer,
  PointsTransaction,
  RewardItem,
  RedemptionHistory,
  PointsEarningRule,
  Customer,
];

// @ts-ignore
const AppDataSource = new DataSource({
  ...config,
  entities: entities,
});

module.exports = { AppDataSource };
