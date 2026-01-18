//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product by ID
 * @param {number} productId
 * @param {number} userId
 */
async function getProductById(productId, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const logRepo = AppDataSource.getRepository(InventoryTransactionLog);
    
    const product = await productRepo.findOne({
      where: { id: productId, is_deleted: false }
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
        data: null
      };
    }

    // Get recent transactions for this product
    const recentTransactions = await logRepo.find({
      where: { product_id: productId },
      order: { created_at: "DESC" },
      take: 10
    });

    return {
      status: true,
      message: "Product fetched successfully",
      data: {
        ...product,
        recentTransactions
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

module.exports = getProductById;