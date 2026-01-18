// sales_items/get/by_product_id.ipc.js
//@ts-check
const SaleItem = require("../../../../entities/SaleItem");
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} productId
 * @param {Object} filters
 * @param {number} userId
 */
async function getSaleItemsByProductId(productId, filters = {}, userId) {
  try {
    if (!productId) {
      return {
        status: false,
        message: "Product ID is required",
        data: null,
      };
    }

    // Check if product exists
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: productId, is_deleted: false }
    });

    if (!product) {
      return {
        status: false,
        message: `Product with ID ${productId} not found`,
        data: null,
      };
    }

    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    const queryBuilder = saleItemRepo
      .createQueryBuilder("sale_item")
      .leftJoinAndSelect("sale_item.sale", "sale")
      .leftJoinAndSelect("sale_item.product", "product")
      .where("sale_item.product_id = :product_id", { product_id: productId })
      .andWhere("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "DESC");

    // Apply date filters
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
    }

    const saleItems = await queryBuilder.getMany();

    if (saleItems.length === 0) {
      return {
        status: true,
        message: `No sales found for product: ${product.name}`,
        data: {
          product_info: product,
          items: [],
          summary: {
            total_sales: 0,
            total_quantity: 0,
            total_revenue: 0,
            average_price: 0,
          },
        },
      };
    }

    // Calculate summary statistics
    const summary = {
      total_sales: saleItems.length,
      // @ts-ignore
      total_quantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
      // @ts-ignore
      total_revenue: saleItems.reduce((sum, item) => sum + item.total_price, 0),
      // @ts-ignore
      total_discount: saleItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
      // @ts-ignore
      total_profit: saleItems.reduce((sum, item) => sum + (item.profit || 0), 0),
      // @ts-ignore
      average_price: saleItems.reduce((sum, item) => sum + item.unit_price, 0) / saleItems.length,
      // @ts-ignore
      average_quantity_per_sale: saleItems.reduce((sum, item) => sum + item.quantity, 0) / saleItems.length,
    };

    // Calculate monthly sales trend
    const monthlySales = {};
    saleItems.forEach(item => {
      // @ts-ignore
      if (item.sale && item.sale.datetime) {
        // @ts-ignore
        const month = new Date(item.sale.datetime).toISOString().slice(0, 7); // YYYY-MM
        // @ts-ignore
        if (!monthlySales[month]) {
          // @ts-ignore
          monthlySales[month] = {
            quantity: 0,
            revenue: 0,
            sales_count: 0,
          };
        }
        // @ts-ignore
        monthlySales[month].quantity += item.quantity;
        // @ts-ignore
        monthlySales[month].revenue += item.total_price;
        // @ts-ignore
        monthlySales[month].sales_count++;
      }
    });

    // Get recent sales (last 10)
    const recentSales = saleItems.slice(0, 10).map(item => ({
      id: item.id,
      sale_id: item.sale_id,
      // @ts-ignore
      sale_date: item.sale?.datetime,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      discount: item.discount_amount,
      profit: item.profit,
    }));

    await log_audit("fetch_by_product", "SaleItem", 0, userId, {
      product_id: productId,
      product_name: product.name,
      items_count: saleItems.length,
      total_quantity: summary.total_quantity,
      total_revenue: summary.total_revenue,
    });

    return {
      status: true,
      message: `Sales history for ${product.name} retrieved successfully`,
      data: {
        product_info: product,
        items: saleItems,
        summary,
        monthly_trend: monthlySales,
        recent_sales: recentSales,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getSaleItemsByProductId error:", error);

    await log_audit("error", "SaleItem", 0, userId, {
      product_id: productId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sale items by product: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSaleItemsByProductId;