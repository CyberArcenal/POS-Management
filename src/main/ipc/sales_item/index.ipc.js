// sales_items/index.ipc.js - Unified Sale Item Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class SaleItemHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📦 CORE OPERATIONS
    this.createSaleItem = this.importHandler("./create.ipc");
    this.updateSaleItem = this.importHandler("./update.ipc");
    this.deleteSaleItem = this.importHandler("./delete.ipc");
    
    // 📋 READ-ONLY HANDLERS
    this.getSaleItemById = this.importHandler("./get/by_id.ipc");
    this.getSaleItemsBySaleId = this.importHandler("./get/by_sale_id.ipc");
    this.getSaleItemsByProductId = this.importHandler("./get/by_product_id.ipc");
    this.getSaleItemsByDateRange = this.importHandler("./get/by_date_range.ipc");
    
    // 🔄 RETURN & ADJUSTMENT
    this.returnSaleItem = this.importHandler("./return.ipc");
    this.adjustSaleItemQuantity = this.importHandler("./adjust_quantity.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[SaleItemHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`SaleItemHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📦 CORE OPERATIONS
        case "createSaleItem":
          return await this.handleWithTransaction(this.createSaleItem, enrichedParams);
        
        case "updateSaleItem":
          return await this.handleWithTransaction(this.updateSaleItem, enrichedParams);
        
        case "deleteSaleItem":
          return await this.handleWithTransaction(this.deleteSaleItem, enrichedParams);

        // 📋 READ-ONLY OPERATIONS
        case "getSaleItemById":
          // @ts-ignore
          return await this.getSaleItemById(enrichedParams.id, userId);
        
        case "getSaleItemsBySaleId":
          // @ts-ignore
          return await this.getSaleItemsBySaleId(enrichedParams.sale_id, userId);
        
        case "getSaleItemsByProductId":
          return await this.getSaleItemsByProductId(
            // @ts-ignore
            enrichedParams.product_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getSaleItemsByDateRange":
          return await this.getSaleItemsByDateRange(
            // @ts-ignore
            enrichedParams.start_date,
            // @ts-ignore
            enrichedParams.end_date,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        // 🔄 RETURN & ADJUSTMENT
        case "returnSaleItem":
          return await this.handleWithTransaction(this.returnSaleItem, enrichedParams);
        
        case "adjustSaleItemQuantity":
          return await this.handleWithTransaction(this.adjustSaleItemQuantity, enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("SaleItemHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("SaleItemHandler error:", error);
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
const saleItemHandler = new SaleItemHandler();

ipcMain.handle(
  "sale-item",
  withErrorHandling(
    // @ts-ignore
    saleItemHandler.handleRequest.bind(saleItemHandler),
    "IPC:sale_item"
  )
);

module.exports = { SaleItemHandler, saleItemHandler };