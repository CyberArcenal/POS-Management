// dashboard/index.js - Main Dashboard Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

// Import modular handlers
const salesAnalytics = require("./handlers/salesAnalytics");
const inventoryAnalytics = require("./handlers/inventoryAnalytics");
const performanceAnalytics = require("./handlers/performanceAnalytics");
const financialAnalytics = require("./handlers/financialAnalytics");
const realTimeDashboard = require("./handlers/realTimeDashboard");
const mobileDashboard = require("./handlers/mobileDashboard");

class DashboardHandler {
  constructor() {
    this.repositories = null;
    this.initializeRepositories();
  }

  initializeRepositories() {
    try {
      this.repositories = {
        sales: AppDataSource.getRepository("Sale"),
        product: AppDataSource.getRepository("Product"),
        user: AppDataSource.getRepository("User"),
        inventory: AppDataSource.getRepository("InventoryTransactionLog"),
        syncData: AppDataSource.getRepository("SyncData"),
        userActivity: AppDataSource.getRepository("UserActivity"),
        auditTrail: AppDataSource.getRepository("AuditTrail"),
        priceHistory: AppDataSource.getRepository("PriceHistory"),
        saleItem: AppDataSource.getRepository("SaleItem")
      };
    } catch (error) {
      console.error("Failed to initialize repositories:", error);
      if (logger) {
        // @ts-ignore
        logger.error("Failed to initialize repositories:", error);
      }
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`DashboardHandler: ${method}`, { params, userId });
      }

