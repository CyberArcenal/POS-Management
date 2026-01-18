// sales/sync_with_inventory.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const SaleItem = require("../../../entities/SaleItem");
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
async function syncSaleWithInventory(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    sync_type = 'both', // 'stock_only', 'prices_only', 'both'
    // @ts-ignore
    force = false,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!sale_id) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    const saleRepo = queryRunner.manager.getRepository(Sale);
    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const productRepo = queryRunner.manager.getRepository(Product);
    const inventoryLogRepo = queryRunner.manager.getRepository(InventoryTransactionLog);

    // Find the sale
    const sale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["items", "items.product"],
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${sale_id} not found`,
        data: null,
      };
    }

    const syncResults = {
      stock_updates: [],
      price_updates: [],
      inventory_logs: [],
      warnings: [],
      errors: [],
    };

    // Sync stock levels
    if (sync_type === 'both' || sync_type === 'stock_only') {
      // @ts-ignore
      for (const item of sale.items) {
        if (!item.product) {
          // @ts-ignore
          syncResults.warnings.push(`Item ${item.id}: Product not found, skipping stock sync`);
          continue;
        }

        const product = await productRepo.findOne({
          where: { id: item.product_id }
        });

        if (!product) {
          // @ts-ignore
          syncResults.warnings.push(`Item ${item.id}: Product ${item.product_id} not found in database`);
          continue;
        }

        // Calculate expected stock after sale
        // @ts-ignore
        const expectedStock = product.stock - item.quantity;
        const actualStock = product.stock; // Current stock in database

        // Check if sync is needed
        if (expectedStock !== actualStock || force) {
          // Update product stock to expected value
          await productRepo.update(item.product_id, {
            stock: expectedStock,
            updated_at: new Date(),
          });

          // Log inventory transaction
          const inventoryLog = inventoryLogRepo.create({
            product_id: item.product_id.toString(),
            action: force ? InventoryAction.CORRECTION : InventoryAction.STOCK_SYNC,
            // @ts-ignore
            change_amount: expectedStock - actualStock,
            quantity_before: actualStock,
            quantity_after: expectedStock,
            price_before: product.price,
            price_after: product.price,
            reference_id: sale_id.toString(),
            reference_type: "sale_sync",
            performed_by_id: _userId.toString(),
            notes: `Sale sync: ${force ? 'Forced correction' : 'Automatic sync'} for sale #${sale.reference_number}`,
          });

          await inventoryLogRepo.save(inventoryLog);

          // @ts-ignore
          syncResults.stock_updates.push({
            product_id: item.product_id,
            product_name: product.name,
            previous_stock: actualStock,
            new_stock: expectedStock,
            // @ts-ignore
            adjustment: expectedStock - actualStock,
            sync_type: force ? 'forced' : 'automatic',
          });

          // @ts-ignore
          syncResults.inventory_logs.push({
            product_id: item.product_id,
            log_id: inventoryLog.id,
            action: inventoryLog.action,
          });
        }
      }
    }

    // Sync prices
    if (sync_type === 'both' || sync_type === 'prices_only') {
      // @ts-ignore
      for (const item of sale.items) {
        if (!item.product) {
          // @ts-ignore
          syncResults.warnings.push(`Item ${item.id}: Product not found, skipping price sync`);
          continue;
        }

        const product = await productRepo.findOne({
          where: { id: item.product_id }
        });

        if (!product) {
          // @ts-ignore
          syncResults.warnings.push(`Item ${item.id}: Product ${item.product_id} not found in database`);
          continue;
        }

        // Check if sale price matches current product price
        if (item.unit_price !== product.price || force) {
          // Update sale item price if needed
          if (item.unit_price !== product.price) {
            // @ts-ignore
            const newTotalPrice = product.price * item.quantity;
            const priceDifference = newTotalPrice - item.total_price;

            await saleItemRepo.update(item.id, {
              // @ts-ignore
              unit_price: product.price,
              total_price: newTotalPrice,
              updated_at: new Date(),
            });

            // @ts-ignore
            syncResults.price_updates.push({
              item_id: item.id,
              product_id: item.product_id,
              previous_unit_price: item.unit_price,
              new_unit_price: product.price,
              previous_total: item.total_price,
              new_total: newTotalPrice,
              price_difference: priceDifference,
            });
          }
        }
      }

      // Recalculate sale total if prices were updated
      if (syncResults.price_updates.length > 0) {
        const allItems = await saleItemRepo.find({ where: { sale_id } });
        // @ts-ignore
        const itemsTotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
        // @ts-ignore
        const newTotal = itemsTotal + (sale.tax_amount || 0) - (sale.discount_amount || 0);

        await saleRepo.update(sale_id, {
          total: newTotal,
          updated_at: new Date(),
        });

        // Update sale object for response
        sale.total = newTotal;
      }
    }

    // Generate sync summary
    const syncSummary = {
      // @ts-ignore
      total_items: sale.items.length,
      stock_updates_count: syncResults.stock_updates.length,
      price_updates_count: syncResults.price_updates.length,
      warnings_count: syncResults.warnings.length,
      errors_count: syncResults.errors.length,
      inventory_logs_count: syncResults.inventory_logs.length,
      sync_type,
      forced: force,
    };

    // Log audit
    await log_audit("sync_inventory", "Sale", sale_id, _userId, {
      sync_type,
      force,
      summary: syncSummary,
    });

    return {
      status: true,
      message: "Sale synchronized with inventory successfully",
      data: {
        sale,
        sync_results: syncResults,
        sync_summary: syncSummary,
        recommendations: generateSyncRecommendations(syncResults),
      },
    };
  } catch (error) {
    console.error("syncSaleWithInventory error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "sync_inventory",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to sync sale with inventory: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate recommendations based on sync results
 */
// @ts-ignore
function generateSyncRecommendations(syncResults) {
  const recommendations = [];

  if (syncResults.stock_updates.length > 0) {
    recommendations.push({
      type: 'stock_discrepancy',
      message: `${syncResults.stock_updates.length} stock discrepancies were found and corrected. Consider reviewing inventory management processes.`,
      priority: 'medium',
    });
  }

  if (syncResults.price_updates.length > 0) {
    recommendations.push({
      type: 'price_discrepancy',
      message: `${syncResults.price_updates.length} price discrepancies were found. Ensure price updates are immediately reflected in the POS system.`,
      priority: 'high',
    });
  }

  if (syncResults.warnings.length > 0) {
    recommendations.push({
      type: 'data_consistency',
      message: `${syncResults.warnings.length} warnings were encountered during sync. Review product data consistency.`,
      priority: 'low',
    });
  }

  if (syncResults.errors.length > 0) {
    recommendations.push({
      type: 'system_error',
      message: `${syncResults.errors.length} errors occurred. Contact system administrator for resolution.`,
      priority: 'high',
    });
  }

  if (syncResults.stock_updates.length === 0 && syncResults.price_updates.length === 0) {
    recommendations.push({
      type: 'sync_success',
      message: 'All data is synchronized correctly. No discrepancies found.',
      priority: 'info',
    });
  }

  return recommendations;
}

module.exports = syncSaleWithInventory;