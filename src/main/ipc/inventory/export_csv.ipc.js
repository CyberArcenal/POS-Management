// src/main/ipc/inventory/export_csv.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/datasource");
const InventoryMovement = require("../../../entities/InventoryMovement");

/**
 * Export inventory movements to CSV format.
 * @param {Object} params - Same filters as getAll.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: { csv: string, filename: string } }>}
 */
module.exports = async (params, queryRunner) => {
  try {
    // Reuse the getAll logic to fetch movements (avoid duplicating filter logic)
    const getAll = require("./get/all.ipc");
    const result = await getAll(params, queryRunner);
    if (!result.status) {
      return result; // Propagate error
    }

    const movements = result.data;

    // Define CSV headers
    const headers = [
      "ID",
      "Product ID",
      "Product Name",
      "SKU",
      "Movement Type",
      "Quantity Change",
      "Direction",
      "Sale ID",
      "Notes",
      "Timestamp",
    ];

    const rows = movements.map((m) => [
      m.id,
      m.product?.id || "",
      m.product?.name || "",
      m.product?.sku || "",
      m.movementType,
      m.qtyChange,
      m.qtyChange > 0 ? "Increase" : m.qtyChange < 0 ? "Decrease" : "Zero",
      m.sale?.id || "",
      m.notes || "",
      new Date(m.timestamp).toISOString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const filename = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;

    return {
      status: true,
      message: "CSV export generated",
      data: { csv: csvContent, filename },
    };
  } catch (error) {
    console.error("Error in exportInventoryMovementsToCSV:", error);
    return {
      status: false,
      message: error.message || "Export failed",
      data: null,
    };
  }
};