//@ts-check
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const Product = require("../../../entities/Product");
const { log_audit } = require("../../../utils/auditLogger");
const { logger } = require("../../../utils/logger");

/**
 * Updates product stock when a sale is made
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateProductStockForSale(params, queryRunner) {
  try {
    // @ts-ignore
    const { productId, quantity, saleId, userId } = params;
    
    const productRepo = queryRunner.manager.getRepository(Product);
    const logRepo = queryRunner.manager.getRepository(InventoryTransactionLog);
    
    // Get product with lock for concurrent updates
    const product = await productRepo.findOne({
      where: { id: productId, is_deleted: false },
      lock: { mode: "pessimistic_write" }
    });
    
    if (!product) {
      return {
        status: false,
        message: "Product not found",
        data: null
      };
    }
    
    // Check if enough stock
    // @ts-ignore
    if (product.stock < quantity) {
      return {
        status: false,
        message: `Insufficient stock. Available: ${product.stock}`,
        data: null
      };
    }
    
    const quantityBefore = product.stock;
    // @ts-ignore
    const quantityAfter = product.stock - quantity;
    
    // Update stock
    await productRepo.update(productId, {
      stock: quantityAfter,
      updated_at: new Date()
    });
    
    // Log inventory transaction
    const logEntry = logRepo.create({
      product_id: productId,
      action: "ORDER_CONFIRMATION",
      change_amount: -quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      performed_by_id: userId,
      notes: `Sale #${saleId}, Quantity: ${quantity}`
    });
    
    await logRepo.save(logEntry);
    
    // Log audit
    await log_audit("update_stock", "Product", productId, userId, {
      sale_id: saleId,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      change: -quantity,
      type: "sale"
    });
    
    return {
      status: true,
      message: "Stock updated for sale",
      data: {
        productId,
        newStock: quantityAfter,
        updated: true
      }
    };
  } catch (error) {
    // @ts-ignore
    logger.error("updateProductStockForSale error:", error);
    throw error;
  }
}

module.exports = updateProductStockForSale;