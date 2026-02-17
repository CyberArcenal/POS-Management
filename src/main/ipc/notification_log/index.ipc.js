// src/main/ipc/notification/index.ipc.js
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../middlewares/errorHandler");
const { AppDataSource } = require("../../db/datasource");
const { AuditLog } = require("../../../entities/AuditLog");
const { NotificationLogService } = require("../../../services/NotificationLog");
const { logger } = require("../../../utils/logger");

class NotificationLogHandler {
  /**
   * @param {Object} deps
   * @param {NotificationLogService} [deps.service]
   * @param {typeof logger} [deps.logger]
   */
  constructor(deps = {}) {
    this.service = deps.service || new NotificationLogService();
    // @ts-ignore
    this.auditLogRepo = deps.auditLogRepo || AppDataSource.getRepository(AuditLog);
    this.logger = deps.logger || logger;
    // Map method names to their transaction requirement and handler function
    this.methodHandlers = {
      // Read operations – no transaction needed
      getAllNotifications: { tx: false, handler: this.service.getAllNotifications.bind(this.service) },
      getNotificationById: { tx: false, handler: this.service.getNotificationById.bind(this.service) },
      getNotificationsByRecipient: { tx: false, handler: this.service.getNotificationsByRecipient.bind(this.service) },
      searchNotifications: { tx: false, handler: this.service.searchNotifications.bind(this.service) },
      getNotificationStats: { tx: false, handler: this.service.getNotificationStats.bind(this.service) },

      // Write operations – require transaction
      retryFailedNotification: { tx: true, handler: this.service.retryFailedNotification.bind(this.service) },
      retryAllFailed: { tx: true, handler: this.service.retryAllFailed.bind(this.service) },
      resendNotification: { tx: true, handler: this.service.resendNotification.bind(this.service) },
      deleteNotification: { tx: true, handler: this.service.deleteNotification.bind(this.service) },
      updateNotificationStatus: { tx: true, handler: this.service.updateNotificationStatus.bind(this.service) },
    };
  }

  /**
   * Main entry point for IPC.
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {Object} payload
   * @param {string} payload.method
   * @param {Object} [payload.params]
   */
  async handleRequest(event, payload) {
    const { method, params = {} } = payload;
    // @ts-ignore
    this.logger.info(`NotificationLogHandler: ${method}`, { params });

    // @ts-ignore
    const handlerConfig = this.methodHandlers[method];
    if (!handlerConfig) {
      throw new Error(`Unknown method: ${method}`);
    }

    if (handlerConfig.tx) {
      // Run with transaction
      return await this.runInTransaction(handlerConfig.handler, params, event);
    } else {
      // Run without transaction
      return await handlerConfig.handler(params);
    }
  }

  /**
   * Execute a service method within a database transaction.
   * @param {Function} serviceMethod - The service method to call (expects (params, queryRunner) => Promise)
   * @param {Object} params
   * @param {Electron.IpcMainInvokeEvent} event
   * @returns {Promise<any>}
   */
  async runInTransaction(serviceMethod, params, event) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Call service method with queryRunner
      const result = await serviceMethod(params, queryRunner);

      if (result?.status) {
        await queryRunner.commitTransaction();
        // Log activity (non-critical, don't fail if it errors)
        // @ts-ignore
        await this.logActivity(event, method, `Notification ${method} executed`).catch(err => {
          this.logger.warn('Failed to log activity:', err);
        });
      } else {
        await queryRunner.rollbackTransaction();
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // Let the error handler middleware handle it
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Log an activity to AuditLog.
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {string} action
   * @param {string} description
   */
  async logActivity(event, action, description) {
    // Extract userId from event if available (assuming it's attached by auth middleware)
    // @ts-ignore
    const userId = event?.sender?.userId || null;
    if (!userId) return;

    const logEntry = this.auditLogRepo.create({
      user: userId,
      action,
      description,
      entity: "NotificationLog",
      timestamp: new Date(),
    });
    await this.auditLogRepo.save(logEntry);
  }
}

// Instantiate handler with default dependencies
const handler = new NotificationLogHandler();

// Register IPC handler with error handling middleware
ipcMain.handle(
  "notification",
  // @ts-ignore
  withErrorHandling(handler.handleRequest.bind(handler), "IPC:notification")
);

module.exports = { NotificationLogHandler, notificationHandler: handler };