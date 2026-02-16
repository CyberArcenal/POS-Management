// src/main/ipc/supplier/export_csv.ipc
// @ts-check
const supplierService = require("../../../services/SupplierService");
const { logger } = require("../../../utils/logger");

/**
 * Export suppliers to CSV format
 * @param {Object} params
 * @param {Object} [params.filters] - Filters to apply (isActive, search, etc.)
 * @param {string} [params.user] - User performing action
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  const { filters = {}, user = "system" } = params;

  try {
    const exportData = await supplierService.exportSuppliers("csv", filters, user);
    return {
      status: true,
      data: exportData,
    };
  } catch (error) {
    logger?.error("exportSuppliersToCSV error:", error);
    return {
      status: false,
      message: error.message || "Failed to export suppliers to CSV",
      data: null,
    };
  }
};