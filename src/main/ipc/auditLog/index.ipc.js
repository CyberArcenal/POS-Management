// src/main/ipc/auditLog/index.ipc.js - Audit Log Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class AuditLogHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS (karaniwang read-only ang audit logs)
    this.getAllAuditLogs = this.importHandler("./get/all.ipc");
    this.getAuditLogById = this.importHandler("./get/by_id.ipc");
    this.getAuditLogsByUser = this.importHandler("./get/by_user.ipc");
    this.getAuditLogsByEntity = this.importHandler("./get/by_entity.ipc");
    this.getAuditLogsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.searchAuditLogs = this.importHandler("./search.ipc");

    // ✏️ WRITE (optional: kung gusto mong mag-clear o mag-delete ng logs)
    this.deleteAuditLog = this.importHandler("./delete.ipc");
    this.cleanupOldLogs = this.importHandler("./cleanup.ipc");

    // 📄 REPORT
    this.exportAuditLogsToCSV = this.importHandler("./export_csv.ipc");
  }

  // @ts-ignore
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      // @ts-ignore
      console.warn(`[AuditLogHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const { method, params = {} } = payload;
      // @ts-ignore
      logger.info(`AuditLogHandler: ${method}`, { params });

      switch (method) {
        case "getAllAuditLogs":
          return await this.getAllAuditLogs(params);
        case "getAuditLogById":
          return await this.getAuditLogById(params);
        case "getAuditLogsByUser":
          return await this.getAuditLogsByUser(params);
        case "getAuditLogsByEntity":
          return await this.getAuditLogsByEntity(params);
        case "getAuditLogsByDateRange":
          return await this.getAuditLogsByDateRange(params);
        case "searchAuditLogs":
          return await this.searchAuditLogs(params);
        case "deleteAuditLog":
          return await this.deleteAuditLog(params);
        case "cleanupOldLogs":
          return await this.cleanupOldLogs(params);
        case "exportAuditLogsToCSV":
          return await this.exportAuditLogsToCSV(params);
        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("AuditLogHandler error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }
}

const auditLogHandler = new AuditLogHandler();
ipcMain.handle(
  "auditLog",
  withErrorHandling(auditLogHandler.handleRequest.bind(auditLogHandler), "IPC:auditLog")
);

module.exports = { AuditLogHandler, auditLogHandler };