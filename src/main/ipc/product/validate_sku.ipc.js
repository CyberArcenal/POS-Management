//@ts-check
const Product = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Validate SKU uniqueness
 * @param {string} sku
 * @param {number} userId
 */
async function validateProductSKU(sku, userId) {
  try {
    if (!sku || sku.trim().length === 0) {
      return {
        status: false,
        message: "SKU is required",
        data: null
      };
    }

    const productRepo = AppDataSource.getRepository(Product);
    
    const existingProduct = await productRepo.findOne({
      where: { sku: sku.trim(), is_deleted: false }
    });

    return {
      status: true,
      message: existingProduct ? "SKU already exists" : "SKU is available",
      data: {
        available: !existingProduct,
        exists: !!existingProduct,
        product: existingProduct ? {
          id: existingProduct.id,
          name: existingProduct.name
        } : null
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
}

module.exports = validateProductSKU;