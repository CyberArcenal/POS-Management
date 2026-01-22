// sales/index.ipc.js - Unified Sale Handler
//@ts-check
const { ipcMain } = require("electron");
// @ts-ignore
// @ts-ignore
const systemUtils = require("../../../utils/system");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const WarehouseManager = require("../../../services/inventory_sync/warehouseManager");

class SaleHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📦 SALE CRUD OPERATIONS
    this.createSale = this.importHandler("./create.ipc");
    this.updateSale = this.importHandler("./update.ipc");
    this.cancelSale = this.importHandler("./cancel.ipc");
    this.processRefund = this.importHandler("./refund.ipc");
    
    // 📋 READ-ONLY HANDLERS
    this.getAllSales = this.importHandler("./get/all.ipc");
    this.findPage = this.importHandler("./find_page.ipc");
    this.getSaleById = this.importHandler("./get/by_id.ipc");
    this.getSalesByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getSalesByUser = this.importHandler("./get/by_user.ipc");
    this.getSalesByStatus = this.importHandler("./get/by_status.ipc");
    this.getSalesByProduct = this.importHandler("./get/by_product.ipc");
    this.getDailySalesReport = this.importHandler("./get/daily_report.ipc");
    this.getMonthlySalesReport = this.importHandler("./get/monthly_report.ipc");
    this.getSalesStats = this.importHandler("./get/stats.ipc");
    this.getTopSellingProducts = this.importHandler("./get/top_products.ipc");
    this.getRevenueAnalytics = this.importHandler("./get/revenue_analytics.ipc");
    this.searchSales = this.importHandler("./search.ipc");
    
    // 🔄 INVENTORY INTEGRATION
    this.syncSaleWithInventory = this.importHandler("./sync_with_inventory.ipc");
    this.validateSaleStock = this.importHandler("./validate_stock.ipc");
    
    // 🧾 RECEIPT & INVOICE
    this.generateReceipt = this.importHandler("./generate_receipt.ipc");
    this.reprintReceipt = this.importHandler("./reprint_receipt.ipc");
    this.generateInvoice = this.importHandler("./generate_invoice.ipc");
    
    // 💰 PAYMENT PROCESSING
    this.processPayment = this.importHandler("./process_payment.ipc");
    this.applyDiscount = this.importHandler("./apply_discount.ipc");
    this.addTax = this.importHandler("./add_tax.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[SaleHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`SaleHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📦 SALE CRUD OPERATIONS
        case "createSale":
          return await this.handleWithTransaction(this.createSale, enrichedParams);
        
        case "updateSale":
          return await this.handleWithTransaction(this.updateSale, enrichedParams);
        
        case "cancelSale":
          return await this.handleWithTransaction(this.cancelSale, enrichedParams);
        
        case "processRefund":
          return await this.handleWithTransaction(this.processRefund, enrichedParams);

        // 📋 READ-ONLY OPERATIONS
        case "getAllSales":
          // @ts-ignore
          return await this.getAllSales(enrichedParams.filters, userId);
        
        case "findPage":
          return await this.findPage(
            enrichedParams,
            userId,
            // @ts-ignore
            enrichedParams.page,
            // @ts-ignore
            enrichedParams.pageSize
          );
        
        case "getSaleById":
          // @ts-ignore
          return await this.getSaleById(enrichedParams.id, userId);
        
        case "getSalesByDateRange":
          return await this.getSalesByDateRange(
            // @ts-ignore
            enrichedParams.start_date,
            // @ts-ignore
            enrichedParams.end_date,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getSalesByUser":
          return await this.getSalesByUser(
            // @ts-ignore
            enrichedParams.user_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getSalesByStatus":
          return await this.getSalesByStatus(
            // @ts-ignore
            enrichedParams.status,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getSalesByProduct":
          return await this.getSalesByProduct(
            // @ts-ignore
            enrichedParams.product_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getDailySalesReport":
          return await this.getDailySalesReport(
            // @ts-ignore
            enrichedParams.date,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getMonthlySalesReport":
          return await this.getMonthlySalesReport(
            // @ts-ignore
            enrichedParams.year,
            // @ts-ignore
            enrichedParams.month,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getSalesStats":
          return await this.getSalesStats(
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTopSellingProducts":
          return await this.getTopSellingProducts(
            // @ts-ignore
            enrichedParams.limit,
            // @ts-ignore
            enrichedParams.date_range,
            userId
          );
        
        case "getRevenueAnalytics":
          return await this.getRevenueAnalytics(
            // @ts-ignore
            enrichedParams.period,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "searchSales":
          return await this.searchSales(
            // @ts-ignore
            enrichedParams.query,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getWarehouseSales":
          return await this.getWarehouseSales(enrichedParams);

        // 🔄 INVENTORY INTEGRATION
        case "syncSaleWithInventory":
          return await this.handleWithTransaction(this.syncSaleWithInventory, enrichedParams);
        
        case "validateSaleStock":
          // @ts-ignore
          return await this.validateSaleStock(enrichedParams.items, userId);

        // 🧾 RECEIPT & INVOICE
        case "generateReceipt":
          // @ts-ignore
          return await this.generateReceipt(enrichedParams.sale_id, userId);
        
        case "reprintReceipt":
          // @ts-ignore
          return await this.reprintReceipt(enrichedParams.receipt_number, userId);
        
        case "generateInvoice":
          // @ts-ignore
          return await this.generateInvoice(enrichedParams.sale_id, userId);

        // 💰 PAYMENT PROCESSING
        case "processPayment":
          return await this.handleWithTransaction(this.processPayment, enrichedParams);
        
        case "applyDiscount":
          return await this.handleWithTransaction(this.applyDiscount, enrichedParams);
        
        case "addTax":
          // @ts-ignore
          return await this.addTax(enrichedParams.sale_id, enrichedParams.tax_details, userId);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("SaleHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("SaleHandler error:", error);
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
      console.warn("Failed to log sale activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log sale activity:", error);
      }
    }
  }
  /**
   * Get sales for specific warehouse
   * @param {{ _userId?: any; warehouse_id?: any; start_date?: any; end_date?: any; page?: any; limit?: any; }} params
   */
  async getWarehouseSales(params) {
    try {
      const { 
        warehouse_id, 
        start_date, 
        end_date, 
        page = 1, 
        limit = 50 
      } = params;

      const saleRepo = AppDataSource.getRepository("Sale");
      const skip = (page - 1) * limit;

      const queryBuilder = saleRepo.createQueryBuilder("sale")
        .where("sale.warehouse_id = :warehouseId", { warehouseId: warehouse_id })
        .orderBy("sale.created_at", "DESC")
        .skip(skip)
        .take(limit)
        .leftJoinAndSelect("sale.items", "items");

      if (start_date) {
        queryBuilder.andWhere("sale.created_at >= :startDate", { startDate: start_date });
      }
      if (end_date) {
        queryBuilder.andWhere("sale.created_at <= :endDate", { endDate: end_date });
      }

      const [sales, total] = await queryBuilder.getManyAndCount();

      // Get summary
      const summary = await new WarehouseManager().getWarehouseSalesSummary(
        warehouse_id, 
        start_date, 
        end_date
      );

      return {
        status: true,
        data: {
          sales,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
          },
          summary
        }
      };
    } catch (error) {
      return {
        status: false,
        // @ts-ignore
        message: error.message,
        data: null
      };
    }
  }
}

// Register IPC handler
const saleHandler = new SaleHandler();

ipcMain.handle(
  "sale",
  withErrorHandling(
    // @ts-ignore
    saleHandler.handleRequest.bind(saleHandler),
    "IPC:sale"
  )
);

module.exports = { SaleHandler, saleHandler };