// sales/get/monthly_report.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} year
 * @param {number} month
 * @param {Object} filters
 * @param {number} userId
 */
// @ts-ignore
async function getMonthlySalesReport(year = null, month = null, filters = {}, userId) {
  try {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month !== null ? month : currentDate.getMonth() + 1;

    // Validate month
    if (targetMonth < 1 || targetMonth > 12) {
      return {
        status: false,
        message: "Month must be between 1 and 12",
        data: null,
      };
    }

    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const saleRepo = AppDataSource.getRepository(Sale);

    // Base query for the month
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("sale.datetime >= :start_date AND sale.datetime <= :end_date", {
        start_date: startDate,
        end_date: endDate,
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

    // Calculate daily breakdown
    const daysInMonth = endDate.getDate();
    const dailyBreakdown = Array.from({ length: daysInMonth }, (_, day) => ({
      day: day + 1,
      date: new Date(targetYear, targetMonth - 1, day + 1).toISOString().split('T')[0],
      sales_count: 0,
      total_amount: 0,
      items_count: 0,
    }));

    sales.forEach(sale => {
      // @ts-ignore
      const saleDay = new Date(sale.datetime).getDate() - 1;
      dailyBreakdown[saleDay].sales_count++;
      // @ts-ignore
      dailyBreakdown[saleDay].total_amount += sale.total;
      // @ts-ignore
      dailyBreakdown[saleDay].items_count += sale.items?.length || 0;
    });

    // Calculate weekly breakdown
    const weeklyBreakdown = [
      { week: 1, days: '1-7', sales_count: 0, total_amount: 0 },
      { week: 2, days: '8-14', sales_count: 0, total_amount: 0 },
      { week: 3, days: '15-21', sales_count: 0, total_amount: 0 },
      { week: 4, days: '22-28', sales_count: 0, total_amount: 0 },
      { week: 5, days: '29-31', sales_count: 0, total_amount: 0 },
    ];

    sales.forEach(sale => {
      // @ts-ignore
      const saleDay = new Date(sale.datetime).getDate();
      let weekIndex = Math.floor((saleDay - 1) / 7);
      if (weekIndex > 4) weekIndex = 4;
      
      weeklyBreakdown[weekIndex].sales_count++;
      // @ts-ignore
      weeklyBreakdown[weekIndex].total_amount += sale.total;
    });

    // Calculate product performance for the month
    const productPerformance = {};
    const categoryPerformance = {};
    
    sales.forEach(sale => {
      // @ts-ignore
      sale.items?.forEach(item => {
        // Product performance
        const productName = item.product?.name || `Product ${item.product_id}`;
        // @ts-ignore
        if (!productPerformance[productName]) {
          // @ts-ignore
          productPerformance[productName] = {
            product_id: item.product_id,
            quantity_sold: 0,
            revenue_generated: 0,
            sale_days: new Set(),
          };
        }
        // @ts-ignore
        productPerformance[productName].quantity_sold += item.quantity;
        // @ts-ignore
        productPerformance[productName].revenue_generated += item.total_price;
        // @ts-ignore
        productPerformance[productName].sale_days.add(new Date(sale.datetime).getDate());

        // Category performance
        const category = item.product?.category_name || 'Uncategorized';
        // @ts-ignore
        if (!categoryPerformance[category]) {
          // @ts-ignore
          categoryPerformance[category] = {
            quantity_sold: 0,
            revenue_generated: 0,
            unique_products: new Set(),
          };
        }
        // @ts-ignore
        categoryPerformance[category].quantity_sold += item.quantity;
        // @ts-ignore
        categoryPerformance[category].revenue_generated += item.total_price;
        // @ts-ignore
        categoryPerformance[category].unique_products.add(productName);
      });
    });

    // Convert Sets to counts/arrays
    Object.keys(productPerformance).forEach(productName => {
      // @ts-ignore
      productPerformance[productName].sale_days_count = productPerformance[productName].sale_days.size;
      // @ts-ignore
      productPerformance[productName].sale_days = Array.from(productPerformance[productName].sale_days).sort((a, b) => a - b);
    });

    Object.keys(categoryPerformance).forEach(category => {
      // @ts-ignore
      categoryPerformance[category].unique_products_count = categoryPerformance[category].unique_products.size;
      // @ts-ignore
      delete categoryPerformance[category].unique_products;
    });

    // Calculate summary statistics
    const summary = {
      month: targetMonth,
      year: targetYear,
      total_sales: sales.length,
      // @ts-ignore
      total_revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      total_items_sold: sales.reduce((sum, sale) => 
        // @ts-ignore
        sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0),
      average_daily_sales: sales.length / daysInMonth,
      // @ts-ignore
      average_daily_revenue: sales.reduce((sum, sale) => sum + sale.total, 0) / daysInMonth,
      best_selling_day: dailyBreakdown.reduce((max, day) => 
        day.total_amount > max.total_amount ? day : max, { total_amount: 0 }),
      worst_selling_day: dailyBreakdown.reduce((min, day) => 
        day.total_amount < min.total_amount && day.sales_count > 0 ? day : min, 
        { total_amount: Infinity, sales_count: 0 }),
      days_with_sales: dailyBreakdown.filter(day => day.sales_count > 0).length,
    };

    // Calculate user performance for the month
    const userPerformance = {};
    sales.forEach(sale => {
      // @ts-ignore
      const userName = sale.user?.username || `User ${sale.user_id}`;
      // @ts-ignore
      if (!userPerformance[userName]) {
        // @ts-ignore
        userPerformance[userName] = {
          // @ts-ignore
          user_id: sale.user_id,
          sales_count: 0,
          total_revenue: 0,
          average_sale_value: 0,
        };
      }
      // @ts-ignore
      userPerformance[userName].sales_count++;
      // @ts-ignore
      userPerformance[userName].total_revenue += sale.total;
    });

    // Calculate averages
    Object.keys(userPerformance).forEach(userName => {
      // @ts-ignore
      userPerformance[userName].average_sale_value = 
        // @ts-ignore
        userPerformance[userName].total_revenue / userPerformance[userName].sales_count;
    });

    // Top 5 products by revenue
    const topProductsByRevenue = Object.entries(productPerformance)
      .sort(([, a], [, b]) => b.revenue_generated - a.revenue_generated)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    await log_audit("monthly_report", "Sale", 0, userId, {
      year: targetYear,
      month: targetMonth,
      total_sales: summary.total_sales,
      total_revenue: summary.total_revenue,
    });

    return {
      status: true,
      message: `Monthly sales report for ${targetMonth}/${targetYear} generated successfully`,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          month_name: startDate.toLocaleString('default', { month: 'long' }),
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days_in_month: daysInMonth,
        },
        sales,
        summary,
        daily_breakdown: dailyBreakdown,
        weekly_breakdown: weeklyBreakdown,
        product_performance: productPerformance,
        category_performance: categoryPerformance,
        user_performance: userPerformance,
        top_products_by_revenue: topProductsByRevenue,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getMonthlySalesReport error:", error);

    await log_audit("error", "Sale", 0, userId, {
      year,
      month,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate monthly sales report: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getMonthlySalesReport;