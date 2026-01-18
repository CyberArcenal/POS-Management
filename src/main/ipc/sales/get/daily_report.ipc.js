// sales/get/daily_report.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} date
 * @param {Object} filters
 * @param {number} userId
 */
// @ts-ignore
async function getDailySalesReport(date = null, filters = {}, userId) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const saleRepo = AppDataSource.getRepository(Sale);

    // Base query for the day
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("sale.datetime >= :start_date AND sale.datetime < :end_date", {
        start_date: targetDate,
        end_date: nextDate,
      })
      .andWhere("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "ASC");

    // Apply additional filters
    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("sale.user_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id,
      });
    }

    // @ts-ignore
    if (filters.payment_method) {
      queryBuilder.andWhere("sale.payment_method = :payment_method", {
        // @ts-ignore
        payment_method: filters.payment_method,
      });
    }

    const sales = await queryBuilder.getMany();

    // Calculate hourly breakdown
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      sales_count: 0,
      total_amount: 0,
    }));

    sales.forEach(sale => {
      // @ts-ignore
      const saleHour = new Date(sale.datetime).getHours();
      hourlyBreakdown[saleHour].sales_count++;
      // @ts-ignore
      hourlyBreakdown[saleHour].total_amount += sale.total;
    });

    // Calculate product breakdown
    const productBreakdown = {};
    const categoryBreakdown = {};
    
    sales.forEach(sale => {
      // @ts-ignore
      sale.items?.forEach(item => {
        // Product breakdown
        const productName = item.product?.name || `Product ${item.product_id}`;
        // @ts-ignore
        if (!productBreakdown[productName]) {
          // @ts-ignore
          productBreakdown[productName] = {
            quantity: 0,
            revenue: 0,
            product_id: item.product_id,
          };
        }
        // @ts-ignore
        productBreakdown[productName].quantity += item.quantity;
        // @ts-ignore
        productBreakdown[productName].revenue += item.total_price;

        // Category breakdown (if available)
        const category = item.product?.category_name || 'Uncategorized';
        // @ts-ignore
        if (!categoryBreakdown[category]) {
          // @ts-ignore
          categoryBreakdown[category] = {
            quantity: 0,
            revenue: 0,
            products: new Set(),
          };
        }
        // @ts-ignore
        categoryBreakdown[category].quantity += item.quantity;
        // @ts-ignore
        categoryBreakdown[category].revenue += item.total_price;
        // @ts-ignore
        categoryBreakdown[category].products.add(productName);
      });
    });

    // Convert Sets to counts
    Object.keys(categoryBreakdown).forEach(category => {
      // @ts-ignore
      categoryBreakdown[category].unique_products = categoryBreakdown[category].products.size;
      // @ts-ignore
      delete categoryBreakdown[category].products;
    });

    // Calculate summary statistics
    const summary = {
      total_sales: sales.length,
      // @ts-ignore
      total_revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      total_items: sales.reduce((sum, sale) => 
        // @ts-ignore
        sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0),
      // @ts-ignore
      average_sale_value: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      average_items_per_sale: sales.length > 0 ? 
        // @ts-ignore
        sales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0) / sales.length : 0,
      peak_hour: hourlyBreakdown.reduce((max, hourData, index) => 
        hourData.sales_count > max.sales_count ? { ...hourData, hour: index } : max, 
        { sales_count: 0, total_amount: 0, hour: 0 }
      ).hour,
    };

    // Calculate payment method distribution
    const paymentDistribution = {};
    sales.forEach(sale => {
      // @ts-ignore
      const method = sale.payment_method || 'unknown';
      // @ts-ignore
      paymentDistribution[method] = (paymentDistribution[method] || 0) + 1;
    });

    await log_audit("daily_report", "Sale", 0, userId, {
      date: targetDate.toISOString().split('T')[0],
      total_sales: summary.total_sales,
      total_revenue: summary.total_revenue,
    });

    return {
      status: true,
      message: `Daily sales report for ${targetDate.toISOString().split('T')[0]} generated successfully`,
      data: {
        date: targetDate.toISOString().split('T')[0],
        sales,
        summary,
        hourly_breakdown: hourlyBreakdown,
        product_breakdown: productBreakdown,
        category_breakdown: categoryBreakdown,
        payment_distribution: paymentDistribution,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getDailySalesReport error:", error);

    await log_audit("error", "Sale", 0, userId, {
      date,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate daily sales report: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getDailySalesReport;