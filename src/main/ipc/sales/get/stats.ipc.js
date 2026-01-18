// sales/get/stats.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} dateRange
 * @param {Object} filters
 * @param {number} userId
 */
async function getSalesStats(dateRange = {}, filters = {}, userId) {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);

    // Build base query
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .where("sale.status = :status", { status: "completed" });

    // Apply date range
    // @ts-ignore
    if (dateRange.start_date && dateRange.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: dateRange.start_date,
        // @ts-ignore
        end_date: dateRange.end_date,
      });
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryBuilder.andWhere("sale.datetime >= :start_date", {
        start_date: thirtyDaysAgo,
      });
    }

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

    // Get all sales for detailed calculations
    const sales = await queryBuilder.getMany();

    if (sales.length === 0) {
      return {
        status: true,
        message: "No sales data found for the specified period",
        data: {
          summary: {
            total_sales: 0,
            total_revenue: 0,
            average_sale_value: 0,
            total_items_sold: 0,
            days_analyzed: 0,
          },
          trends: {},
          distributions: {},
          insights: [],
        },
      };
    }

    // Calculate basic statistics
    const totalSales = sales.length;
    // @ts-ignore
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageSaleValue = totalRevenue / totalSales;

    // Get daily sales for trend analysis
    const dailySales = {};
    sales.forEach(sale => {
      // @ts-ignore
      const date = new Date(sale.datetime).toISOString().split('T')[0];
      // @ts-ignore
      if (!dailySales[date]) {
        // @ts-ignore
        dailySales[date] = {
          sales_count: 0,
          total_revenue: 0,
          sales: [],
        };
      }
      // @ts-ignore
      dailySales[date].sales_count++;
      // @ts-ignore
      dailySales[date].total_revenue += sale.total;
      // @ts-ignore
      dailySales[date].sales.push(sale.id);
    });

    // Calculate trends
    const dates = Object.keys(dailySales).sort();
    // @ts-ignore
    const revenueTrend = dates.map(date => dailySales[date].total_revenue);
    // @ts-ignore
    const salesCountTrend = dates.map(date => dailySales[date].sales_count);

    // Calculate moving averages (7-day)
    const movingAverage = [];
    for (let i = 6; i < revenueTrend.length; i++) {
      const weekRevenue = revenueTrend.slice(i - 6, i + 1);
      movingAverage.push(weekRevenue.reduce((a, b) => a + b, 0) / 7);
    }

    // Calculate growth rates
    let revenueGrowth = 0;
    let salesGrowth = 0;
    if (dates.length >= 2) {
      const firstDay = dates[0];
      const lastDay = dates[dates.length - 1];
      // @ts-ignore
      revenueGrowth = ((dailySales[lastDay].total_revenue - dailySales[firstDay].total_revenue) / 
                      // @ts-ignore
                      dailySales[firstDay].total_revenue) * 100;
      // @ts-ignore
      salesGrowth = ((dailySales[lastDay].sales_count - dailySales[firstDay].sales_count) / 
                    // @ts-ignore
                    dailySales[firstDay].sales_count) * 100;
    }

    // Calculate hourly distribution
    const hourlyDistribution = Array(24).fill(0);
    sales.forEach(sale => {
      // @ts-ignore
      const hour = new Date(sale.datetime).getHours();
      hourlyDistribution[hour]++;
    });

    // Calculate day-of-week distribution
    const dayOfWeekDistribution = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, 
      Thursday: 0, Friday: 0, Saturday: 0
    };
    sales.forEach(sale => {
      // @ts-ignore
      const day = new Date(sale.datetime).toLocaleDateString('en-US', { weekday: 'long' });
      // @ts-ignore
      dayOfWeekDistribution[day]++;
    });

    // Calculate payment method distribution
    const paymentMethodDistribution = {};
    sales.forEach(sale => {
      // @ts-ignore
      const method = sale.payment_method || 'unknown';
      // @ts-ignore
      paymentMethodDistribution[method] = (paymentMethodDistribution[method] || 0) + 1;
    });

    // Calculate user performance ranking
    const userPerformance = {};
    sales.forEach(sale => {
      // @ts-ignore
      const userId = sale.user_id;
      // @ts-ignore
      if (!userPerformance[userId]) {
        // @ts-ignore
        userPerformance[userId] = {
          sales_count: 0,
          total_revenue: 0,
        };
      }
      // @ts-ignore
      userPerformance[userId].sales_count++;
      // @ts-ignore
      userPerformance[userId].total_revenue += sale.total;
    });

    // Convert to array and sort by revenue
    const topPerformers = Object.entries(userPerformance)
      .map(([userId, data]) => ({
        user_id: parseInt(userId),
        ...data,
        average_revenue: data.total_revenue / data.sales_count,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    // Generate insights
    const insights = [];
    
    // Peak hour insight
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    insights.push({
      type: 'peak_hour',
      message: `Peak sales hour is ${peakHour}:00 with ${hourlyDistribution[peakHour]} sales`,
      value: peakHour,
      importance: 'high',
    });

    // Best day insight
    const bestDay = Object.entries(dayOfWeekDistribution)
      .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 });
    insights.push({
      type: 'best_day',
      message: `${bestDay.day} is the best day for sales with ${bestDay.count} sales`,
      value: bestDay.day,
      importance: 'medium',
    });

    // Growth insight
    if (revenueGrowth > 0) {
      insights.push({
        type: 'positive_growth',
        message: `Revenue increased by ${revenueGrowth.toFixed(2)}% during this period`,
        value: revenueGrowth,
        importance: 'high',
      });
    } else if (revenueGrowth < 0) {
      insights.push({
        type: 'negative_growth',
        message: `Revenue decreased by ${Math.abs(revenueGrowth).toFixed(2)}% during this period`,
        value: revenueGrowth,
        importance: 'high',
      });
    }

    // Average sale value insight
    insights.push({
      type: 'average_sale',
      message: `Average sale value is ₱${averageSaleValue.toFixed(2)}`,
      value: averageSaleValue,
      importance: 'medium',
    });

    // Top performer insight
    if (topPerformers.length > 0) {
      insights.push({
        type: 'top_performer',
        message: `Top performer: User ${topPerformers[0].user_id} with ₱${topPerformers[0].total_revenue} revenue`,
        value: topPerformers[0].user_id,
        importance: 'medium',
      });
    }

    await log_audit("stats", "Sale", 0, userId, {
      date_range: dateRange,
      total_sales: totalSales,
      total_revenue: totalRevenue,
    });

    return {
      status: true,
      message: "Sales statistics calculated successfully",
      data: {
        summary: {
          total_sales: totalSales,
          total_revenue: totalRevenue,
          average_sale_value: averageSaleValue,
          period_days: dates.length,
          date_range: {
            start_date: dates[0],
            end_date: dates[dates.length - 1],
          },
        },
        trends: {
          revenue_trend: revenueTrend,
          sales_count_trend: salesCountTrend,
          moving_average: movingAverage,
          growth_rates: {
            revenue_growth: revenueGrowth,
            sales_growth: salesGrowth,
          },
          dates: dates,
        },
        distributions: {
          hourly: hourlyDistribution,
          day_of_week: dayOfWeekDistribution,
          payment_methods: paymentMethodDistribution,
        },
        performance: {
          top_performers: topPerformers,
          user_count: Object.keys(userPerformance).length,
        },
        insights: insights,
        raw_data: {
          sales_count: sales.length,
          sample_sales: sales.slice(0, 10).map(s => ({ id: s.id, total: s.total, datetime: s.datetime })),
        },
      },
    };
  } catch (error) {
    console.error("getSalesStats error:", error);

    await log_audit("error", "Sale", 0, userId, {
      date_range: dateRange,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to calculate sales statistics: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSalesStats;