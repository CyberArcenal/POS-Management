// src/main/ipc/notification/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const notificationService = require("../../../services/NotificationService");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class NotificationHandler {
  constructor() {
    // No need to import separate files – we handle all methods in the switch
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger.info(`NotificationHandler: ${method}`, { params });

      // All methods are assumed to require a userId (extract from auth/session)
      // For simplicity, we require params.userId to be passed from renderer.
      // In a real app, you'd get the current user from the session.
      const userId = params.userId;
      if (!userId && method !== "create") {
        // create may be called internally only, so it's fine to not enforce here
        return {
          status: false,
          message: "Missing userId in request",
          data: null,
        };
      }

      switch (method) {
        // 📨 CREATE – should only be used internally, but we keep it for completeness
        case "create":
          return await this.create(params);

        // 📋 READ OPERATIONS
        case "getAll":
          return await this.getAll(userId, params);

        case "getById":
          return await this.getById(userId, params.id);

        case "getUnreadCount":
          return await this.getUnreadCount(userId);

        case "getStats":
          return await this.getStats(userId);

        // ✏️ UPDATE OPERATIONS
        case "markAsRead":
          return await this.markAsRead(userId, params.id, params.isRead);

        case "markAllAsRead":
          return await this.markAllAsRead(userId);

        // 🗑 DELETE
        case "delete":
          return await this.delete(userId, params.id);

        default:
          return {
            status: false,
            message: `Unknown notification method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      logger.error("NotificationHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // --- Handlers (each calls the service) ---

  async create(params) {
    const { userId, title, message, type, metadata, user = "system" } = params;
    if (!userId || !title || !message) {
      throw new Error("Missing required fields: userId, title, message");
    }
    const result = await notificationService.create(
      { userId, title, message, type, metadata },
      user
    );
    return { status: true, data: result };
  }

  async getAll(userId, params) {
    const { isRead, limit, offset, sortBy, sortOrder } = params;
    const result = await notificationService.findAll(userId, {
      isRead,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
    return { status: true, data: result };
  }

  async getById(userId, id) {
    const result = await notificationService.findById(id, userId);
    return { status: true, data: result };
  }

  async getUnreadCount(userId) {
    const count = await notificationService.getUnreadCount(userId);
    return { status: true, data: { unreadCount: count } };
  }

  async getStats(userId) {
    const stats = await notificationService.getStats(userId);
    return { status: true, data: stats };
  }

  async markAsRead(userId, id, isRead = true) {
    const result = await notificationService.markAsRead(id, isRead, userId, "system");
    return { status: true, data: result };
  }

  async markAllAsRead(userId) {
    const count = await notificationService.markAllAsRead(userId, "system");
    return { status: true, data: { updatedCount: count } };
  }

  async delete(userId, id) {
    const result = await notificationService.delete(id, userId, "system");
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