// audit_trail/index.ipc.js - Unified Audit Trail Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");

class AuditTrailHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAuditTrailById = this.importHandler("./get/by_id.ipc");
    this.getAuditTrailsByEntity = this.importHandler("./get/by_entity.ipc");
    this.getAuditTrailsByUser = this.importHandler("./get/by_user.ipc");
    this.getAuditTrailsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getAuditTrailsByAction = this.importHandler("./get/by_action.ipc");
    this.searchAuditTrails = this.importHandler("./search.ipc");
    
    // 📊 REPORTING & ANALYTICS
    this.getAuditStatistics = this.importHandler("./reports/statistics.ipc");
    this.getAuditActivityReport = this.importHandler("./reports/activity.ipc");
    this.getAuditComplianceReport = this.importHandler("./reports/compliance.ipc");
    
    // 🔒 SECURITY & MONITORING
    this.getSuspiciousActivities = this.importHandler("./monitoring/suspicious.ipc");
    this.getAuditSummary = this.importHandler("./monitoring/summary.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      // @ts-ignore
      console.warn(`[AuditTrailHandler] Failed to load handler: ${path}`, error.message);
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
        logger.info(`AuditTrailHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAuditTrailById":
          // @ts-ignore
          return await this.getAuditTrailById(enrichedParams.id, userId);
        
        case "getAuditTrailsByEntity":
          return await this.getAuditTrailsByEntity(
            // @ts-ignore
            enrichedParams.entity,
            // @ts-ignore
            enrichedParams.entity_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditTrailsByUser":
          return await this.getAuditTrailsByUser(
            // @ts-ignore
            enrichedParams.user_id,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditTrailsByDateRange":
          return await this.getAuditTrailsByDateRange(
            // @ts-ignore
            enrichedParams.start_date,
            // @ts-ignore
            enrichedParams.end_date,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditTrailsByAction":
          return await this.getAuditTrailsByAction(
            // @ts-ignore
            enrichedParams.action,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "searchAuditTrails":
          return await this.searchAuditTrails(
            // @ts-ignore
            enrichedParams.query,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        // 📊 REPORTING & ANALYTICS
        case "getAuditStatistics":
          return await this.getAuditStatistics(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditActivityReport":
          return await this.getAuditActivityReport(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditComplianceReport":
          return await this.getAuditComplianceReport(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        // 🔒 SECURITY & MONITORING
        case "getSuspiciousActivities":
          return await this.getSuspiciousActivities(
            // @ts-ignore
            enrichedParams.filters,
            userId
          );
        
        case "getAuditSummary":
          return await this.getAuditSummary(
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
      console.error("AuditTrailHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("AuditTrailHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }
}

// Register IPC handler
const auditTrailHandler = new AuditTrailHandler();

ipcMain.handle(
  "audit-trail",
  withErrorHandling(
    // @ts-ignore
    auditTrailHandler.handleRequest.bind(auditTrailHandler),
    "IPC:audit_trail"
  )
);

module.exports = { AuditTrailHandler, auditTrailHandler };