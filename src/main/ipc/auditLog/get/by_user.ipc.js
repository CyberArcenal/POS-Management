// src/main/ipc/auditLog/get/by_user.ipc.js
const auditLogService = require("../../../../services/AuditLog");

/**
 * Get audit logs for a specific user
 * @param {Object} params - { userId, page, limit, startDate, endDate }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { userId, page, limit, startDate, endDate } = params;

    if (!userId) {
      return {
        status: false,
        message: "Missing required parameter: userId",
        data: null,
      };
    }

    const filters = {
      userId: parseInt(userId),
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
      message: "Audit logs for user retrieved successfully",
      data: logs,
    };
  } catch (error) {
    console.error("Error in getAuditLogsByUser:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve audit logs for user",
      data: null,
    };
  }
};