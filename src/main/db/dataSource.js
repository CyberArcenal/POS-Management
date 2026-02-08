// dataSource.js placeholder
//@ts-check
const { DataSource } = require("typeorm");
const { getDatabaseConfig } = require("./database");
const Sale = require("../../entities/Sale");
const SaleItem = require("../../entities/SaleItem");
const AuditTrail = require("../../entities/AuditTrail");
const User = require("../../entities/User");
const { InventoryAction } = require("../../entities/InventoryTransactionLogs");
const InventoryTransactionLog = require("../../entities/InventoryTransactionLogs");
const PriceHistory = require("../../entities/PriceHistory");
const { SystemSetting } = require("../../entities/systemSettings");
const UserActivity = require("../../entities/UserActivity");
const LicenseCache = require("../../entities/LicenseCache");
const { Customer } = require("../../entities/Customer");
const { LoyaltyProgram } = require("../../entities/LoyaltyProgram");
const { LoyaltyCustomer } = require("../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../entities/PointsTransaction");
const { RewardItem } = require("../../entities/RewardItem");
const { RedemptionHistory } = require("../../entities/RedemptionHistory");
const { PointsEarningRule } = require("../../entities/PointsEarningRule");
const { CustomerContact } = require("../../entities/CustomerContact");
const { CustomerTransaction } = require("../../entities/CustomerTransaction");
const Category = require("../../entities/Category");
const ProductVariant = require("../../entities/ProductVariant");
const Supplier = require("../../entities/Supplier");
const Brand = require("../../entities/Brand");
const { Product } = require("../../entities/Product");


const config = getDatabaseConfig();

const entities = [
  Sale,
  SaleItem,
  Product,
  AuditTrail,
  User,
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
  Brand,
  Category,
  ProductVariant,
  Supplier
];

// @ts-ignore
const AppDataSource = new DataSource({
  ...config,
  entities: entities,
});

module.exports = { AppDataSource };
