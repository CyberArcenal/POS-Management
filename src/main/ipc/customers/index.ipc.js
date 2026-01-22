// customers/index.ipc.js - Unified Customer Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class CustomerHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📦 CUSTOMER CRUD OPERATIONS
    this.createCustomer = this.importHandler("./create.ipc");
    this.updateCustomer = this.importHandler("./update.ipc");
    this.deleteCustomer = this.importHandler("./delete.ipc");
    this.activateCustomer = this.importHandler("./activate.ipc");
    this.deactivateCustomer = this.importHandler("./deactivate.ipc");
    
    // 📋 READ-ONLY HANDLERS
    this.getAllCustomers = this.importHandler("./get/all.ipc");
    this.findPage = this.importHandler("./find_page.ipc");
    this.getCustomerById = this.importHandler("./get/by_id.ipc");
    this.getCustomerByCode = this.importHandler("./get/by_code.ipc");
    this.getCustomersByType = this.importHandler("./get/by_type.ipc");
    this.getCustomersByStatus = this.importHandler("./get/by_status.ipc");
    this.getCustomersByGroup = this.importHandler("./get/by_group.ipc");
    this.searchCustomers = this.importHandler("./search.ipc");
    
    // 🔄 CUSTOMER RELATIONSHIPS
    this.addContact = this.importHandler("./contacts/add.ipc");
    this.updateContact = this.importHandler("./contacts/update.ipc");
    this.deleteContact = this.importHandler("./contacts/delete.ipc");
    this.getCustomerContacts = this.importHandler("./contacts/get_all.ipc");
    
    // 💰 FINANCIAL OPERATIONS
    this.updateCustomerBalance = this.importHandler("./financial/update_balance.ipc");
    this.addTransaction = this.importHandler("./financial/add_transaction.ipc");
    this.getCustomerTransactions = this.importHandler("./financial/get_transactions.ipc");
    this.getCustomerBalance = this.importHandler("./financial/get_balance.ipc");
    this.getCustomerStatement = this.importHandler("./financial/get_statement.ipc");
    
    // 📊 ANALYTICS & REPORTS
    this.getCustomerStats = this.importHandler("./analytics/stats.ipc");
    this.getTopCustomers = this.importHandler("./analytics/top_customers.ipc");
    this.getCustomerLifetimeValue = this.importHandler("./analytics/lifetime_value.ipc");
    this.getCustomerPurchaseHistory = this.importHandler("./analytics/purchase_history.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[CustomerHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`CustomerHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📦 CUSTOMER CRUD OPERATIONS
        case "createCustomer":
          return await this.handleWithTransaction(this.createCustomer, enrichedParams);
        
        case "updateCustomer":
          return await this.handleWithTransaction(this.updateCustomer, enrichedParams);
        
        case "deleteCustomer":
          return await this.handleWithTransaction(this.deleteCustomer, enrichedParams);
        
        case "activateCustomer":
          return await this.handleWithTransaction(this.activateCustomer, enrichedParams);
        
        case "deactivateCustomer":
          return await this.handleWithTransaction(this.deactivateCustomer, enrichedParams);

        // 📋 READ-ONLY OPERATIONS
        case "getAllCustomers":
          // @ts-ignore
          return await this.getAllCustomers(enrichedParams.filters, userId);
        
        case "findPage":
          return await this.findPage(
            enrichedParams,
            userId,
            // @ts-ignore
            enrichedParams.page,
            // @ts-ignore
            enrichedParams.pageSize
          );
        
        case "getCustomerById":
          // @ts-ignore
          return await this.getCustomerById(enrichedParams.id, userId);
        
        case "getCustomerByCode":
          // @ts-ignore
          return await this.getCustomerByCode(enrichedParams.customer_code, userId);
        
        case "getCustomersByType":
          return await this.getCustomersByType(
            // @ts-ignore
            enrichedParams.customer_type,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getCustomersByStatus":
          return await this.getCustomersByStatus(
            // @ts-ignore
            enrichedParams.status,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getCustomersByGroup":
          return await this.getCustomersByGroup(
            // @ts-ignore
            enrichedParams.customer_group,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "searchCustomers":
          return await this.searchCustomers(
            // @ts-ignore
            enrichedParams.query,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        // 🔄 CUSTOMER RELATIONSHIPS
        case "addContact":
          return await this.handleWithTransaction(this.addContact, enrichedParams);
        
        case "updateContact":
          return await this.handleWithTransaction(this.updateContact, enrichedParams);
        
        case "deleteContact":
          return await this.handleWithTransaction(this.deleteContact, enrichedParams);
        
        case "getCustomerContacts":
          // @ts-ignore
          return await this.getCustomerContacts(enrichedParams.customer_id, userId);

        // 💰 FINANCIAL OPERATIONS
        case "updateCustomerBalance":
          return await this.handleWithTransaction(this.updateCustomerBalance, enrichedParams);
        
        case "addTransaction":
          return await this.handleWithTransaction(this.addTransaction, enrichedParams);
        
        case "getCustomerTransactions":
          return await this.getCustomerTransactions(
            // @ts-ignore
            enrichedParams.customer_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getCustomerBalance":
          // @ts-ignore
          return await this.getCustomerBalance(enrichedParams.customer_id, userId);
        
        case "getCustomerStatement":
          return await this.getCustomerStatement(
            // @ts-ignore
            enrichedParams.customer_id,
            // @ts-ignore
            enrichedParams.start_date,
            // @ts-ignore
            enrichedParams.end_date,
            userId
          );

        // 📊 ANALYTICS & REPORTS
        case "getCustomerStats":
          return await this.getCustomerStats(
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getTopCustomers":
          return await this.getTopCustomers(
            // @ts-ignore
            enrichedParams.limit,
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getCustomerLifetimeValue":
          // @ts-ignore
          return await this.getCustomerLifetimeValue(enrichedParams.customer_id, userId);
        
        case "getCustomerPurchaseHistory":
          return await this.getCustomerPurchaseHistory(
            // @ts-ignore
            enrichedParams.customer_id,
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
      console.error("CustomerHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("CustomerHandler error:", error);
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
     * @param {{_userId: any;}} params
     * @param {(arg0: { _userId: any; }, arg1: any) => any} handler
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
   * Log customer activity
   * @param {any} user_id
   * @param {any} action
   * @param {any} description
   */
  async logActivity(user_id, action, description, qr = null) {
    try {
      let activityRepo;

      if (qr) {
        // @ts-ignore
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
      console.warn("Failed to log customer activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log customer activity:", error);
      }
    }
  }
}

// Register IPC handler
const customerHandler = new CustomerHandler();

ipcMain.handle(
  "customer",
  withErrorHandling(
    // @ts-ignore
    customerHandler.handleRequest.bind(customerHandler),
    "IPC:customer"
  )
);

module.exports = { CustomerHandler, customerHandler };