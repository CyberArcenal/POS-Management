// src/main/ipc/product/bulk_create.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { products, user = "system" } = params;
  if (!Array.isArray(products) || products.length === 0) {
    return { status: false, message: "products array is required", data: null };
  }

  try {
    const result = await productService.bulkCreate(products, user, queryRunner);
    return {
      status: true,
      message: `Bulk create completed. ${result.created.length} created, ${result.errors.length} failed.`,
      data: result,
    };
  } catch (error) {
    console.error("Error in bulkCreateProducts:", error);
    return {
      status: false,
      message: error.message || "Bulk create failed",
      data: null,
    };
  }
};