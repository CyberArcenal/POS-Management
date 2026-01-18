// sales_items/get/by_id.ipc.js
//@ts-check
const SaleItem = require("../../../../entities/SaleItem");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} id
 * @param {number} userId
 */
async function getSaleItemById(id, userId) {
  try {
    if (!id) {
      return {
        status: false,
        message: "Sale Item ID is required",
        data: null,
      };
    }

    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    const saleItem = await saleItemRepo.findOne({
      where: { id },
      relations: [
        "sale",
        "product",
        "variant",
        "stock_item",
      ],
    });

    if (!saleItem) {
      return {
        status: false,
        message: `Sale item with ID ${id} not found`,
        data: null,
      };
    }

    // Calculate profitability metrics
    const profitability = {
      // @ts-ignore
      profit_percentage: saleItem.cost_price > 0 ? 
        // @ts-ignore
        ((saleItem.profit || 0) / (saleItem.cost_price * saleItem.quantity)) * 100 : 0,
      // @ts-ignore
      profit_per_unit: saleItem.quantity > 0 ? (saleItem.profit || 0) / saleItem.quantity : 0,
    };

    await log_audit("view", "SaleItem", id, userId, {
      sale_id: saleItem.sale_id,
      product_id: saleItem.product_id,
      total_price: saleItem.total_price,
    });

    return {
      status: true,
      message: "Sale item retrieved successfully",
      data: {
        sale_item: saleItem,
        profitability,
        item_summary: {
          quantity: saleItem.quantity,
          unit_price: saleItem.unit_price,
          discount: saleItem.discount_amount,
          total: saleItem.total_price,
          cost_price: saleItem.cost_price,
          profit: saleItem.profit,
          returned_quantity: saleItem.returned_quantity,
          is_returned: saleItem.is_returned,
        },
      },
    };
  } catch (error) {
    console.error("getSaleItemById error:", error);

    await log_audit("error", "SaleItem", id, userId, {
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sale item: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSaleItemById;