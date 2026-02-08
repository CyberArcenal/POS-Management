// index.ipc.js - Streamlined Product Handler WITH CRUD
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class ProductHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // ✅ CRUD OPERATIONS (ESSENTIAL)
    this.createProduct = this.importHandler("./create.ipc");
    this.updateProduct = this.importHandler("./update.ipc");
    this.deleteProduct = this.importHandler("./delete.ipc");
    this.getProductById = this.importHandler("./get/by_id.ipc");
    
    // ✅ BULK OPERATIONS
    this.bulkUpdateProducts = this.importHandler("./bulk_update.ipc");
    
    // ✅ READ-ONLY HANDLERS
    this.findPage = this.importHandler("./find_page.ipc");
    this.searchProducts = this.importHandler("./search.ipc");
    this.getLowStockProducts = this.importHandler("./get/low_stock.ipc");
    
    // ✅ POS-SPECIFIC (Barcode/Quick Search)
    this.getProductsByBarcode = this.importHandler("./get/by_barcode.ipc");
    this.validateProductSKU = this.importHandler("./validate_sku.ipc");
    
    // ✅ INVENTORY MANAGEMENT
    this.updateProductStock = this.importHandler("./update_stock.ipc");
    this.adjustProductInventory = this.importHandler("./adjust_inventory.ipc");
    
    // ✅ PRICE MANAGEMENT
    this.updateProductPrice = this.importHandler("./update_price.ipc");
    this.bulkUpdatePrices = this.importHandler("./bulk_update_prices.ipc");
    
    // ✅ IMPORT/EXPORT
    this.importProducts = this.importHandler("./import.ipc");
    this.exportProducts = this.importHandler("./export.ipc");
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

      if (logger) {
        // @ts-ignore
        logger.info(`ProductHandler: ${method}`, { 
          method, 
          userId,
          hasParams: !!Object.keys(params).length 
        });
      }

      // ✅ CRUD & ESSENTIAL METHODS
      switch (method) {
        // 📦 CRUD OPERATIONS
        case "createProduct":
          return await this.handleWithTransaction(this.createProduct, enrichedParams);
        
        case "updateProduct":
          return await this.handleWithTransaction(this.updateProduct, enrichedParams);
        
        case "deleteProduct":
          return await this.handleWithTransaction(this.deleteProduct, enrichedParams);
        
        case "getProductById":
          // @ts-ignore
          return await this.getProductById(enrichedParams.id, userId);

        // 📋 BULK OPERATIONS
        case "bulkUpdateProducts":
          return await this.handleWithTransaction(this.bulkUpdateProducts, enrichedParams);

        // 🔍 READ-ONLY (POS Frontend)
        case "findPage":
          return await this.findPage(enrichedParams, userId);
        
        case "searchProducts":
          // @ts-ignore
          return await this.searchProducts(enrichedParams.query, userId);
        
        case "getLowStockProducts":
          // @ts-ignore
          return await this.getLowStockProducts(enrichedParams.threshold, userId);
        
        case "getProductsByBarcode":
          // @ts-ignore
          return await this.getProductsByBarcode(enrichedParams.barcode, userId);
        
        case "validateProductSKU":
          // @ts-ignore
          return await this.validateProductSKU(enrichedParams.sku, userId);

        // 📊 INVENTORY MANAGEMENT
        case "updateProductStock":
          return await this.handleWithTransaction(this.updateProductStock, enrichedParams);
        
        case "adjustProductInventory":
          return await this.handleWithTransaction(this.adjustProductInventory, enrichedParams);

        // 💰 PRICE MANAGEMENT
        case "updateProductPrice":
          return await this.handleWithTransaction(this.updateProductPrice, enrichedParams);
        
        case "bulkUpdatePrices":
          return await this.handleWithTransaction(this.bulkUpdatePrices, enrichedParams);

        // 📥 IMPORT/EXPORT
        case "importProducts":
          return await this.handleWithTransaction(this.importProducts, enrichedParams);
        
        case "exportProducts":
          return await this.exportProducts(enrichedParams);

        default:
          return {
            status: false,
            message: `Method '${method}' not available`,
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