// inventory_transactions/create.ipc.js
//@ts-check
const Product = require("../../../entities/Product");
const { InventoryAction } = require("../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function createTransactionLog(params, queryRunner) {
  const { 
    // @ts-ignore
    product_id,
    // @ts-ignore
    action,
    // @ts-ignore
    change_amount,
    // @ts-ignore
    quantity_before,
    // @ts-ignore
    quantity_after,
    // @ts-ignore
    price_before = null,
    // @ts-ignore
    price_after = null,
    // @ts-ignore
    reference_id = null,
    // @ts-ignore
    reference_type = null,
    // @ts-ignore
    notes = "",
    // @ts-ignore
    location_id = null,
    // @ts-ignore
    batch_number = null,
    // @ts-ignore
    expiry_date = null,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const transactionRepo = queryRunner.manager.getRepository(InventoryTransactionLog);
    const productRepo = queryRunner.manager.getRepository(Product);

    // Validate required fields
    if (!product_id || !action || change_amount === undefined || 
        !quantity_before || !quantity_after) {
      return {
        status: false,
        message: "Product ID, Action, Change Amount, Quantity Before, and Quantity After are required",
        data: null,
      };
    }

    // Validate action
    const validActions = Object.values(InventoryAction);
    if (!validActions.includes(action)) {
      return {
        status: false,
        message: `Invalid action. Valid actions are: ${validActions.join(', ')}`,
        data: null,
      };
    }

    // Verify product exists
    const product = await productRepo.findOne({
      where: { id: product_id, is_deleted: false }
    });

    if (!product) {
      return {
        status: false,
        message: `Product with ID ${product_id} not found`,
        data: null,
      };
    }

    // Verify quantity consistency
    const expectedQuantityAfter = quantity_before + change_amount;
    if (quantity_after !== expectedQuantityAfter) {
      return {
        status: false,
        message: `Quantity inconsistency. Expected: ${expectedQuantityAfter}, Provided: ${quantity_after}`,
        data: null,
      };
    }

    // Create transaction log
    const transactionLog = transactionRepo.create({
      product_id: product_id.toString(),
      action,
      change_amount,
      quantity_before,
      quantity_after,
      price_before: price_before || product.price,
      price_after: price_after || product.price,
      reference_id,
      reference_type,
      performed_by_id: _userId.toString(),
      notes,
      location_id,
      batch_number,
      expiry_date,
      ip_address: "127.0.0.1",
      user_agent: "POS-Management-System",
    });

    await transactionRepo.save(transactionLog);

    // Update product stock if necessary (for manual adjustments)
    if (['manual_adjustment', 'quick_increase', 'quick_decrease', 
         'bulk_increase', 'bulk_decrease'].includes(action)) {
      
      // Verify current stock matches quantity_after
      if (product.stock !== quantity_after) {
        await productRepo.update(product_id, {
          stock: quantity_after,
          updated_at: new Date(),
        });
      }
    }

    // Log audit
    // @ts-ignore
    await log_audit("create", "InventoryTransactionLog", transactionLog.id, _userId, {
      product_id,
      action,
      change_amount,
      quantity_before,
      quantity_after,
      reference_type,
    });

    return {
      status: true,
      message: "Transaction log created successfully",
      data: {
        transaction_log: transactionLog,
        product_update: {
          previous_stock: product.stock,
          new_stock: quantity_after,
          stock_change: change_amount,
        },
      },
    };
  } catch (error) {
    console.error("createTransactionLog error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, _userId, {
      action: "create",
      product_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create transaction log: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createTransactionLog;