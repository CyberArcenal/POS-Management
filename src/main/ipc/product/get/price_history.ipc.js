//@ts-check
// Since we don't have a price history table,
// we can use inventory transaction logs that track price changes
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product price history
 * @param {number} productId
 * @param {number} userId
 */
async function getProductPriceHistory(productId, userId) {
  try {
    const logRepo = AppDataSource.getRepository(InventoryTransactionLog);
    
    // Get logs that might indicate price changes
    const priceLogs = await logRepo.find({
      where: {
        product_id: productId,
        action: "MANUAL_ADJUSTMENT" // Adjust based on your action types
      },
      order: { created_at: "DESC" },
      take: 50
    });

    // If you have a dedicated price history table, query it instead
    // For now, return placeholder

    return {
      status: true,
      message: "Price history fetched",
      data: priceLogs
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

module.exports = getProductPriceHistory;