// src/main/ipc/product/update.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { id, user = "system", ...updates } = params;
  if (!id || typeof id !== "number") {
    return { status: false, message: "Valid product ID is required", data: null };
  }

  try {
    const updatedProduct = await productService.update(id, updates, user, queryRunner);
    return {
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to update product",
      data: null,
    };
  }
};