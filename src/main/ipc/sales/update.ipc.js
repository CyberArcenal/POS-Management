// sales/update.ipc.js - REFACTORED FOR RETURNS & WAREHOUSE SYNC
//@ts-check
const Sale = require("../../../entities/Sale");
const SaleItem = require("../../../entities/SaleItem");
const Product = require("../../../entities/Product");
const { log_audit } = require("../../../utils/auditLogger");

// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");
const WarehouseManager = require("../../../services/inventory_sync/warehouseManager");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateSale(params, queryRunner) {
  const {
    // @ts-ignore
    sale_id,

    // @ts-ignore
    updates = {},

    // @ts-ignore
    return_items = [], // Array of { item_id, quantity, reason }

    // @ts-ignore
    _userId,

    // @ts-ignore
    user_name,
  } = params;
  const warehouseManager = new WarehouseManager();

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

    // Find the sale
    const sale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["items"],
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${sale_id} not found`,
        data: null,
      };
    }

    // Get warehouse from sale
    const warehouse = {
      id: sale.warehouse_id,
      name: sale.warehouse_name,
    };

    const updateLog = {
      sale_updates: {},
      item_updates: [],
      returns_processed: [],
      previous_state: {
        status: sale.status,
        total: sale.total,

        // @ts-ignore
        items_count: sale.items?.length || 0,
      },
    };

    // Handle regular sale updates
    const allowedSaleUpdates = [
      "customer_name",
      "customer_phone",
      "customer_email",
      "notes",
      "payment_method",
      "status",
    ];

    const saleUpdates = {};
    Object.keys(updates).forEach((key) => {
      // @ts-ignore
      if (allowedSaleUpdates.includes(key) && updates[key] !== sale[key]) {
        // @ts-ignore
        saleUpdates[key] = updates[key];

        // @ts-ignore
        updateLog.sale_updates[key] = {
          // @ts-ignore
          from: sale[key],
          to: updates[key],
        };
      }
    });

    if (Object.keys(saleUpdates).length > 0) {
      // @ts-ignore
      saleUpdates.updated_at = new Date();
      await saleRepo.update(sale_id, saleUpdates);
    }

    // Handle returns
    const returnResults = [];
    if (return_items.length > 0) {
      // Verify sale can accept returns
      if (sale.status === "cancelled" || sale.status === "refunded") {
        return {
          status: false,
          message: `Cannot process returns for a ${sale.status} sale`,
          data: null,
        };
      }

      for (const returnItem of return_items) {
        try {
          // @ts-ignore
          const saleItem = sale.items.find(
            (/** @type {{ id: any; }} */ item) =>
              item.id === returnItem.item_id,
          );

          if (!saleItem) {
            returnResults.push({
              item_id: returnItem.item_id,
              status: "failed",
              message: "Item not found in sale",
            });
            continue;
          }

          // Validate return quantity
          const maxReturnable = saleItem.quantity - saleItem.returned_quantity;
          if (returnItem.quantity > maxReturnable) {
            returnResults.push({
              item_id: returnItem.item_id,
              status: "failed",
              message: `Cannot return ${returnItem.quantity} units. Maximum returnable: ${maxReturnable}`,
            });
            continue;
          }

          // Find product in warehouse
          const product = await productRepo.findOne({
            // @ts-ignore
            where: {
              sync_id: saleItem.sync_id,
              warehouse_id: warehouse.id,
              is_active: true,
            },
          });

          if (!product) {
            returnResults.push({
              item_id: returnItem.item_id,
              status: "failed",
              message: "Original product not found in current warehouse",
            });
            continue;
          }

          // Update sale item return info
          const newReturnedQuantity =
            saleItem.returned_quantity + returnItem.quantity;
          const isFullyReturned = newReturnedQuantity >= saleItem.quantity;

          await saleItemRepo.update(returnItem.item_id, {
            returned_quantity: newReturnedQuantity,
            is_returned: isFullyReturned,
            return_reason: returnItem.reason,
            return_date: new Date(),
            updated_at: new Date(),
          });

          // Track stock change (positive for return)
          const stockChangeResult = await warehouseManager.trackStockChange({
            product_id: product.id,
            quantity_change: returnItem.quantity,
            change_type: "return",
            reference: {
              id: sale.id,
              item_id: returnItem.item_id,
              type: "return",
            },
            user_info: { id: _userId, name: user_name },
            notes: `Return from Sale #${sale.reference_number}: ${returnItem.reason}`,
          });

          // Update sale inventory sync status
          await saleRepo.update(sale_id, {
            inventory_synced: false, // Mark for re-sync
            updated_at: new Date(),
          });

          returnResults.push({
            item_id: returnItem.item_id,
            status: "success",
            message: `${returnItem.quantity} units returned`,
            stock_change: stockChangeResult,
          });

          // @ts-ignore
          updateLog.returns_processed.push({
            item_id: returnItem.item_id,
            product_id: product.id,
            quantity: returnItem.quantity,
            reason: returnItem.reason,
            stock_change_result: stockChangeResult,
          });
        } catch (error) {
          returnResults.push({
            item_id: returnItem.item_id,
            status: "failed",

            // @ts-ignore
            message: error.message,

            // @ts-ignore
            error: error.stack,
          });
        }
      }

      // Recalculate sale total if items were returned
      if (updateLog.returns_processed.length > 0) {
        const allItems = await saleItemRepo.find({ where: { sale_id } });
        const remainingTotal = allItems.reduce((sum, item) => {
          const returnedAmount =
            // @ts-ignore
            (item.returned_quantity / item.quantity) * item.total_price;

          // @ts-ignore
          return sum + (item.total_price - returnedAmount);
        }, 0);

        // Update sale with new total

        const newTotal =
          // @ts-ignore
          remainingTotal + (sale.tax_amount || 0) - (sale.discount_amount || 0);

        await saleRepo.update(sale_id, {
          total: newTotal,
          subtotal: remainingTotal,
          updated_at: new Date(),
        });

        // @ts-ignore
        updateLog.sale_updates.total = {
          from: sale.total,
          to: newTotal,
        };

        // @ts-ignore
        updateLog.sale_updates.subtotal = {
          from: sale.subtotal,
          to: remainingTotal,
        };
      }
    }

    // Auto-sync returns to inventory
    if (returnResults.some((r) => r.status === "success")) {
      warehouseManager
        // @ts-ignore
        .syncStockChangesToInventory(warehouse.id)
        .then(async (syncResult) => {
          if (syncResult.success && syncResult.syncedCount > 0) {
            await saleRepo.update(sale_id, {
              inventory_synced: true,
              inventory_sync_date: new Date(),
              updated_at: new Date(),
            });
          }
        })
        .catch((error) => {
          console.error("Return sync failed:", error);
        });
    }

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["items"],
    });

    // Log audit
    await log_audit("update", "Sale", sale_id, _userId, {
      action: return_items.length > 0 ? "process_returns" : "update_sale",
      updates_applied: Object.keys(updateLog.sale_updates).length,
      returns_processed: updateLog.returns_processed.length,
      warehouse: warehouse.name,
      return_results: returnResults,
    });

    return {
      status: true,
      message:
        return_items.length > 0
          ? "Returns processed successfully"
          : "Sale updated successfully",
      data: {
        sale: updatedSale,
        update_summary: {
          sale_fields_updated: Object.keys(updateLog.sale_updates),
          returns_processed: updateLog.returns_processed.map((r) => ({
            // @ts-ignore
            item_id: r.item_id,

            // @ts-ignore
            quantity: r.quantity,

            // @ts-ignore
            reason: r.reason,
          })),
          return_results: returnResults,
        },
        warehouse: warehouse,
      },
    };
  } catch (error) {
    console.error("updateSale error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "update",

      // @ts-ignore
      error: error.message,

      // @ts-ignore
      stack: error.stack,
    });

    return {
      status: false,

      // @ts-ignore
      message: `Failed to update sale: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateSale;
