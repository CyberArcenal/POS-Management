// user/index.js - Unified User Handler
//@ts-check
const { ipcMain } = require("electron");
// @ts-ignore
const systemUtils = require("../../../utils/system");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");

class UserHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 👥 READ-ONLY HANDLERS ONLY
    this.getAllUsers = require("./get/all.ipc");
    this.findPage = require("./find_page.ipc");
    this.getUserById = require("./get/by_id.ipc");
    this.getUserByUsername = require("./get/by_username.ipc");
    this.getUsersByRole = require("./get/by_role.ipc");
    this.getActiveUsers = require("./get/active.ipc");
    this.getUserStats = require("./get/stats.ipc");
    this.searchUsers = require("./search.ipc");
    this.getUserActivityLogs = require("./get/activity_logs.ipc");
    this.getUserPermissions = require("./get/permissions.ipc");
    this.validateUserCredentials = require("./validate_credentials.ipc");
    this.checkUsernameAvailability = require("./check_username_availability.ipc");
    this.getUserSalesReport = require("./get/sales_report.ipc");
    this.getUserLoginHistory = require("./get/login_history.ipc");
    this.getUsersByDepartment = require("./get/by_department.ipc");
    this.getUserShiftInfo = require("./get/shift_info.ipc");
    
    // ✏️ USER MANAGEMENT OPERATIONS (with transactions)
    this.createUser = require("./create/user.ipc.js");
    this.updateUser = require("./update/user.ipc.js");
    this.deleteUser = require("./delete/user.ipc.js");
    this.updateUserPassword = require("./update/password.ipc.js");
    this.updateUserPermissions = require("./update/permissions.ipc.js");
    this.updateUserRole = require("./update/role.ipc.js");
    this.toggleUserStatus = require("./toggle_status.ipc.js");
    this.resetUserPassword = require("./reset_password.ipc.js");
    this.logUserLogin = require("./log_login.ipc.js");
    this.logUserLogout = require("./log_logout.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[UserHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`UserHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 👥 READ-ONLY OPERATIONS
        case "getAllUsers":
          // @ts-ignore
          return await this.getAllUsers(enrichedParams.filters, userId);
        
        case "findPage":
          // @ts-ignore
          return await this.findPage(enrichedParams, userId, enrichedParams.page, enrichedParams.offset);
        
        case "getUserById":
          // @ts-ignore
          return await this.getUserById(enrichedParams.id, userId);
        
        case "getUserByUsername":
          // @ts-ignore
          return await this.getUserByUsername(enrichedParams.username, userId);
        
        case "getUsersByRole":
          return await this.getUsersByRole(
            // @ts-ignore
            enrichedParams.role,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getActiveUsers":
          // @ts-ignore
          return await this.getActiveUsers(enrichedParams.include_inactive, userId);
        
        case "getUserStats":
          // @ts-ignore
          return await this.getUserStats(enrichedParams.date_range, userId);
        
        case "searchUsers":
          // @ts-ignore
          return await this.searchUsers(enrichedParams.query, userId);
        
        case "getUserActivityLogs":
          // @ts-ignore
          return await this.getUserActivityLogs(enrichedParams.user_id, userId);
        
        case "getUserPermissions":
          // @ts-ignore
          return await this.getUserPermissions(enrichedParams.user_id, userId);
        
        case "validateUserCredentials":
          return await this.validateUserCredentials(
            // @ts-ignore
            enrichedParams.username,
            // @ts-ignore
            enrichedParams.password,
            userId
          );
        
        case "checkUsernameAvailability":
          // @ts-ignore
          return await this.checkUsernameAvailability(enrichedParams.username, userId);
        
        case "getUserSalesReport":
          return await this.getUserSalesReport(
            // @ts-ignore
            enrichedParams.user_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId
          );
        
        case "getUserLoginHistory":
          // @ts-ignore
          return await this.getUserLoginHistory(enrichedParams.user_id, userId);
        
        case "getUsersByDepartment":
          // @ts-ignore
          return await this.getUsersByDepartment(enrichedParams.department, userId);
        
        case "getUserShiftInfo":
          // @ts-ignore
          return await this.getUserShiftInfo(enrichedParams.user_id, userId);

        // ✏️ USER MANAGEMENT OPERATIONS
        case "createUser":
          return await this.handleWithTransaction(this.createUser, enrichedParams);
        
        case "updateUser":
          return await this.handleWithTransaction(this.updateUser, enrichedParams);
        
        case "deleteUser":
          return await this.handleWithTransaction(this.deleteUser, enrichedParams);
        
        case "updateUserPassword":
          return await this.handleWithTransaction(this.updateUserPassword, enrichedParams);
        
        case "updateUserPermissions":
          return await this.handleWithTransaction(this.updateUserPermissions, enrichedParams);
        
        case "updateUserRole":
          return await this.handleWithTransaction(this.updateUserRole, enrichedParams);
        
        case "toggleUserStatus":
          return await this.handleWithTransaction(this.toggleUserStatus, enrichedParams);
        
        case "resetUserPassword":
          return await this.handleWithTransaction(this.resetUserPassword, enrichedParams);
        
        case "logUserLogin":
          return await this.logUserLogin(enrichedParams);
        
        case "logUserLogout":
          return await this.logUserLogout(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("UserHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("UserHandler error:", error);
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
   * @param {(arg0: any, arg1: any) => any} handler
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
      console.warn("Failed to log user activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log user activity:", error);
      }
    }
  }
}

// Register IPC handler
const userHandler = new UserHandler();

ipcMain.handle(
  "user",
  withErrorHandling(
    // @ts-ignore
    userHandler.handleRequest.bind(userHandler),
    "IPC:user"
  )
);

module.exports = { UserHandler, userHandler };