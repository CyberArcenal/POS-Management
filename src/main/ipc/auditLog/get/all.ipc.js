// src/main/ipc/auditLog/get/all.ipc.js
const auditLogService = require("../../../../services/AuditLog");

/**
 * Get all audit logs with optional filtering and pagination
 * @param {Object} params - { page, limit, entity, action, userId, startDate, endDate }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { page, limit, entity, action, userId, startDate, endDate } = params;

    // Build filters for findAll
    const filters = {
      ...(entity && { entity }),
      ...(action && { action }),
      ...(userId && { userId: parseInt(userId) }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    // Add pagination if both page and limit are provided
    if (page && limit) {
      filters.page = parseInt(page);
      filters.limit = parseInt(limit);
    }

    const logs = await auditLogService.findAll(filters);

    return {
      status: true,
      message: "Audit logs retrieved successfully",
      data: logs,
    };
  } catch (error) {
    console.error("Error in getAllAuditLogs:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve audit logs",
      data: null,
    };
  }
};