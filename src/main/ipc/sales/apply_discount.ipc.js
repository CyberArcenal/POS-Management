// sales/apply_discount.ipc.js
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
async function applyDiscount(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    discount_type, // 'percentage' or 'fixed'
    // @ts-ignore
    discount_value,
    // @ts-ignore
    apply_to = 'total', // 'total' or 'items'
    // @ts-ignore
    item_discounts = [], // Array of { item_id, discount_value }
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

    if (!discount_type || discount_value === undefined) {
      return {
        status: false,
        message: "Discount type and value are required",
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
    if (sale.status !== 'completed' && sale.status !== 'pending') {
      return {
        status: false,
        message: `Cannot apply discount to a ${sale.status} sale`,
        data: null,
      };
    }

    const discountDetails = {
      type: discount_type,
      value: discount_value,
      apply_to,
      reason,
      previous_total: sale.total,
      // @ts-ignore
      previous_discount: sale.discount_amount || 0,
      item_updates: [],
    };

    let newTotal = sale.total;
    let totalDiscount = 0;

    // Apply discount to total
    if (apply_to === 'total') {
      let discountAmount = 0;
      
      if (discount_type === 'percentage') {
        // Validate percentage
        if (discount_value < 0 || discount_value > 100) {
          return {
            status: false,
            message: "Percentage discount must be between 0 and 100",
            data: null,
          };
        }
        // @ts-ignore
        discountAmount = (sale.subtotal * discount_value) / 100;
      } else if (discount_type === 'fixed') {
        // Validate fixed amount
        // @ts-ignore
        if (discount_value < 0 || discount_value > sale.subtotal) {
          return {
            status: false,
            // @ts-ignore
            message: `Fixed discount cannot exceed subtotal (₱${sale.subtotal})`,
            data: null,
          };
        }
        discountAmount = discount_value;
      }

      // Calculate new total
      // @ts-ignore
      newTotal = sale.subtotal - discountAmount + (sale.tax_amount || 0);
      totalDiscount = discountAmount;

      // Update sale
      await saleRepo.update(sale_id, {
        discount_amount: discountAmount,
        // @ts-ignore
        total: newTotal,
        discount_reason: reason,
        updated_at: new Date(),
      });
    }
    // Apply discount to specific items
    else if (apply_to === 'items' && item_discounts.length > 0) {
      for (const itemDiscount of item_discounts) {
        // @ts-ignore
        const saleItem = sale.items.find(item => item.id === itemDiscount.item_id);
        
        if (!saleItem) {
          continue;
        }

        let itemDiscountAmount = 0;
        let newItemTotal = saleItem.total_price;

        if (discount_type === 'percentage') {
          // Validate percentage
          if (itemDiscount.discount_value < 0 || itemDiscount.discount_value > 100) {
            return {
              status: false,
              message: `Percentage discount for item ${saleItem.id} must be between 0 and 100`,
              data: null,
            };
          }
          itemDiscountAmount = (saleItem.total_price * itemDiscount.discount_value) / 100;
        } else if (discount_type === 'fixed') {
          // Validate fixed amount
          if (itemDiscount.discount_value < 0 || itemDiscount.discount_value > saleItem.total_price) {
            return {
              status: false,
              message: `Fixed discount for item ${saleItem.id} cannot exceed item price (₱${saleItem.total_price})`,
              data: null,
            };
          }
          itemDiscountAmount = itemDiscount.discount_value;
        }

        newItemTotal = saleItem.total_price - itemDiscountAmount;
        totalDiscount += itemDiscountAmount;

        // Update sale item
        await saleItemRepo.update(saleItem.id, {
          discount_percentage: discount_type === 'percentage' ? itemDiscount.discount_value : 0,
          discount_amount: itemDiscountAmount,
          total_price: newItemTotal,
          price_before_discount: saleItem.total_price,
          updated_at: new Date(),
        });

        // @ts-ignore
        discountDetails.item_updates.push({
          item_id: saleItem.id,
          product_id: saleItem.product_id,
          previous_price: saleItem.total_price,
          new_price: newItemTotal,
          discount_amount: itemDiscountAmount,
          discount_reason: itemDiscount.reason || reason,
        });
      }

      // Recalculate sale total
      const allItems = await saleItemRepo.find({ where: { sale_id } });
      // @ts-ignore
      const itemsTotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
      
      // @ts-ignore
      newTotal = itemsTotal + (sale.tax_amount || 0);
      
      await saleRepo.update(sale_id, {
        discount_amount: totalDiscount,
        // @ts-ignore
        total: newTotal,
        discount_reason: reason,
        updated_at: new Date(),
      });
    }

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["items"],
    });

    // Log audit
    await log_audit("apply_discount", "Sale", sale_id, _userId, {
      discount_type,
      discount_value,
      apply_to,
      previous_total: sale.total,
      new_total: newTotal,
      discount_amount: totalDiscount,
      reason,
    });

    return {
      status: true,
      message: "Discount applied successfully",
      data: {
        sale: updatedSale,
        discount_details: discountDetails,
        summary: {
          discount_applied: totalDiscount,
          previous_total: sale.total,
          new_total: newTotal,
          // @ts-ignore
          savings_percentage: sale.total > 0 ? (totalDiscount / sale.total) * 100 : 0,
        },
      },
    };
  } catch (error) {
    console.error("applyDiscount error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "apply_discount",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to apply discount: ${error.message}`,
      data: null,
    };
  }
}

module.exports = applyDiscount;