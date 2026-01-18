// inventory_transactions/index.ipc.js - Unified Inventory Transaction Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class InventoryTransactionHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📦 TRANSACTION LOGGING
    this.createTransactionLog = this.importHandler("./create.ipc");
    this.createBulkTransactionLog = this.importHandler("./create_bulk.ipc");
    
    // 📋 READ-ONLY HANDLERS
    this.getTransactionLogById = this.importHandler("./get/by_id.ipc");
    this.getTransactionLogsByProduct = this.importHandler("./get/by_product.ipc");
    this.getTransactionLogsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getTransactionLogsByAction = this.importHandler("./get/by_action.ipc");
    this.getTransactionLogsByUser = this.importHandler("./get/by_user.ipc");
    this.searchTransactionLogs = this.importHandler("./search.ipc");
    
    // 📊 REPORTING & ANALYTICS
    this.getInventoryMovementReport = this.importHandler("./reports/movement.ipc");
    this.getStockAdjustmentSummary = this.importHandler("./reports/adjustments.ipc");
    this.getTransactionStatistics = this.importHandler("./reports/statistics.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[InventoryTransactionHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`InventoryTransactionHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📦 TRANSACTION LOGGING
        case "createTransactionLog":
          return await this.handleWithTransaction(this.createTransactionLog, enrichedParams);
        
        case "createBulkTransactionLog":
          return await this.handleWithTransaction(this.createBulkTransactionLog, enrichedParams);

        // 📋 READ-ONLY OPERATIONS
        case "getTransactionLogById":
          // @ts-ignore
          return await this.getTransactionLogById(enrichedParams.id, userId);
        
        case "getTransactionLogsByProduct":
          return await this.getTransactionLogsByProduct(
            // @ts-ignore
            enrichedParams.product_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTransactionLogsByDateRange":
          return await this.getTransactionLogsByDateRange(
            // @ts-ignore
            enrichedParams.start_date,
            // @ts-ignore
            enrichedParams.end_date,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTransactionLogsByAction":
          return await this.getTransactionLogsByAction(
            // @ts-ignore
            enrichedParams.action,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTransactionLogsByUser":
          return await this.getTransactionLogsByUser(
            // @ts-ignore
            enrichedParams.user_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "searchTransactionLogs":
          return await this.searchTransactionLogs(
            // @ts-ignore
            enrichedParams.query,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        // 📊 REPORTING & ANALYTICS
        case "getInventoryMovementReport":
          return await this.getInventoryMovementReport(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getStockAdjustmentSummary":
          return await this.getStockAdjustmentSummary(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTransactionStatistics":
          return await this.getTransactionStatistics(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("InventoryTransactionHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("InventoryTransactionHandler error:", error);
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
   * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
   * @param {{ _userId: any; }} params
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
}

// Register IPC handler
const inventoryTransactionHandler = new InventoryTransactionHandler();

ipcMain.handle(
  "inventory-transaction",
  withErrorHandling(
    // @ts-ignore
    inventoryTransactionHandler.handleRequest.bind(inventoryTransactionHandler),
    "IPC:inventory_transaction"
  )
);

module.exports = { InventoryTransactionHandler, inventoryTransactionHandler };