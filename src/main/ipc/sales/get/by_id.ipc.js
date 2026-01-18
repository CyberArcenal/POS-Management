// sales/get/by_id.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
// @ts-ignore
const SaleItem = require("../../../../entities/SaleItem");
// @ts-ignore
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} saleId
 * @param {number} userId
 */
async function getSaleById(saleId, userId) {
  try {
    if (!saleId) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const sale = await saleRepo.findOne({
      where: { id: saleId },
      relations: [
        "user",
        "items",
        "items.product",
        "items.variant",
      ],
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${saleId} not found`,
        data: null,
      };
    }

    // Calculate item-level summary
    let itemSummary = {
      total_items: 0,
      total_quantity: 0,
      average_price: 0,
    };

    // @ts-ignore
    if (sale.items && sale.items.length > 0) {
      // @ts-ignore
      itemSummary.total_items = sale.items.length;
      // @ts-ignore
      itemSummary.total_quantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      // @ts-ignore
      itemSummary.average_price = sale.items.reduce((sum, item) => sum + item.unit_price, 0) / sale.items.length;
    }

    await log_audit("view", "Sale", saleId, userId, {
      sale_id: saleId,
      total: sale.total,
      status: sale.status,
    });

    return {
      status: true,
      message: "Sale fetched successfully",
      data: {
        sale,
        summary: itemSummary,
      },
    };
  } catch (error) {
    console.error("getSaleById error:", error);

    await log_audit("error", "Sale", saleId, userId, {
      sale_id: saleId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch sale: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSaleById;