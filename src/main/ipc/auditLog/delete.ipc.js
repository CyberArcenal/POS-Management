// src/main/ipc/auditLog/delete.ipc.js
const auditLogService = require("../../../services/AuditLog");

/**
 * Delete a single audit log by ID (if permitted)
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

    // Use repository directly to delete
    const repo = await auditLogService.getRepository();
    const result = await repo.delete(id);

    if (result.affected === 0) {
      return {
        status: false,
        message: `Audit log with ID ${id} not found`,
        data: null,
      };
    }

    return {
      status: true,
      message: `Audit log with ID ${id} deleted successfully`,
      data: { id },
    };
  } catch (error) {
    console.error("Error in deleteAuditLog:", error);
    return {
      status: false,
      message: error.message || "Failed to delete audit log",
      data: null,
    };
  }
};