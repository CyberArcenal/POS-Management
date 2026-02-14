// src/main/ipc/auditLog/get/by_entity.ipc.js
const auditLogService = require("../../../../services/AuditLog");

/**
 * Get audit logs for a specific entity (e.g., Employee, PayrollRecord)
 * @param {Object} params - { entity, entityId, page, limit, startDate, endDate }
 * @returns {Promise<{ status: boolean, message: string, data?: any }>}
 */
module.exports = async (params = {}) => {
  try {
    const { entity, entityId, page, limit, startDate, endDate } = params;

    if (!entity) {
      return {
        status: false,
        message: "Missing required parameter: entity",
        data: null,
      };
    }

    const filters = {
      entity,
      ...(entityId && { entityId: String(entityId) }),
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
      message: "Audit logs for entity retrieved successfully",
      data: logs,
    };
  } catch (error) {
    console.error("Error in getAuditLogsByEntity:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve audit logs for entity",
      data: null,
    };
  }
};