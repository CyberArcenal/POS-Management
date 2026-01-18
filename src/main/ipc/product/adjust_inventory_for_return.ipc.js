//@ts-check
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const Product = require("../../../entities/Product");
const { log_audit } = require("../../../utils/auditLogger");
const { logger } = require("../../../utils/logger");

/**
 * Adjusts product inventory for returns/refunds
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function adjustProductInventoryForReturn(params, queryRunner) {
  try {
    // @ts-ignore
    const { productId, quantity, returnId, reason, userId } = params;
    
    const productRepo = queryRunner.manager.getRepository(Product);
    const logRepo = queryRunner.manager.getRepository(InventoryTransactionLog);
    
    // Get product
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
    
    const quantityBefore = product.stock;
    const quantityAfter = product.stock + quantity;
    
    // Update stock
    await productRepo.update(productId, {
      stock: quantityAfter,
      updated_at: new Date()
    });
    
    // Log inventory transaction
    const logEntry = logRepo.create({
      product_id: productId,
      action: "RETURN",
      change_amount: quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      performed_by_id: userId,
      notes: `Return #${returnId}, Quantity: ${quantity}, Reason: ${reason}`
    });
    
    await logRepo.save(logEntry);
    
    // Log audit
    await log_audit("adjust_inventory", "Product", productId, userId, {
      return_id: returnId,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      change: quantity,
      reason: reason,
      type: "return"
    });
    
    return {
      status: true,
      message: "Inventory adjusted for return",
      data: {
        productId,
        newStock: quantityAfter,
        updated: true
      }
    };
  } catch (error) {
    // @ts-ignore
    logger.error("adjustProductInventoryForReturn error:", error);
    throw error;
  }
}

module.exports = adjustProductInventoryForReturn;