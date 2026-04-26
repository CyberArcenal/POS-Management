// src/main/ipc/product/import_csv.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  if (!filePath) {
    return { status: false, message: "filePath is required", data: null };
  }

  try {
    const result = await productService.importFromCSV(filePath, user, queryRunner);
    return {
      status: true,
      message: `CSV import completed. ${result.imported.length} imported, ${result.errors.length} failed.`,
      data: result,
    };
  } catch (error) {
    console.error("Error in importProductsFromCSV:", error);
    return {
      status: false,
      message: error.message || "CSV import failed",
      data: null,
    };
  }
};