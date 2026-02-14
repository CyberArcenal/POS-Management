// src/main/ipc/auditLog/export_csv.ipc.js
const auditLogService = require("../../../services/AuditLog");
const { createObjectCsvStringifier } = require("csv-writer");

/**
 * Export audit logs to CSV format
 * @param {Object} params - { entity, entityId, action, userId, startDate, endDate }
 * @returns {Promise<{ status: boolean, message: string, data?: string }>}
 */
module.exports = async (params = {}) => {
  try {
    const { entity, entityId, action, userId, startDate, endDate } = params;

    const filters = {
      ...(entity && { entity }),
      ...(entityId && { entityId: String(entityId) }),
      ...(action && { action }),
      ...(userId && { userId: parseInt(userId) }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    const logs = await auditLogService.findAll(filters);

    if (!logs || logs.length === 0) {
      return {
        status: false,
        message: "No audit logs found matching the criteria",
        data: null,
      };
    }

    // Define CSV header
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "id", title: "ID" },
        { id: "timestamp", title: "Timestamp" },
        { id: "action", title: "Action" },
        { id: "entity", title: "Entity" },
        { id: "entityId", title: "Entity ID" },
        { id: "userId", title: "User ID" },
        { id: "userType", title: "User Type" },
        { id: "oldData", title: "Old Data" },
        { id: "newData", title: "New Data" },
        { id: "changes", title: "Changes" },
        { id: "ipAddress", title: "IP Address" },
        { id: "userAgent", title: "User Agent" },
      ],
    });

    const records = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userType: log.userType,
      oldData: log.oldData ? (typeof log.oldData === "string" ? log.oldData : JSON.stringify(log.oldData)) : "",
      newData: log.newData ? (typeof log.newData === "string" ? log.newData : JSON.stringify(log.newData)) : "",
      changes: log.changes ? (typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes)) : "",
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    return {
      status: true,
      message: "CSV export generated successfully",
      data: csvString,
    };
  } catch (error) {
    console.error("Error in exportAuditLogsToCSV:", error);
    return {
      status: false,
      message: error.message || "Failed to export audit logs to CSV",
      data: null,
    };
  }
};