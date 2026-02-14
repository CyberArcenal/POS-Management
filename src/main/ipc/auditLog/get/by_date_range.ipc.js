// src/main/ipc/auditLog/get/by_date_range.ipc.js
const auditLogService = require("../../../../services/AuditLog");

/**
 * Get audit logs within a specific date range
 * @param {Object} params - { startDate, endDate, page, limit }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { startDate, endDate, page, limit } = params;

    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Missing required parameters: startDate and endDate",
        data: null,
      };
    }

    const filters = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    if (page && limit) {
      filters.page = parseInt(page);
      filters.limit = parseInt(limit);
    }

    const logs = await auditLogService.findAll(filters);

    return {
      status: true,
      message: "Audit logs for date range retrieved successfully",
      data: logs,
    };
  } catch (error) {
    console.error("Error in getAuditLogsByDateRange:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve audit logs for date range",
      data: null,
    };
  }
};