      // Ensure repositories are initialized
      if (!this.repositories) {
        this.initializeRepositories();
        if (!this.repositories) {
          throw new Error("Database repositories not available");
        }
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📊 SALES ANALYTICS
        case "getSalesOverview":
          // @ts-ignore
          return await salesAnalytics.getSalesOverview(this.repositories, params);
        
        case "getSalesTrend":
          // @ts-ignore
          return await salesAnalytics.getSalesTrend(this.repositories, params);
        
        case "getTopSellingProducts":
          // @ts-ignore
          return await salesAnalytics.getTopSellingProducts(this.repositories, params);
        
        case "getSalesByCategory":
          // @ts-ignore
          return await salesAnalytics.getSalesByCategory(this.repositories, params);
        
        case "getHourlySalesPattern":
          return await salesAnalytics.getHourlySalesPattern(this.repositories, params);
        
        case "getSalesComparison":
          // @ts-ignore
          return await salesAnalytics.getSalesComparison(this.repositories, params);

        // 📦 INVENTORY ANALYTICS
        case "getInventoryOverview":
          return await inventoryAnalytics.getInventoryOverview(this.repositories, params);
        
        case "getLowStockAlerts":
          return await inventoryAnalytics.getLowStockAlerts(this.repositories, params);
        
        case "getStockMovement":
          // @ts-ignore
          return await inventoryAnalytics.getStockMovement(this.repositories, params);
        
        case "getInventoryTurnover":
          return await inventoryAnalytics.getInventoryTurnover(this.repositories, params);
        
        case "getExpiringProducts":
          return await inventoryAnalytics.getExpiringProducts(this.repositories, params);
        
        case "getInventoryValue":
          return await inventoryAnalytics.getInventoryValue(this.repositories, params);

        // 👤 PERFORMANCE ANALYTICS
        case "getStaffPerformance":
          return await performanceAnalytics.getStaffPerformance(this.repositories, params);
        
        case "getCashierPerformance":
          return await performanceAnalytics.getCashierPerformance(this.repositories, params);
        
        case "getUserActivitySummary":
          return await performanceAnalytics.getUserActivitySummary(this.repositories, params);

        // 💰 FINANCIAL METRICS
        case "getRevenueMetrics":
          return await financialAnalytics.getRevenueMetrics(this.repositories, params);
        
        case "getProfitAnalysis":
          return await financialAnalytics.getProfitAnalysis(this.repositories, params);
        
        case "getAverageTransactionValue":
          return await financialAnalytics.getAverageTransactionValue(this.repositories, params);
        
        case "getDiscountAnalysis":
          return await financialAnalytics.getDiscountAnalysis(this.repositories, params);

        // 📈 REAL-TIME DASHBOARD
        case "getLiveDashboard":
          return await realTimeDashboard.getLiveDashboard(this.repositories, params);
        
        case "getTodayStats":
          return await realTimeDashboard.getTodayStats(this.repositories, params);
        
        case "getRealTimeSales":
          return await realTimeDashboard.getRealTimeSales(this.repositories, params);
        
        case "getCurrentQueue":
          return await realTimeDashboard.getCurrentQueue(this.repositories, params);
        
        case "getSyncStatus":
          return await realTimeDashboard.getSyncStatus(this.repositories, params);
        
        case "getSystemHealth":
          return await this.getSystemHealth(this.repositories, params);
        
        case "getAuditSummary":
          return await this.getAuditSummary(this.repositories, params);
        
        case "getRecentActivities":
          return await this.getRecentActivities(this.repositories, params);

        // 📱 MOBILE DASHBOARD
        case "getMobileDashboard":
          return await mobileDashboard.getMobileDashboard(this.repositories, params);
        
        case "getQuickStats":
          return await mobileDashboard.getQuickStats(this.repositories, params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DashboardHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("DashboardHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // Missing methods that need implementation

  // @ts-ignore
  async getSystemHealth(repositories, params) {
    // Implementation for system health
    return {
      status: true,
      message: "System health check",
      data: {
        database: { status: "connected", uptime: process.uptime() },
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }


  /**
   * @param {{ sales?: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ startDate?: any; endDate?: any; }} params
   */
  async getAuditSummary(repositories, params) {
    const { auditTrail: auditRepo } = repositories;
    const { startDate, endDate } = params;
    
    const query = auditRepo.createQueryBuilder("audit")
      .select([
        "audit.action",
        "COUNT(*) as count",
        "MIN(audit.timestamp) as first",
        "MAX(audit.timestamp) as last"
      ])
      .groupBy("audit.action")
      .orderBy("count", "DESC");

    if (startDate && endDate) {
      query.where("audit.timestamp BETWEEN :start AND :end", { start: startDate, end: endDate });
    }

    const auditSummary = await query.getRawMany();

    return {
      status: true,
      message: "Audit summary retrieved",
      data: {
        summary: auditSummary.map((/** @type {{ audit_action: any; count: string; first: any; last: any; }} */ a) => ({
          action: a.audit_action,
          count: parseInt(a.count),
          first: a.first,
          last: a.last
        })),
        total: auditSummary.reduce((/** @type {number} */ sum, /** @type {{ count: string; }} */ a) => sum + parseInt(a.count), 0)
      }
    };
  }


  /**
   * @param {{ sales?: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ limit?: any; }} params
   */
  async getRecentActivities(repositories, params) {
    const { userActivity: activityRepo } = repositories;
    const { limit = 20 } = params;
    
    const activities = await activityRepo.createQueryBuilder("activity")
      .leftJoin("activity.user", "user")
      .select([
        "activity.id",
        "activity.action",
        "activity.entity",
        "activity.entity_id",
        "activity.created_at",
        "user.username",
        "user.display_name"
      ])
      .orderBy("activity.created_at", "DESC")
      .limit(limit)
      .getRawMany();

    return {
      status: true,
      message: "Recent activities retrieved",
      data: {
        activities: activities.map((/** @type {{ activity_id: any; activity_action: any; activity_entity: any; activity_entity_id: any; activity_created_at: any; user_username: any; user_display_name: any; }} */ a) => ({
          id: a.activity_id,
          action: a.activity_action,
          entity: a.activity_entity,
          entityId: a.activity_entity_id,
          timestamp: a.activity_created_at,
          user: {
            username: a.user_username,
            displayName: a.user_display_name
          }
        }))
      }
    };
  }
}

// Register IPC handler
const dashboardHandler = new DashboardHandler();

ipcMain.handle(
  "dashboard",
  withErrorHandling(
    // @ts-ignore
    dashboardHandler.handleRequest.bind(dashboardHandler),
    "IPC:dashboard"
  )
);

module.exports = { DashboardHandler, dashboardHandler };