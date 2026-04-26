// src/main/ipc/product/bulk_update.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { updates, user = "system" } = params;
  if (!Array.isArray(updates) || updates.length === 0) {
    return { status: false, message: "updates array is required", data: null };
  }

  try {
    const result = await productService.bulkUpdate(updates, user, queryRunner);
    return {
      status: true,
      message: `Bulk update completed. ${result.updated.length} updated, ${result.errors.length} failed.`,
      data: result,
    };
  } catch (error) {
    console.error("Error in bulkUpdateProducts:", error);
    return {
      status: false,
      message: error.message || "Bulk update failed",
      data: null,
    };
  }
};