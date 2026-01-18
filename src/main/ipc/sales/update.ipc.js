// sales/update.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const SaleItem = require("../../../entities/SaleItem");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateSale(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    updates = {}, // Fields to update
    // @ts-ignore
    item_updates = [], // Array of { item_id, updates }
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

    if (Object.keys(updates).length === 0 && item_updates.length === 0) {
      return {
        status: false,
        message: "No updates provided",
        data: null,
      };
    }

    const saleRepo = queryRunner.manager.getRepository(Sale);
    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);

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

    // Check if sale can be modified
    if (sale.status !== 'pending' && sale.status !== 'processing') {
      return {
        status: false,
        message: `Cannot update a ${sale.status} sale. Only pending or processing sales can be modified.`,
        data: null,
      };
    }

    const updateLog = {
      sale_updates: {},
      item_updates: [],
      previous_state: {
        status: sale.status,
        total: sale.total,
        // @ts-ignore
        items_count: sale.items?.length || 0,
      },
    };

    // Update sale fields
    const allowedSaleUpdates = [
      'customer_name', 'customer_phone', 'customer_email',
      'notes', 'payment_method', 'status',
    ];

    const saleUpdates = {};
    Object.keys(updates).forEach(key => {
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

    // Update sale items
    const itemUpdateResults = [];
    if (item_updates.length > 0) {
      for (const itemUpdate of item_updates) {
        // @ts-ignore
        const saleItem = sale.items.find((/** @type {{ id: any; }} */ item) => item.id === itemUpdate.item_id);
        
        if (!saleItem) {
          itemUpdateResults.push({
            item_id: itemUpdate.item_id,
            status: 'failed',
            message: 'Item not found in sale',
          });
          continue;
        }

        const allowedItemUpdates = [
          'quantity', 'unit_price', 'discount_percentage', 'discount_amount',
          'notes', 'variant_id',
        ];

        const itemUpdates = {};
        Object.keys(itemUpdate.updates).forEach(key => {
          if (allowedItemUpdates.includes(key) && itemUpdate.updates[key] !== saleItem[key]) {
            // @ts-ignore
            itemUpdates[key] = itemUpdate.updates[key];
          }
        });

        if (Object.keys(itemUpdates).length > 0) {
          // Recalculate total price if quantity or unit price changed
          // @ts-ignore
          if (itemUpdates.quantity !== undefined || itemUpdates.unit_price !== undefined) {
            // @ts-ignore
            const newQuantity = itemUpdates.quantity || saleItem.quantity;
            // @ts-ignore
            const newUnitPrice = itemUpdates.unit_price || saleItem.unit_price;
            // @ts-ignore
            const discountAmount = itemUpdates.discount_amount || saleItem.discount_amount || 0;
            
            // @ts-ignore
            itemUpdates.total_price = (newQuantity * newUnitPrice) - discountAmount;
          }

          // @ts-ignore
          itemUpdates.updated_at = new Date();
          await saleItemRepo.update(itemUpdate.item_id, itemUpdates);

          // @ts-ignore
          updateLog.item_updates.push({
            item_id: itemUpdate.item_id,
            product_id: saleItem.product_id,
            updates: itemUpdates,
          });

          itemUpdateResults.push({
            item_id: itemUpdate.item_id,
            status: 'success',
            message: 'Item updated successfully',
          });
        } else {
          itemUpdateResults.push({
            item_id: itemUpdate.item_id,
            status: 'no_changes',
            message: 'No valid changes to apply',
          });
        }
      }

      // Recalculate sale total if items were updated
      if (updateLog.item_updates.length > 0) {
        const allItems = await saleItemRepo.find({ where: { sale_id } });
        // @ts-ignore
        const itemsTotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
        // @ts-ignore
        const newTotal = itemsTotal + (sale.tax_amount || 0) - (sale.discount_amount || 0);
        
        await saleRepo.update(sale_id, {
          total: newTotal,
          updated_at: new Date(),
        });
        
        // @ts-ignore
        updateLog.sale_updates.total = {
          from: sale.total,
          to: newTotal,
        };
      }
    }

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["user", "items"],
    });

    // Log audit
    await log_audit("update", "Sale", sale_id, _userId, {
      updates_applied: Object.keys(updateLog.sale_updates).length,
      items_updated: updateLog.item_updates.length,
      previous_total: sale.total,
      // @ts-ignore
      new_total: updatedSale.total,
    });

    return {
      status: true,
      message: "Sale updated successfully",
      data: {
        sale: updatedSale,
        update_summary: {
          sale_fields_updated: Object.keys(updateLog.sale_updates),
          // @ts-ignore
          items_updated: updateLog.item_updates.map(u => u.item_id),
          item_update_results: itemUpdateResults,
          total_changes: Object.keys(updateLog.sale_updates).length + updateLog.item_updates.length,
        },
        update_log: updateLog,
      },
    };
  } catch (error) {
    console.error("updateSale error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "update",
      // @ts-ignore
      error: error.message,
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