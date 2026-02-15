// src/main/ipc/dashboard/index.ipc.js - Dashboard Management Handler
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class DashboardHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📊 DASHBOARD METHODS
    this.getSummary = this.importHandler("./get/summary.ipc");
    this.getSalesChart = this.importHandler("./get/sales_chart.ipc");
    this.getInventoryStatus = this.importHandler("./get/inventory_status.ipc");
    this.getRecentActivities = this.importHandler("./get/recent_activities.ipc");
    this.getTopProducts = this.importHandler("./get/top_products.ipc");
    this.getLowStockAlert = this.importHandler("./get/low_stock_alert.ipc");
    this.getCustomerStats = this.importHandler("./get/customer_stats.ipc");
  }

  // @ts-ignore
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      // @ts-ignore
      console.warn(
        `[DashboardHandler] Failed to load handler: ${path}`,
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const { method, params = {} } = payload;
      // @ts-ignore
      logger.info(`DashboardHandler: ${method}`, { params });

      switch (method) {
        case "getSummary":
          return await this.getSummary(params);
        case "getSalesChart":
          return await this.getSalesChart(params);
        case "getInventoryStatus":
          return await this.getInventoryStatus(params);
        case "getRecentActivities":
          return await this.getRecentActivities(params);
        case "getTopProducts":
          return await this.getTopProducts(params);
        case "getLowStockAlert":
          return await this.getLowStockAlert(params);
        case "getCustomerStats":
          return await this.getCustomerStats(params);
        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("DashboardHandler error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }
}

const dashboardHandler = new DashboardHandler();
ipcMain.handle(
  "dashboard",
  withErrorHandling(
    dashboardHandler.handleRequest.bind(dashboardHandler),
    "IPC:dashboard",
  ),
);

module.exports = { DashboardHandler, dashboardHandler };