// src/main/ipc/product/hard_delete.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  if (!id || typeof id !== "number") {
    return { status: false, message: "Valid product ID is required", data: null };
  }

  try {
    await productService.permanentlyDelete(id, user, queryRunner);
    return {
      status: true,
      message: "Product permanently deleted",
      data: null,
    };
  } catch (error) {
    console.error("Error in hardDeleteProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to permanently delete product",
      data: null,
    };
  }
};