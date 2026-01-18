// sales_items/get/by_sale_id.ipc.js
//@ts-check
const SaleItem = require("../../../../entities/SaleItem");
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} saleId
 * @param {number} userId
 */
async function getSaleItemsBySaleId(saleId, userId) {
  try {
    if (!saleId) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    const saleItemRepo = AppDataSource.getRepository(SaleItem);
    const saleRepo = AppDataSource.getRepository(Sale);

    // Check if sale exists
    const sale = await saleRepo.findOne({
      where: { id: saleId }
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${saleId} not found`,
        data: null,
      };
    }

    // Get all sale items
    const saleItems = await saleItemRepo.find({
      where: { sale_id: saleId },
      relations: [
        "product",
        "variant",
      ],
      order: {
        id: "ASC",
      },
    });

    // Calculate summary
    const summary = {
      total_items: saleItems.length,
      // @ts-ignore
      total_quantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
      // @ts-ignore
      total_amount: saleItems.reduce((sum, item) => sum + item.total_price, 0),
      // @ts-ignore
      total_discount: saleItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
      // @ts-ignore
      total_profit: saleItems.reduce((sum, item) => sum + (item.profit || 0), 0),
      returned_items: saleItems.filter(item => item.is_returned).length,
      // @ts-ignore
      total_returned_quantity: saleItems.reduce((sum, item) => sum + item.returned_quantity, 0),
    };

    // Group items by category if available
    const categoryBreakdown = {};
    saleItems.forEach(item => {
      // @ts-ignore
      if (item.product) {
        // @ts-ignore
        const category = item.product.category_name || 'Uncategorized';
        // @ts-ignore
        if (!categoryBreakdown[category]) {
          // @ts-ignore
          categoryBreakdown[category] = {
            items: 0,
            quantity: 0,
            amount: 0,
            profit: 0,
          };
        }
        // @ts-ignore
        categoryBreakdown[category].items++;
        // @ts-ignore
        categoryBreakdown[category].quantity += item.quantity;
        // @ts-ignore
        categoryBreakdown[category].amount += item.total_price;
        // @ts-ignore
        categoryBreakdown[category].profit += (item.profit || 0);
      }
    });

    await log_audit("fetch_by_sale", "SaleItem", 0, userId, {
      sale_id: saleId,
      items_count: saleItems.length,
      total_amount: summary.total_amount,
    });

    return {
      status: true,
      message: "Sale items retrieved successfully",
      data: {
        sale_info: {
          id: sale.id,
          reference_number: sale.reference_number,
          status: sale.status,
          total: sale.total,
          datetime: sale.datetime,
        },
        items: saleItems,
        summary,
        category_breakdown: categoryBreakdown,
      },
    };
  } catch (error) {
    console.error("getSaleItemsBySaleId error:", error);

    await log_audit("error", "SaleItem", 0, userId, {
      sale_id: saleId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sale items: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSaleItemsBySaleId;