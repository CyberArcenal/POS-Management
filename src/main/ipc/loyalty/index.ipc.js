// loyalty/index.ipc.js - Unified Loyalty Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class LoyaltyHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 🎯 PROGRAM SETTINGS
    this.getLoyaltySettings = this.importHandler("./settings/get.ipc");
    this.updateLoyaltySettings = this.importHandler("./settings/update.ipc");
    
    // 👥 LOYALTY CUSTOMERS
    this.getLoyaltyCustomers = this.importHandler("./customers/get_all.ipc");
    this.getLoyaltyCustomerById = this.importHandler("./customers/get_by_id.ipc");
    this.enrollCustomerInLoyalty = this.importHandler("./customers/enroll.ipc");
    
    // ⭐ POINTS MANAGEMENT
    this.adjustCustomerPoints = this.importHandler("./points/adjust.ipc");
    this.getPointsTransactions = this.importHandler("./points/transactions.ipc");
    
    // 🎁 REWARDS MANAGEMENT
    this.getRewardsCatalog = this.importHandler("./rewards/get_all.ipc");
    this.createReward = this.importHandler("./rewards/create.ipc");
    this.updateReward = this.importHandler("./rewards/update.ipc");
    
    // 🔄 REDEMPTIONS
    this.redeemReward = this.importHandler("./redemptions/redeem.ipc");
    this.getRedemptionHistory = this.importHandler("./redemptions/history.ipc");
    this.updateRedemptionStatus = this.importHandler("./redemptions/update_status.ipc");
    
    // 📊 STATISTICS & ANALYTICS
    this.getLoyaltyStats = this.importHandler("./analytics/stats.ipc");
    this.getLoyaltyTiers = this.importHandler("./analytics/tiers.ipc");
    this.getPointsEarningRules = this.importHandler("./analytics/earning_rules.ipc");
    
    // 🔔 NOTIFICATIONS
    this.sendPointsExpirationReminder = this.importHandler("./notifications/expiration_reminder.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[LoyaltyHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not found: ${path}`,
        data: null
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`LoyaltyHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 🎯 PROGRAM SETTINGS
        case "getLoyaltySettings":
          return await this.getLoyaltySettings(enrichedParams);
        
        case "updateLoyaltySettings":
          return await this.handleWithTransaction(this.updateLoyaltySettings, enrichedParams);
        
        // 👥 LOYALTY CUSTOMERS
        case "getLoyaltyCustomers":
          // @ts-ignore
          return await this.getLoyaltyCustomers(enrichedParams.filters, userId);
        
        case "getLoyaltyCustomerById":
          // @ts-ignore
          return await this.getLoyaltyCustomerById(enrichedParams.customer_id, userId);
        
        case "enrollCustomerInLoyalty":
          return await this.handleWithTransaction(this.enrollCustomerInLoyalty, enrichedParams);
        
        // ⭐ POINTS MANAGEMENT
        case "adjustCustomerPoints":
          return await this.handleWithTransaction(this.adjustCustomerPoints, enrichedParams);
        
        case "getPointsTransactions":
          // @ts-ignore
          return await this.getPointsTransactions(enrichedParams.customer_id, enrichedParams.filters, userId);
        
        // 🎁 REWARDS MANAGEMENT
        case "getRewardsCatalog":
          // @ts-ignore
          return await this.getRewardsCatalog(enrichedParams.filters, userId);
        
        case "createReward":
          return await this.handleWithTransaction(this.createReward, enrichedParams);
        
        case "updateReward":
          return await this.handleWithTransaction(this.updateReward, enrichedParams);
        
        // 🔄 REDEMPTIONS
        case "redeemReward":
          return await this.handleWithTransaction(this.redeemReward, enrichedParams);
        
        case "getRedemptionHistory":
          // @ts-ignore
          return await this.getRedemptionHistory(enrichedParams.filters, userId);
        
        case "updateRedemptionStatus":
          return await this.handleWithTransaction(this.updateRedemptionStatus, enrichedParams);
        
        // 📊 STATISTICS & ANALYTICS
        case "getLoyaltyStats":
          // @ts-ignore
          return await this.getLoyaltyStats(enrichedParams.date_range, userId);
        
        case "getLoyaltyTiers":
          return await this.getLoyaltyTiers(userId);
        
        case "getPointsEarningRules":
          return await this.getPointsEarningRules(userId);
        
        // 🔔 NOTIFICATIONS
        case "sendPointsExpirationReminder":
          // @ts-ignore
          return await this.sendPointsExpirationReminder(enrichedParams.customer_id, userId);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("LoyaltyHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("LoyaltyHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {Object} params
   * @param {Function} handler
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);
      
      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
      
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Log loyalty activity
   * @param {number} user_id
   * @param {string} action
   * @param {string} description
   * @param {any} qr
   */
  async logActivity(user_id, action, description, qr = null) {
    try {
      let activityRepo;

      if (qr) {
        activityRepo = qr.manager.getRepository(require("../../../entities/UserActivity"));
      } else {
        activityRepo = AppDataSource.getRepository(require("../../../entities/UserActivity"));
      }

      const activity = activityRepo.create({
        user_id: user_id,
        action,
        description,
        ip_address: "127.0.0.1",
        user_agent: "POS-Management-System",
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log loyalty activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log loyalty activity:", error);
      }
    }
  }
}

// Register IPC handler
const loyaltyHandler = new LoyaltyHandler();

ipcMain.handle(
  "loyalty",
  withErrorHandling(
    // @ts-ignore
    loyaltyHandler.handleRequest.bind(loyaltyHandler),
    "IPC:loyalty"
  )
);

module.exports = { LoyaltyHandler, loyaltyHandler };