// update_inventory_stock.ipc.js (updated with SyncData tracking)
//@ts-check
const syncDataManager = require("../../../services/inventory_sync/syncDataManager");
const { log_audit } = require("../../../utils/auditLogger");
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");
const { logger } = require("../../../utils/logger");

/**
 * Updates inventory stock after POS sale
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
// @ts-ignore
async function updateInventoryStock(params, queryRunner) {
  let batchSyncRecord = null;

  try {
    // @ts-ignore
    const {
      // @ts-ignore
      userId,
      // @ts-ignore
      saleData,
      // @ts-ignore
      items,
      // @ts-ignore
      action = "sale", // 'sale' or 'return'
    } = params;

    if (!items || !Array.isArray(items)) {
      return {
        status: false,
        message: "No items provided for inventory update",
        data: null,
      };
    }

    const results = {
      updated: 0,
      failed: 0,
      details: [],
      syncRecords: [],
    };

    // Create batch sync record for this sale
    batchSyncRecord = await syncDataManager.recordSyncStart(
      "Sale",
      saleData?.id || 0,
      "outbound",
      // @ts-ignore
      {
        saleReference: saleData?.reference_number,
        action,
        itemCount: items.length,
        userId,
      },
    );

    // Prepare stock updates
    const stockUpdates = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        continue;
      }

      // Get product to find inventory_id
      const product = await queryRunner.manager.findOne("Product", {
        where: { id: item.product_id },
      });

      // @ts-ignore
      if (!product || !product.stock_item_id) {
        results.failed++;
        // @ts-ignore
        results.details.push({
          product_id: item.product_id,
          success: false,
          error: "Product not found or not linked to inventory",
        });
        continue;
      }

      const quantityChange =
        action === "sale" ? -Math.abs(item.quantity) : Math.abs(item.quantity);

      stockUpdates.push({
        // @ts-ignore
        inventoryId: product.stock_item_id,
        productId: product.id,
        // @ts-ignore
        productName: product.name,
        quantityChange: quantityChange,
        action: action === "sale" ? "sale" : "return",
        saleReference: saleData?.reference_number || `POS-${Date.now()}`,
        saleItemId: item.id,
      });
    }

    if (stockUpdates.length === 0) {
      await syncDataManager.recordSyncFailure(
        // @ts-ignore
        batchSyncRecord.id,
        new Error("No valid items to update in inventory"),
      );

      return {
        status: false,
        message: "No valid items to update in inventory",
        data: null,
      };
    }

    // Connect to inventory database
    await inventoryDB.connect();

    try {
      // Bulk update stock in inventory
      const updateResults = await inventoryDB.bulkUpdateStock(
        // @ts-ignore
        stockUpdates,
        userId,
      );

      // Record results and create transaction logs in POS
      for (const result of updateResults) {
        const originalUpdate = stockUpdates.find(
          (u) => u.inventoryId === result.inventoryId,
        );

        // Create individual sync record for each product update
        const productSyncRecord = await syncDataManager.recordSyncStart(
          "Product",
          // @ts-ignore
          originalUpdate.productId,
          "outbound",
          // @ts-ignore
          {
            // @ts-ignore
            inventoryId: originalUpdate.inventoryId,
            // @ts-ignore
            saleReference: originalUpdate.saleReference,
            // @ts-ignore
            action: originalUpdate.action,
            // @ts-ignore
            quantityChange: originalUpdate.quantityChange,
          },
        );

        if (result.success) {
          results.updated++;

          // Record sync success for this product
          // @ts-ignore
          await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
            // @ts-ignore
            previousStock: result.previousStock,
            // @ts-ignore
            newStock: result.newStock,
            // @ts-ignore
            warehouseId: result.warehouseId,
          });

          // Create inventory transaction log in POS database
          await queryRunner.manager.query(
            `
            INSERT INTO inventory_transaction_logs (
              product_id, action, change_amount,
              quantity_before, quantity_after,
              reference_id, reference_type,
              performed_by_id, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `,
            [
              // @ts-ignore
              originalUpdate.productId,
              action === "sale" ? "SALE" : "RETURN",
              // @ts-ignore
              originalUpdate.quantityChange,
              // @ts-ignore
              result.previousStock,
              // @ts-ignore
              result.newStock,
              saleData?.id || null,
              "sale",
              userId,
              // @ts-ignore
              `${action === "sale" ? "Sale" : "Return"} recorded in POS. Inventory stock updated from ${result.previousStock} to ${result.newStock}. Reference: ${originalUpdate.saleReference}`,
            ],
          );

          // @ts-ignore
          results.details.push({
            // @ts-ignore
            product_id: originalUpdate.productId,
            // @ts-ignore
            product_name: originalUpdate.productName,
            success: true,
            inventory_id: result.inventoryId,
            // @ts-ignore
            previous_stock: result.previousStock,
            // @ts-ignore
            new_stock: result.newStock,
            syncId: productSyncRecord.id,
          });

          // @ts-ignore
          results.syncRecords.push({
            // @ts-ignore
            productId: originalUpdate.productId,
            syncId: productSyncRecord.id,
            success: true,
          });
        } else {
          results.failed++;

          // Record sync failure for this product
          // @ts-ignore
          await syncDataManager.recordSyncFailure(
            // @ts-ignore
            productSyncRecord.id,
            // @ts-ignore
            new Error(result.error),
          );

          // @ts-ignore
          results.details.push({
            // @ts-ignore
            product_id: originalUpdate.productId,
            // @ts-ignore
            product_name: originalUpdate.productName,
            success: false,
            // @ts-ignore
            error: result.error,
            syncId: productSyncRecord.id,
          });

          // @ts-ignore
          results.syncRecords.push({
            // @ts-ignore
            productId: originalUpdate.productId,
            syncId: productSyncRecord.id,
            success: false,
            // @ts-ignore
            error: result.error,
          });
        }
      }

      // Record batch sync success if all succeeded
      if (results.failed === 0) {
        // @ts-ignore
        await syncDataManager.recordSyncSuccess(batchSyncRecord.id, {
          summary: results,
          saleId: saleData?.id,
        });
      } else {
        // @ts-ignore
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          batchSyncRecord.id,
          new Error(`${results.failed} items failed to sync`),
        );
      }
    } finally {
      await inventoryDB.disconnect();
    }

    // Log audit
    await log_audit("update_inventory_stock", "Inventory", 0, userId, {
      action: action,
      sale_data: saleData,
      results: results,
      batchSyncId: batchSyncRecord.id,
      timestamp: new Date().toISOString(),
    });

    return {
      status: true,
      message: `Inventory updated: ${results.updated} successful, ${results.failed} failed`,
      data: {
        ...results,
        batchSyncId: batchSyncRecord.id,
      },
    };
  } catch (error) {
    // @ts-ignore
    logger.error("updateInventoryStock error:", error);

    // Record batch sync failure
    if (batchSyncRecord) {
      // @ts-ignore
      await syncDataManager.recordSyncFailure(batchSyncRecord.id, error);
    }

    throw error;
  }
}

module.exports = updateInventoryStock;
