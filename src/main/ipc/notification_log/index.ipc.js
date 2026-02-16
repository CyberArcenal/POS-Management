// src/main/ipc/notification/index.ipc.js
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");
const { AppDataSource } = require("../../db/datasource");
const { AuditLog } = require("../../../entities/AuditLog");
const { NotificationLogService } = require("../../../services/NotificationLog");


const service = new NotificationLogService();

class NotificationLogHandler {
  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const { method, params = {} } = payload;
      // @ts-ignore
      logger?.info(`NotificationLogHandler: ${method}`, { params });

      // Routes without transaction
      switch (method) {
        // READ
        case "getAllNotifications":
          return await service.getAllNotifications(params);
        case "getNotificationById":
          return await service.getNotificationById(params);
        case "getNotificationsByRecipient":
          return await service.getNotificationsByRecipient(params);
        case "getNotificationsByBooking":
          return await service.getNotificationsByBooking(params);
        case "searchNotifications":
          return await service.searchNotifications(params);
        case "getNotificationStats":
          return await service.getNotificationStats(params);

        // WRITE (no transaction needed or can be standalone)
        case "retryFailedNotification":
        case "retryAllFailed":
        case "resendNotification":
        case "deleteNotification":
        case "updateNotificationStatus":
          return await this.runInTransaction(method, params);
      }
    } catch (error) {
      // @ts-ignore
      logger?.error("NotificationLogHandler error:", error);
      // @ts-ignore
      return { status: false, message: error.message, data: null };
    }
  }

  // @ts-ignore
  async runInTransaction(method, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let result;
      switch (method) {
        case "retryFailedNotification":
          // @ts-ignore
          result = await service.retryFailedNotification(params, queryRunner);
          break;
        case "retryAllFailed":
          // @ts-ignore
          result = await service.retryAllFailed(params, queryRunner);
          break;
        case "resendNotification":
          // @ts-ignore
          result = await service.resendNotification(params, queryRunner);
          break;
        case "deleteNotification":
          // @ts-ignore
          result = await service.deleteNotification(params, queryRunner);
          break;
        case "updateNotificationStatus":
          // @ts-ignore
          result = await service.updateNotificationStatus(params, queryRunner);
          break;
      }

      // @ts-ignore
      if (result.status) {
        await queryRunner.commitTransaction();
        await this.logActivity(
          params.userId,
          method,
          `Notification ${method} executed`,
          // @ts-ignore
          null,
        );
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

  // @ts-ignore
  async logActivity(userId, action, description) {
    const { saveDb } = require("../../../utils/dbUtils/dbActions");
    try {
      if (!userId) return;
      const repo = AppDataSource.getRepository(AuditLog);
      // @ts-ignore
      const activity = repo.create({
        user: userId,
        action,
        description,
        entity: "NotificationLog",
        timestamp: new Date(),
      });
      await saveDb(repo, activity)
    } catch (error) {
      // @ts-ignore
      logger?.warn("Failed to log activity:", error);
    }
  }
}

const handler = new NotificationLogHandler();
ipcMain.handle(
  "notification",
  withErrorHandling(handler.handleRequest.bind(handler), "IPC:notification"),
);

module.exports = { NotificationLogHandler, notificationHandler: handler };
