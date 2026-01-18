// sales/refund.ipc.js
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
async function processRefund(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    items = [], // Array of { item_id, quantity, reason }
    // @ts-ignore
    partial = false,
    // @ts-ignore
    refund_amount = 0,
    // @ts-ignore
    reason = "",
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

    // Check if sale can be refunded
    if (sale.status === 'cancelled') {
      return {
        status: false,
        message: "Cannot refund a cancelled sale",
        data: null,
      };
    }

    if (sale.status === 'refunded' && !partial) {
      return {
        status: false,
        message: "Sale is already fully refunded",
        data: null,
      };
    }

    const refundDetails = {
      items_refunded: [],
      total_refund_amount: 0,
      stock_restored: [],
    };

    // Process refund for specific items if provided
    if (items.length > 0) {
      for (const refundItem of items) {
        // @ts-ignore
        const saleItem = sale.items.find(item => item.id === refundItem.item_id);
        
        if (!saleItem) {
          continue;
        }

        // Validate refund quantity
        const maxRefundable = saleItem.quantity - saleItem.returned_quantity;
        if (refundItem.quantity > maxRefundable) {
          return {
            status: false,
            message: `Cannot refund ${refundItem.quantity} items. Maximum refundable for item ${saleItem.id} is ${maxRefundable}`,
            data: null,
          };
        }

        // Calculate refund amount for this item
        const itemRefundAmount = (saleItem.unit_price * refundItem.quantity) - 
                                 (saleItem.discount_amount * (refundItem.quantity / saleItem.quantity));
        
        refundDetails.total_refund_amount += itemRefundAmount;
        // @ts-ignore
        refundDetails.items_refunded.push({
          item_id: saleItem.id,
          product_id: saleItem.product_id,
          quantity: refundItem.quantity,
          refund_amount: itemRefundAmount,
          reason: refundItem.reason,
        });

        // Update sale item
        const newReturnedQuantity = saleItem.returned_quantity + refundItem.quantity;
        const isFullyReturned = newReturnedQuantity === saleItem.quantity;
        
        await saleItemRepo.update(saleItem.id, {
          returned_quantity: newReturnedQuantity,
          is_returned: isFullyReturned,
          return_reason: refundItem.reason,
          updated_at: new Date(),
        });

        // Restore stock if product exists
        if (saleItem.product) {
          const product = await productRepo.findOne({
            where: { id: saleItem.product_id }
          });

          if (product) {
            const newStock = product.stock + refundItem.quantity;
            await productRepo.update(saleItem.product_id, {
              stock: newStock,
              updated_at: new Date(),
            });

            // Log inventory transaction
            const inventoryLog = inventoryLogRepo.create({
              product_id: saleItem.product_id.toString(),
              action: InventoryAction.RETURN,
              change_amount: refundItem.quantity,
              quantity_before: product.stock,
              quantity_after: newStock,
              price_before: product.price,
              price_after: product.price,
              reference_id: sale_id.toString(),
              reference_type: "refund",
              performed_by_id: _userId.toString(),
              notes: `Refund: ${refundItem.reason || reason || 'No reason provided'}`,
            });

            await inventoryLogRepo.save(inventoryLog);
            
            // @ts-ignore
            refundDetails.stock_restored.push({
              product_id: saleItem.product_id,
              product_name: product.name,
              quantity: refundItem.quantity,
              new_stock: newStock,
            });
          }
        }
      }

      // Check if all items are now fully returned
      const allItems = await saleItemRepo.find({ where: { sale_id } });
      const allFullyReturned = allItems.every(item => item.is_returned);
      
      if (allFullyReturned) {
        await saleRepo.update(sale_id, {
          status: 'refunded',
          // @ts-ignore
          refund_amount: sale.total,
          refunded_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        await saleRepo.update(sale_id, {
          // @ts-ignore
          refund_amount: refundDetails.total_refund_amount,
          updated_at: new Date(),
        });
      }
    } 
    // Process full refund
    else if (!partial) {
      // @ts-ignore
      refundDetails.total_refund_amount = sale.total;
      
      // Restore stock for all items
      // @ts-ignore
      for (const saleItem of sale.items) {
        if (saleItem.product && saleItem.quantity > 0) {
          const product = await productRepo.findOne({
            where: { id: saleItem.product_id }
          });

          if (product) {
            const newStock = product.stock + saleItem.quantity;
            await productRepo.update(saleItem.product_id, {
              stock: newStock,
              updated_at: new Date(),
            });

            // Log inventory transaction
            const inventoryLog = inventoryLogRepo.create({
              product_id: saleItem.product_id.toString(),
              action: InventoryAction.RETURN,
              change_amount: saleItem.quantity,
              quantity_before: product.stock,
              quantity_after: newStock,
              price_before: product.price,
              price_after: product.price,
              reference_id: sale_id.toString(),
              reference_type: "refund",
              performed_by_id: _userId.toString(),
              notes: `Full refund: ${reason || 'No reason provided'}`,
            });

            await inventoryLogRepo.save(inventoryLog);

            // @ts-ignore
            refundDetails.stock_restored.push({
              product_id: saleItem.product_id,
              product_name: product.name,
              quantity: saleItem.quantity,
              new_stock: newStock,
            });
          }
        }

        // Update sale item
        await saleItemRepo.update(saleItem.id, {
          returned_quantity: saleItem.quantity,
          is_returned: true,
          return_reason: reason,
          updated_at: new Date(),
        });

        // @ts-ignore
        refundDetails.items_refunded.push({
          item_id: saleItem.id,
          product_id: saleItem.product_id,
          quantity: saleItem.quantity,
          refund_amount: saleItem.total_price,
          reason: reason,
        });
      }

      // Update sale status
      await saleRepo.update(sale_id, {
        status: 'refunded',
        // @ts-ignore
        refund_amount: sale.total,
        refunded_at: new Date(),
        updated_at: new Date(),
      });
    }

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["user", "items"],
    });

    // Log audit
    await log_audit("refund", "Sale", sale_id, _userId, {
      partial,
      reason,
      refund_amount: refundDetails.total_refund_amount,
      items_count: refundDetails.items_refunded.length,
      previous_status: sale.status,
    });

    return {
      status: true,
      message: partial ? "Partial refund processed successfully" : "Full refund processed successfully",
      data: {
        sale: updatedSale,
        refund_details: refundDetails,
        summary: {
          total_refunded: refundDetails.total_refund_amount,
          items_refunded: refundDetails.items_refunded.length,
          stock_restored: refundDetails.stock_restored.length,
          is_full_refund: !partial && items.length === 0,
        },
      },
    };
  } catch (error) {
    console.error("processRefund error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "refund",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to process refund: ${error.message}`,
      data: null,
    };
  }
}

module.exports = processRefund;