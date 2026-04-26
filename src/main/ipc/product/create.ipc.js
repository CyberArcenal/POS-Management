// src/main/ipc/product/create.ipc
const productService = require("../../../services/Product");

module.exports = async (params, queryRunner) => {
  const { user = "system", ...productData } = params;

  if (!productData.name || !productData.price) {
    return { status: false, message: "Name and price are required", data: null };
  }

  try {
    const savedProduct = await productService.create(productData, user, queryRunner);
    return {
      status: true,
      message: "Product created successfully",
      data: savedProduct,
    };
  } catch (error) {
    console.error("Error in createProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to create product",
      data: null,
    };
  }
};