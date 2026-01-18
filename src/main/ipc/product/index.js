// index.ipc.js - Unified Product Handler (Refactored)
//@ts-check
const { ipcMain } = require("electron");

// @ts-ignore
const systemUtils = require("../../../utils/system");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");

class ProductHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📦 READ-ONLY HANDLERS ONLY
    this.getAllProducts = this.importHandler("./get/all.ipc");
    this.findPage = this.importHandler("./find_page.ipc");
    this.getProductById = this.importHandler("./get/by_id.ipc");
    this.getProductsByCategory = this.importHandler("./get/by_category.ipc");
    this.getProductsBySupplier = this.importHandler("./get/by_supplier.ipc");
    this.getLowStockProducts = this.importHandler("./get/low_stock.ipc");
    this.getProductStats = this.importHandler("./get/stats.ipc");
    this.searchProducts = this.importHandler("./search.ipc");
    this.getProductHistory = this.importHandler("./get/history.ipc");
    this.getProductVariants = this.importHandler("./get/variants.ipc");
    this.getProductSalesReport = this.importHandler("./get/sales_report.ipc");
    this.checkProductAvailability = this.importHandler(
      "./check_availability.ipc",
    );
    this.validateProductSKU = this.importHandler("./validate_sku.ipc");
    this.getProductPriceHistory = this.importHandler("./get/price_history.ipc");
    this.getProductInventory = this.importHandler("./get/inventory.ipc");
    this.getProductsByBarcode = this.importHandler("./get/by_barcode.ipc");

    // 🛒 SALE-RELATED STOCK UPDATES ONLY (with transactions)
    this.updateProductStockForSale = this.importHandler(
      "./update_stock_for_sale.ipc.js",
    );
    this.adjustProductInventoryForReturn = this.importHandler(
      "./adjust_inventory_for_return.ipc.js",
    );
    this.syncProductsFromInventory = this.importHandler(
      "./sync_from_inventory.ipc.js",
    );
    this.updateInventoryStock = this.importHandler(
      "./update_inventory_stock.ipc.js",
    );

    this.checkInventoryConnection = this.importHandler(
      "./check_inventory_connection.ipc.js",
    );
    this.getInventorySyncStatus = this.importHandler(
      "./get_inventory_sync_status.ipc.js",
    );
    this.updateInventoryConfig = this.importHandler(
      "./update_inventory_config.ipc.js",
    );
    this.manageSyncData = this.importHandler("./manage_sync_data.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[ProductHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not found: ${path}`,
        data: null,
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
        logger.info(`ProductHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📦 READ-ONLY OPERATIONS
        case "getAllProducts":
          // @ts-ignore
          return await this.getAllProducts(enrichedParams.filters, userId);

        case "findPage":
          return await this.findPage(
            enrichedParams,
            userId,
            // @ts-ignore
            enrichedParams.page,
            // @ts-ignore
            enrichedParams.offset,
          );

        case "getProductById":
          // @ts-ignore
          return await this.getProductById(enrichedParams.id, userId);

        case "getProductsByCategory":
          return await this.getProductsByCategory(
            // @ts-ignore
            enrichedParams.category_id,

            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getProductsBySupplier":
          return await this.getProductsBySupplier(
            // @ts-ignore
            enrichedParams.supplier_id,

            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getLowStockProducts":
          return await this.getLowStockProducts(
            // @ts-ignore
            enrichedParams.threshold,
            userId,
          );

        case "getProductStats":
          // @ts-ignore
          return await this.getProductStats(enrichedParams.date_range, userId);

        case "searchProducts":
          // @ts-ignore
          return await this.searchProducts(enrichedParams.query, userId);

        case "getProductHistory":
          return await this.getProductHistory(
            // @ts-ignore
            enrichedParams.product_id,
            userId,
          );

        case "getProductVariants":
          return await this.getProductVariants(
            // @ts-ignore
            enrichedParams.product_id,
            userId,
          );

        case "getProductSalesReport":
          return await this.getProductSalesReport(
            // @ts-ignore
            enrichedParams.product_id,

            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "checkProductAvailability":
          return await this.checkProductAvailability(
            // @ts-ignore
            enrichedParams.product_id,

            // @ts-ignore
            enrichedParams.quantity,
            userId,
          );

        case "validateProductSKU":
          // @ts-ignore
          return await this.validateProductSKU(enrichedParams.sku, userId);

        case "getProductPriceHistory":
          return await this.getProductPriceHistory(
            // @ts-ignore
            enrichedParams.product_id,
            userId,
          );

        case "getProductInventory":
          // @ts-ignore
          return await this.getProductInventory(enrichedParams.filters, userId);

        case "getProductsByBarcode":
          return await this.getProductsByBarcode(
            // @ts-ignore
            enrichedParams.barcode,
            userId,
          );

        // 🛒 SALE-RELATED STOCK OPERATIONS
        case "updateProductStockForSale":
          return await this.handleWithTransaction(
            this.updateProductStockForSale,
            enrichedParams,
          );

        case "adjustProductInventoryForReturn":
          return await this.handleWithTransaction(
            this.adjustProductInventoryForReturn,
            enrichedParams,
          );

        case "syncProductsFromInventory":
          return await this.handleWithTransaction(
            this.syncProductsFromInventory,
            enrichedParams,
          );

        case "updateInventoryStock":
          return await this.handleWithTransaction(
            this.updateInventoryStock,
            enrichedParams,
          );

        case "checkInventoryConnection":
          return await this.checkInventoryConnection(enrichedParams);

        case "getInventorySyncStatus":
          return await this.getInventorySyncStatus(enrichedParams);

        case "updateInventoryConfig":
          return await this.updateInventoryConfig(enrichedParams);

        case "manageSyncData":
          return await this.manageSyncData(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("ProductHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("ProductHandler error:", error);
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

  /**
   * @param {any} user_id
   * @param {any} action
   * @param {any} description
   */
  async logActivity(user_id, action, description, qr = null) {
    try {
      let activityRepo;

      if (qr) {
        // @ts-ignore
        activityRepo = qr.manager.getRepository(UserActivity);
      } else {
        activityRepo = AppDataSource.getRepository(UserActivity);
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
      console.warn("Failed to log product activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log product activity:", error);
      }
    }
  }
}

// Register IPC handler
const productHandler = new ProductHandler();

ipcMain.handle(
  "product",
  withErrorHandling(
    // @ts-ignore
    productHandler.handleRequest.bind(productHandler),
    "IPC:product",
  ),
);

module.exports = { ProductHandler, productHandler };
