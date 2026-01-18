//@ts-check
// @ts-ignore
const Product = require("../../../../entities/Product");
const SaleItem = require("../../../../entities/SaleItem");
// @ts-ignore
// @ts-ignore
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get sales report for a product
 * @param {number} productId
 * @param {Object} dateRange
 * @param {number} userId
 */
// @ts-ignore
async function getProductSalesReport(productId, dateRange, userId) {
  try {
    const saleItemRepo = AppDataSource.getRepository(SaleItem);
    
    const queryBuilder = saleItemRepo
      .createQueryBuilder("saleItem")
      .innerJoin("saleItem.sale", "sale")
      .innerJoin("saleItem.product", "product")
      .where("saleItem.product_id = :productId", { productId })
      .andWhere("sale.status = :status", { status: "completed" });

    // Apply date range if provided
    // @ts-ignore
    if (dateRange && dateRange.start && dateRange.end) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start AND :end", {
        // @ts-ignore
        start: dateRange.start,
        // @ts-ignore
        end: dateRange.end
      });
    }

    const salesData = await queryBuilder
      .select([
        "saleItem.id",
        "saleItem.quantity",
        "saleItem.unit_price",
        "saleItem.total_price",
        "saleItem.cost_price",
        "saleItem.profit",
        "saleItem.created_at",
        "sale.id",
        "sale.datetime",
        "sale.reference_number",
        "product.name",
        "product.sku",
        "product.category_name",
        "product.supplier_name"
      ])
      .orderBy("sale.datetime", "DESC")
      .getMany();

    // Calculate summary
    const summary = {
      // @ts-ignore
      totalQuantitySold: salesData.reduce((sum, item) => sum + item.quantity, 0),
      // @ts-ignore
      totalRevenue: salesData.reduce((sum, item) => sum + item.total_price, 0),
      // @ts-ignore
      totalCost: salesData.reduce((sum, item) => sum + ((item.cost_price || 0) * item.quantity), 0),
      // @ts-ignore
      totalProfit: salesData.reduce((sum, item) => sum + (item.profit || 0), 0),
      averagePrice: salesData.length > 0 
        // @ts-ignore
        ? salesData.reduce((sum, item) => sum + item.unit_price, 0) / salesData.length 
        : 0,
      numberOfSales: salesData.length
    };

    // Group by day for chart data
    const dailyData = salesData.reduce((acc, saleItem) => {
      // @ts-ignore
      const date = new Date(saleItem.created_at).toISOString().split('T')[0];
      // @ts-ignore
      if (!acc[date]) {
        // @ts-ignore
        acc[date] = {
          date,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          sales: 0
        };
      }
      // @ts-ignore
      acc[date].quantity += saleItem.quantity;
      // @ts-ignore
      acc[date].revenue += saleItem.total_price;
      // @ts-ignore
      acc[date].cost += (saleItem.cost_price || 0) * saleItem.quantity;
      // @ts-ignore
      acc[date].profit += (saleItem.profit || 0);
      // @ts-ignore
      acc[date].sales += 1;
      return acc;
    }, {});

    // Group by category (if multiple products with same category)
    const categoryData = salesData.reduce((acc, saleItem) => {
      // @ts-ignore
      const category = saleItem.product?.category_name || 'Uncategorized';
      // @ts-ignore
      if (!acc[category]) {
        // @ts-ignore
        acc[category] = {
          category,
          quantity: 0,
          revenue: 0,
          sales: 0
        };
      }
      // @ts-ignore
      acc[category].quantity += saleItem.quantity;
      // @ts-ignore
      acc[category].revenue += saleItem.total_price;
      // @ts-ignore
      acc[category].sales += 1;
      return acc;
    }, {});

    return {
      status: true,
      message: "Sales report generated",
      data: {
        sales: salesData,
        summary,
        chartData: Object.values(dailyData),
        categoryData: Object.values(categoryData),
        dateRange
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
}

module.exports = getProductSalesReport;