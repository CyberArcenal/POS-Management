//@ts-check
const saleService = require("../../../services/Sale");
const csv = require("csv-parse/sync"); // hypothetical

/**
 * @param {Object} params
 * @param {string} params.csvData - Raw CSV string
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async (params, queryRunner) => {
  try {
    const { csvData, user } = params;
    if (!csvData) return { status: false, message: "csvData is required", data: null };

    // Parse CSV (simplified)
    const records = csv.parse(csvData, { columns: true, skip_empty_lines: true });
    const results = [];
    for (const record of records) {
      // Convert record to saleData format (mapping needed)
      const saleData = {
        items: JSON.parse(record.items || "[]"),
        customerId: record.customerId ? parseInt(record.customerId) : undefined,
        paymentMethod: record.paymentMethod,
        notes: record.notes,
      };
      const created = await saleService.create(saleData, user || "system");
      results.push(created);
    }

    console.log(`[IPC] sale:import_csv imported ${results.length} sales`);
    return {
      status: true,
      message: "Import successful",
      data: results,
    };
  } catch (error) {
    console.error("[IPC] sale:import_csv error:", error);
    return {
      status: false,
      message: error.message || "Failed to import sales",
      data: null,
    };
  }
};