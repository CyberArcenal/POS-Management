// sales_items/get/by_date_range.ipc.js
//@ts-check
const SaleItem = require("../../../../entities/SaleItem");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {Object} filters
 * @param {number} userId
 */
async function getSaleItemsByDateRange(startDate, endDate, filters = {}, userId) {
  try {
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Start date and end date are required",
        data: null,
      };
    }

    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    const queryBuilder = saleItemRepo
      .createQueryBuilder("sale_item")
      .leftJoinAndSelect("sale_item.sale", "sale")
      .leftJoinAndSelect("sale_item.product", "product")
      .where("sale.datetime BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .andWhere("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("sale_item.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id,
      });
    }

    // @ts-ignore
    if (filters.category_name) {
      queryBuilder.andWhere("product.category_name = :category_name", {
        // @ts-ignore
        category_name: filters.category_name,
      });
    }

    // @ts-ignore
    if (filters.min_quantity) {
      queryBuilder.andWhere("sale_item.quantity >= :min_quantity", {
        // @ts-ignore
        min_quantity: filters.min_quantity,
      });
    }

    // @ts-ignore
    if (filters.max_quantity) {
      queryBuilder.andWhere("sale_item.quantity <= :max_quantity", {
        // @ts-ignore
        max_quantity: filters.max_quantity,
      });
    }

    // @ts-ignore
    if (filters.returned_only) {
      queryBuilder.andWhere("sale_item.is_returned = :is_returned", {
        is_returned: true,
      });
    }

    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
    }

    const saleItems = await queryBuilder.getMany();

    // Calculate summary statistics
    const summary = {
      total_items: saleItems.length,
      // @ts-ignore
      total_quantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
      // @ts-ignore
      total_revenue: saleItems.reduce((sum, item) => sum + item.total_price, 0),
      // @ts-ignore
      total_discount: saleItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
      // @ts-ignore
      total_profit: saleItems.reduce((sum, item) => sum + (item.profit || 0), 0),
      // @ts-ignore
      returned_quantity: saleItems.reduce((sum, item) => sum + item.returned_quantity, 0),
      returned_items: saleItems.filter(item => item.is_returned).length,
      average_price: saleItems.length > 0 ? 
        // @ts-ignore
        saleItems.reduce((sum, item) => sum + item.unit_price, 0) / saleItems.length : 0,
    };

    // Group by product for top sellers
    const productSales = {};
    saleItems.forEach(item => {
      // @ts-ignore
      if (item.product) {
        const productId = item.product_id;
        // @ts-ignore
        if (!productSales[productId]) {
          // @ts-ignore
          productSales[productId] = {
            product_id: productId,
            // @ts-ignore
            product_name: item.product.name,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        // @ts-ignore
        productSales[productId].quantity += item.quantity;
        // @ts-ignore
        productSales[productId].revenue += item.total_price;
        // @ts-ignore
        productSales[productId].profit += (item.profit || 0);
      }
    });

    // Get top 10 products
    // @ts-ignore
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Group by date for daily trend
    const dailySales = {};
    saleItems.forEach(item => {
      // @ts-ignore
      if (item.sale && item.sale.datetime) {
        // @ts-ignore
        const date = new Date(item.sale.datetime).toISOString().split('T')[0];
        // @ts-ignore
        if (!dailySales[date]) {
          // @ts-ignore
          dailySales[date] = {
            date,
            items: 0,
            quantity: 0,
            revenue: 0,
          };
        }
        // @ts-ignore
        dailySales[date].items++;
        // @ts-ignore
        dailySales[date].quantity += item.quantity;
        // @ts-ignore
        dailySales[date].revenue += item.total_price;
      }
    });

    const dailyTrend = Object.values(dailySales).sort((a, b) => 
      // @ts-ignore
      new Date(a.date) - new Date(b.date)
    );

    await log_audit("fetch_by_date_range", "SaleItem", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      items_count: saleItems.length,
      total_revenue: summary.total_revenue,
    });

    return {
      status: true,
      message: "Sale items retrieved by date range successfully",
      data: {
        items: saleItems,
        summary,
        date_range: {
          start: startDate,
          end: endDate,
          // @ts-ignore
          days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
        },
        // @ts-ignore
        top_products,
        daily_trend: dailyTrend,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getSaleItemsByDateRange error:", error);

    await log_audit("error", "SaleItem", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sale items by date range: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSaleItemsByDateRange;