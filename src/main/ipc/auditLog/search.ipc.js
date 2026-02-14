// src/main/ipc/auditLog/search.ipc.js
const auditLogService = require("../../../services/AuditLog");

/**
 * Search audit logs with flexible criteria
 * @param {Object} params - { entity, entityId, action, userId, startDate, endDate, page, limit }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { entity, entityId, action, userId, startDate, endDate, page, limit } = params;

    const filters = {
      ...(entity && { entity }),
      ...(entityId && { entityId: String(entityId) }),
      ...(action && { action }),
      ...(userId && { userId: parseInt(userId) }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    if (page && limit) {
      filters.page = parseInt(page);
      filters.limit = parseInt(limit);
    }

    const logs = await auditLogService.findAll(filters);

    return {
      status: true,
      message: "Search completed successfully",
      data: logs,
    };
  } catch (error) {
    console.error("Error in searchAuditLogs:", error);
    return {
      status: false,
      message: error.message || "Failed to search audit logs",
      data: null,
    };
  }
};