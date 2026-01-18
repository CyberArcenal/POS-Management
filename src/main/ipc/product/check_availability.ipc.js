//@ts-check
const Product = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Check if a product has enough stock for a given quantity
 * @param {number} productId
 * @param {number} quantity
 * @param {number} userId
 */
// @ts-ignore
async function checkProductAvailability(productId, quantity, userId) {
  try {
    if (!productId || !quantity || quantity <= 0) {
      return {
        status: false,
        message: "Invalid product ID or quantity",
        data: null
      };
    }

    const productRepo = AppDataSource.getRepository(Product);
    
    const product = await productRepo.findOne({
      where: { id: productId, is_deleted: false },
      select: ["id", "name", "stock", "min_stock", "sku"]
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
        data: null
      };
    }

    // @ts-ignore
    const available = product.stock >= quantity;
    // @ts-ignore
    const lowStock = product.stock <= product.min_stock;
    const outOfStock = product.stock === 0;

    return {
      status: true,
      message: available ? "Product is available" : "Insufficient stock",
      data: {
        available,
        currentStock: product.stock,
        requiredQuantity: quantity,
        // @ts-ignore
        difference: product.stock - quantity,
        lowStock,
        outOfStock,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        }
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

module.exports = checkProductAvailability;