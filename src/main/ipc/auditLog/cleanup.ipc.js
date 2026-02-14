// src/main/ipc/auditLog/cleanup.ipc.js


const auditLogService = require("../../../services/AuditLog");

/**
 * Delete audit logs older than a specified date
 * @param {Object} params - { olderThan: ISO date string, user?: string }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { olderThan, user = "system" } = params;

    if (!olderThan) {
      return {
        status: false,
        message: "Missing required parameter: olderThan (ISO date string)",
        data: null,
      };
    }

    const date = new Date(olderThan);
    if (isNaN(date.getTime())) {
      return {
        status: false,
        message: "Invalid date format for olderThan",
        data: null,
      };
    }

    const deletedCount = await auditLogService.deleteOlderThan(date, user);

    return {
      status: true,
      message: `Deleted ${deletedCount} audit logs older than ${olderThan}`,
      data: { deletedCount },
    };
  } catch (error) {
    console.error("Error in cleanupOldLogs:", error);
    return {
      status: false,
      message: error.message || "Failed to cleanup old audit logs",
      data: null,
    };
  }
};