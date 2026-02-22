// src/main/ipc/notification/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const notificationService = require("../../../services/NotificationService");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class NotificationHandler {
  constructor() {
    // No need to import separate files – we handle all methods in the switch
  }

  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // @ts-ignore
      logger.info(`NotificationHandler: ${method}`, { params });

      // All methods are assumed to require a  (extract from auth/session)
      // For simplicity, we require params. to be passed from renderer.

      switch (method) {
        // 📨 CREATE – should only be used internally, but we keep it for completeness
        case "create":
          return await this.create(params);

        // 📋 READ OPERATIONS
        case "getAll":
          return await this.getAll(params);

        case "getById":
          return await this.getById(params.id);

        case "getUnreadCount":
          return await this.getUnreadCount();

        case "getStats":
          return await this.getStats();

        // ✏️ UPDATE OPERATIONS
        case "markAsRead":
          return await this.markAsRead(params.id, params.isRead);

        case "markAllAsRead":
          return await this.markAllAsRead();

        // 🗑 DELETE
        case "delete":
          return await this.delete(params.id);

        default:
          return {
            status: false,
            message: `Unknown notification method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("NotificationHandler error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // --- Handlers (each calls the service) ---

  // @ts-ignore
  async create(params) {
    const { title, message, type, metadata, user = "system" } = params;
    // @ts-ignore
    if (!title || !message) {
      throw new Error("Missing required fields: title, message");
    }
    const result = await notificationService.create(
      { title, message, type, metadata },
      user
    );
    return { status: true, data: result };
  }

  // @ts-ignore
  async getAll(params) {
    const { isRead, limit, offset, sortBy, sortOrder } = params;
    const result = await notificationService.findAll({
      isRead,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
    return { status: true, data: result };
  }

  // @ts-ignore
  async getById(id) {
    const result = await notificationService.findById(id);
    return { status: true, data: result };
  }

  async getUnreadCount() {
    const count = await notificationService.getUnreadCount();
    return { status: true, data: { unreadCount: count } };
  }

  async getStats() {
    const stats = await notificationService.getStats();
    return { status: true, data: stats };
  }

  // @ts-ignore
  async markAsRead(id, isRead = true) {
    const result = await notificationService.markAsRead(id, isRead, "system");
    return { status: true, data: result };
  }

  async markAllAsRead() {
    const count = await notificationService.markAllAsRead("system");
    return { status: true, data: { updatedCount: count } };
  }

  // @ts-ignore
  async delete(id) {
    const result = await notificationService.delete(id, "system");
    return { status: true, data: result };
  }
}

// Register IPC handler
const notificationHandler = new NotificationHandler();
ipcMain.handle(
  "notification",
  withErrorHandling(
    notificationHandler.handleRequest.bind(notificationHandler),
    "IPC:notification"
  )
);

module.exports = { NotificationHandler, notificationHandler };