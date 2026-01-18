//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
// @ts-ignore
const Product = require("../../../../entities/Product");
// @ts-ignore
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product history/logs
 * @param {number} productId
 * @param {number} userId
 */
// @ts-ignore
async function getProductHistory(productId, userId) {
  try {
    const logRepo = AppDataSource.getRepository(InventoryTransactionLog);
    
    const logs = await logRepo.find({
      where: { product_id: productId },
      relations: ['performed_by'],
      order: { created_at: "DESC" },
      take: 100
    });

    // Calculate summary
    const summary = {
      totalTransactions: logs.length,
      totalIncrease: logs
        // @ts-ignore
        .filter(log => log.change_amount > 0)
        // @ts-ignore
        .reduce((sum, log) => sum + log.change_amount, 0),
      totalDecrease: logs
        // @ts-ignore
        .filter(log => log.change_amount < 0)
        // @ts-ignore
        .reduce((sum, log) => sum + Math.abs(log.change_amount), 0),
      uniqueActions: [...new Set(logs.map(log => log.action))]
    };

    return {
      status: true,
      message: "Product history fetched",
      data: {
        logs,
        summary
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

module.exports = getProductHistory;