// src/main/ipc/product/export_csv.ipc
//@ts-check
const fs = require("fs").promises;
const path = require("path");
const { app } = require("electron");
const productService = require("../../../services/Product");

/**
 * @param {Object} params
 * @param {Object} [params.filters] - same filters as findAll
 * @param {string} [params.outputPath] - if not provided, saves to userData/exports
 * @param {string} [params.user]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  const { filters = {}, outputPath: customPath, user = "system" } = params;

  try {
    const products = await productService.findAll(filters);

    // Generate CSV
    const headers = ["ID", "SKU", "Name", "Description", "Price", "Stock Qty", "Active", "Created At"];
    const rows = products.map(p => [
      p.id,
      p.sku,
      p.name,
      p.description || "",
      p.price,
      p.stockQty,
      p.isActive ? "Yes" : "No",
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");

    // Determine output path
    let finalPath = customPath;
    if (!finalPath) {
      const userDataPath = app.getPath("userData");
      const exportDir = path.join(userDataPath, "exports");
      await fs.mkdir(exportDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      finalPath = path.join(exportDir, `products_export_${timestamp}.csv`);
    }

    await fs.writeFile(finalPath, csvContent, "utf-8");

    // Audit log (using service's logger – may not be transactional, but export is read-only)
    await productService.logActivity(user, "EXPORT", `Exported ${products.length} products to CSV`);

    return {
      status: true,
      message: `Products exported to ${finalPath}`,
      data: { filePath: finalPath, count: products.length },
    };
  } catch (error) {
    console.error("Error in exportProductsToCSV:", error);
    return {
      status: false,
      message: error.message || "Export failed",
      data: null,
    };
  }
};