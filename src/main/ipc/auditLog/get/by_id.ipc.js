// src/main/ipc/auditLog/get/by_id.ipc.js
const auditLogService = require("../../../../services/AuditLog");

/**
 * Get a single audit log by its ID
 * @param {Object} params - { id }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { id } = params;

    if (!id) {
      return {
        status: false,
        message: "Missing required parameter: id",
        data: null,
      };
    }

    const log = await auditLogService.findById(parseInt(id));

    return {
      status: true,
      message: "Audit log retrieved successfully",
      data: log,
    };
  } catch (error) {
    console.error("Error in getAuditLogById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve audit log",
      data: null,
    };
  }
};