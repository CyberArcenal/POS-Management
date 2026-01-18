// inventory_transactions/create_bulk.ipc.js
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
async function createBulkTransactionLog(params, queryRunner) {
  const { 
    // @ts-ignore
    transactions = [], // Array of transaction objects
    // @ts-ignore
    bulk_action = null, // Optional: common action for all
    // @ts-ignore
    bulk_reference_id = null,
    // @ts-ignore
    bulk_reference_type = null,
    // @ts-ignore
    bulk_notes = "",
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!transactions || transactions.length === 0) {
      return {
        status: false,
        message: "No transactions provided",
        data: null,
      };
    }

    const transactionRepo = queryRunner.manager.getRepository(InventoryTransactionLog);
    const productRepo = queryRunner.manager.getRepository(Product);

    const results = {
      successful: [],
      failed: [],
      product_updates: [],
    };

    // Process each transaction
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      try {
        // Apply bulk settings if provided
        const action = bulk_action || transaction.action;
        const reference_id = bulk_reference_id || transaction.reference_id;
        const reference_type = bulk_reference_type || transaction.reference_type;
        const notes = bulk_notes || transaction.notes || "";

        // Validate required fields
        if (!transaction.product_id || !action || transaction.change_amount === undefined || 
            transaction.quantity_before === undefined || transaction.quantity_after === undefined) {
          // @ts-ignore
          results.failed.push({
            index: i,
            product_id: transaction.product_id,
            error: "Missing required fields",
          });
          continue;
        }

        // Validate action
        const validActions = Object.values(InventoryAction);
        if (!validActions.includes(action)) {
          // @ts-ignore
          results.failed.push({
            index: i,
            product_id: transaction.product_id,
            error: `Invalid action: ${action}`,
          });
          continue;
        }

        // Get product
        const product = await productRepo.findOne({
          where: { id: transaction.product_id, is_deleted: false }
        });

        if (!product) {
          // @ts-ignore
          results.failed.push({
            index: i,
            product_id: transaction.product_id,
            error: "Product not found",
          });
          continue;
        }

        // Verify quantity consistency
        const expectedQuantityAfter = transaction.quantity_before + transaction.change_amount;
        if (transaction.quantity_after !== expectedQuantityAfter) {
          // @ts-ignore
          results.failed.push({
            index: i,
            product_id: transaction.product_id,
            error: `Quantity inconsistency. Expected: ${expectedQuantityAfter}, Provided: ${transaction.quantity_after}`,
          });
          continue;
        }

        // Create transaction log
        const transactionLog = transactionRepo.create({
          product_id: transaction.product_id.toString(),
          action,
          change_amount: transaction.change_amount,
          quantity_before: transaction.quantity_before,
          quantity_after: transaction.quantity_after,
          price_before: transaction.price_before || product.price,
          price_after: transaction.price_after || product.price,
          reference_id,
          reference_type,
          performed_by_id: _userId.toString(),
          notes: notes,
          location_id: transaction.location_id,
          batch_number: transaction.batch_number,
          expiry_date: transaction.expiry_date,
          ip_address: "127.0.0.1",
          user_agent: "POS-Management-System",
        });

        await transactionRepo.save(transactionLog);

        // Update product stock for applicable actions
        if (['manual_adjustment', 'quick_increase', 'quick_decrease', 
             'bulk_increase', 'bulk_decrease'].includes(action)) {
          
          if (product.stock !== transaction.quantity_after) {
            await productRepo.update(transaction.product_id, {
              stock: transaction.quantity_after,
              updated_at: new Date(),
            });
          }

          // @ts-ignore
          results.product_updates.push({
            product_id: transaction.product_id,
            product_name: product.name,
            previous_stock: product.stock,
            new_stock: transaction.quantity_after,
            stock_change: transaction.change_amount,
          });
        }

        // @ts-ignore
        results.successful.push({
          index: i,
          transaction_id: transactionLog.id,
          product_id: transaction.product_id,
          action,
          change_amount: transaction.change_amount,
        });

      } catch (error) {
        // @ts-ignore
        results.failed.push({
          index: i,
          product_id: transaction.product_id,
          // @ts-ignore
          error: error.message,
        });
      }
    }

    // Log audit
    await log_audit("create_bulk", "InventoryTransactionLog", 0, _userId, {
      total_transactions: transactions.length,
      successful: results.successful.length,
      failed: results.failed.length,
      bulk_action,
      bulk_reference_type,
    });

    return {
      status: true,
      message: `Bulk transaction processing completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`,
      data: {
        summary: {
          total: transactions.length,
          successful: results.successful.length,
          failed: results.failed.length,
          success_rate: (results.successful.length / transactions.length) * 100,
        },
        details: {
          successful: results.successful,
          failed: results.failed,
          product_updates: results.product_updates,
        },
      },
    };
  } catch (error) {
    console.error("createBulkTransactionLog error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, _userId, {
      action: "create_bulk",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create bulk transaction log: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createBulkTransactionLog;