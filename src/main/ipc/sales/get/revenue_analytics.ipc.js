// sales/get/revenue_analytics.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} period // 'daily', 'weekly', 'monthly', 'yearly'
 * @param {Object} filters
 * @param {number} userId
 */
async function getRevenueAnalytics(period = 'monthly', filters = {}, userId) {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .where("sale.status = :status", { status: "completed" });

    // Apply date filters
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    } else {
      // Default periods
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(now.getDate() - 7); // Last 7 days
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 30); // Last 30 days
          break;
        case 'monthly':
          startDate.setFullYear(now.getFullYear() - 1); // Last 12 months
          break;
        case 'yearly':
          startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
          break;
        default:
          startDate.setDate(now.getDate() - 30); // Default to last 30 days
      }
      
      queryBuilder.andWhere("sale.datetime >= :start_date", {
        start_date: startDate,
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

    const sales = await queryBuilder.getMany();

    if (sales.length === 0) {
      return {
        status: true,
        message: "No sales data available for analytics",
        data: {
          period,
          summary: {
            total_sales: 0,
            total_revenue: 0,
            average_sale: 0,
            date_range: null,
          },
          trends: [],
          comparisons: {},
          forecasts: [],
          insights: [],
        },
      };
    }

    // Group sales by period
    const groupedData = groupSalesByPeriod(sales, period);
    
    // Calculate trends
    const trends = calculateTrends(groupedData, period);
    
    // Calculate summary statistics
    const summary = calculateSummary(sales, period);
    
    // Generate comparisons
    const comparisons = generateComparisons(groupedData, period);
    
    // Generate forecasts
    const forecasts = generateForecasts(groupedData, period);
    
    // Generate insights
    const insights = generateAnalyticsInsights(groupedData, trends, summary, period);

    await log_audit("revenue_analytics", "Sale", 0, userId, {
      period,
      filters,
      sales_count: sales.length,
    });

    return {
      status: true,
      message: `Revenue analytics for ${period} period generated successfully`,
      data: {
        period,
        summary,
        trends,
        comparisons,
        forecasts,
        insights,
        raw_data: {
          total_records: sales.length,
          date_range: {
            // @ts-ignore
            start: new Date(Math.min(...sales.map(s => new Date(s.datetime)))),
            // @ts-ignore
            end: new Date(Math.max(...sales.map(s => new Date(s.datetime)))),
          },
          sample_data: groupedData.slice(0, 10),
        },
      },
    };
  } catch (error) {
    console.error("getRevenueAnalytics error:", error);

    await log_audit("error", "Sale", 0, userId, {
      period,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate revenue analytics: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Group sales by specified period
 * @param {any[]} sales
 * @param {string} period
 */
function groupSalesByPeriod(sales, period) {
  const groups = {};
  
  sales.forEach((/** @type {{ datetime: string | number | Date; total: any; id: any; }} */ sale) => {
    const date = new Date(sale.datetime);
    let key;
    
    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        const weekNumber = getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNumber}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    // @ts-ignore
    if (!groups[key]) {
      // @ts-ignore
      groups[key] = {
        period: key,
        sales_count: 0,
        total_revenue: 0,
        sales: [],
        average_sale: 0,
        date: date,
      };
    }
    
    // @ts-ignore
    groups[key].sales_count++;
    // @ts-ignore
    groups[key].total_revenue += sale.total;
    // @ts-ignore
    groups[key].sales.push(sale.id);
  });
  
  // Calculate averages and sort by date
  const result = Object.values(groups).map(group => ({
    ...group,
    average_sale: group.sales_count > 0 ? group.total_revenue / group.sales_count : 0,
  }));
  
  // Sort by date
  result.sort((a, b) => a.date - b.date);
  
  return result;
}

/**
 * Get ISO week number
 * @param {string | number | Date} date
 */
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Calculate trends from grouped data
 * @param {any[]} groupedData
 * @param {string} period
 */
// @ts-ignore
function calculateTrends(groupedData, period) {
  if (groupedData.length < 2) {
    return {
      revenue_trend: 'insufficient_data',
      sales_trend: 'insufficient_data',
      growth_rates: {
        revenue: 0,
        sales: 0,
      },
    };
  }
  
  const first = groupedData[0];
  const last = groupedData[groupedData.length - 1];
  
  const revenueGrowth = ((last.total_revenue - first.total_revenue) / first.total_revenue) * 100;
  const salesGrowth = ((last.sales_count - first.sales_count) / first.sales_count) * 100;
  
  // Determine trend direction
  const revenueTrend = revenueGrowth > 0 ? 'increasing' : revenueGrowth < 0 ? 'decreasing' : 'stable';
  const salesTrend = salesGrowth > 0 ? 'increasing' : salesGrowth < 0 ? 'decreasing' : 'stable';
  
  // Calculate moving averages
  const revenueData = groupedData.map((/** @type {{ total_revenue: any; }} */ d) => d.total_revenue);
  const salesData = groupedData.map((/** @type {{ sales_count: any; }} */ d) => d.sales_count);
  
  const revenueMovingAvg = calculateMovingAverage(revenueData, 3);
  const salesMovingAvg = calculateMovingAverage(salesData, 3);
  
  return {
    revenue_trend: revenueTrend,
    sales_trend: salesTrend,
    growth_rates: {
      revenue: revenueGrowth,
      sales: salesGrowth,
    },
    moving_averages: {
      revenue: revenueMovingAvg,
      sales: salesMovingAvg,
    },
    period_comparison: {
      first_period: first.period,
      last_period: last.period,
      revenue_change: last.total_revenue - first.total_revenue,
      sales_change: last.sales_count - first.sales_count,
    },
  };
}

/**
 * Calculate moving average
 * @param {any[]} data
 * @param {number} window
 */
function calculateMovingAverage(data, window) {
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

/**
 * Calculate summary statistics
 * @param {any[]} sales
 * @param {string} period
 */
// @ts-ignore
function calculateSummary(sales, period) {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((/** @type {any} */ sum, /** @type {{ total: any; }} */ sale) => sum + sale.total, 0);
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Find busiest and slowest periods
  const hourlyDistribution = Array(24).fill(0);
  const dayDistribution = Array(7).fill(0);
  
  sales.forEach((/** @type {{ datetime: string | number | Date; }} */ sale) => {
    const date = new Date(sale.datetime);
    hourlyDistribution[date.getHours()]++;
    dayDistribution[date.getDay()]++;
  });
  
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const peakDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dayDistribution.indexOf(Math.max(...dayDistribution))
  ];
  
  return {
    total_sales: totalSales,
    total_revenue: totalRevenue,
    average_sale: averageSale,
    peak_performance: {
      hour: peakHour,
      day: peakDay,
      average_daily_sales: totalSales / (sales.length > 0 ? 
        new Set(sales.map((/** @type {{ datetime: string | number | Date; }} */ s) => new Date(s.datetime).toISOString().split('T')[0])).size : 1),
    },
    date_range: {
      // @ts-ignore
      start: new Date(Math.min(...sales.map((/** @type {{ datetime: string | number | Date; }} */ s) => new Date(s.datetime)))),
      // @ts-ignore
      end: new Date(Math.max(...sales.map((/** @type {{ datetime: string | number | Date; }} */ s) => new Date(s.datetime)))),
      days_analyzed: new Set(sales.map((/** @type {{ datetime: string | number | Date; }} */ s) => new Date(s.datetime).toISOString().split('T')[0])).size,
    },
  };
}

/**
 * Generate period comparisons
 * @param {any[]} groupedData
 * @param {string} period
 */
// @ts-ignore
function generateComparisons(groupedData, period) {
  if (groupedData.length < 2) {
    return {
      period_over_period: 'insufficient_data',
      best_period: null,
      worst_period: null,
    };
  }
  
  const sortedByRevenue = [...groupedData].sort((a, b) => b.total_revenue - a.total_revenue);
  // @ts-ignore
  const sortedBySales = [...groupedData].sort((a, b) => b.sales_count - a.sales_count);
  
  const bestPeriod = sortedByRevenue[0];
  const worstPeriod = sortedByRevenue[sortedByRevenue.length - 1];
  
  // Calculate period-over-period changes
  const popChanges = [];
  for (let i = 1; i < groupedData.length; i++) {
    const current = groupedData[i];
    const previous = groupedData[i - 1];
    
    const revenueChange = ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100;
    const salesChange = ((current.sales_count - previous.sales_count) / previous.sales_count) * 100;
    
    popChanges.push({
      from_period: previous.period,
      to_period: current.period,
      revenue_change: revenueChange,
      sales_change: salesChange,
      is_improvement: revenueChange > 0 && salesChange > 0,
    });
  }
  
  return {
    period_over_period: popChanges,
    best_period: {
      period: bestPeriod.period,
      revenue: bestPeriod.total_revenue,
      sales_count: bestPeriod.sales_count,
      average_sale: bestPeriod.average_sale,
    },
    worst_period: {
      period: worstPeriod.period,
      revenue: worstPeriod.total_revenue,
      sales_count: worstPeriod.sales_count,
      average_sale: worstPeriod.average_sale,
    },
    consistency: {
      revenue_std_dev: calculateStandardDeviation(groupedData.map((/** @type {{ total_revenue: any; }} */ d) => d.total_revenue)),
      sales_std_dev: calculateStandardDeviation(groupedData.map((/** @type {{ sales_count: any; }} */ d) => d.sales_count)),
    },
  };
}

/**
 * Generate revenue forecasts
 * @param {any[]} groupedData
 * @param {string} period
 */
// @ts-ignore
function generateForecasts(groupedData, period) {
  if (groupedData.length < 3) {
    return [];
  }
  
  const revenueData = groupedData.map((/** @type {{ total_revenue: any; }} */ d) => d.total_revenue);
  const salesData = groupedData.map((/** @type {{ sales_count: any; }} */ d) => d.sales_count);
  
  // Simple linear regression for next 3 periods
  const forecastPeriods = 3;
  const forecasts = [];
  
  for (let i = 0; i < forecastPeriods; i++) {
    const nextIndex = groupedData.length + i;
    
    // Simple moving average forecast
    const lastValues = revenueData.slice(-3);
    const forecastRevenue = lastValues.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / lastValues.length;
    
    const lastSales = salesData.slice(-3);
    const forecastSales = lastSales.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / lastSales.length;
    
    forecasts.push({
      period_index: nextIndex,
      forecast_period: `Period ${nextIndex + 1}`,
      forecast_revenue: forecastRevenue,
      forecast_sales: forecastSales,
      forecast_average_sale: forecastRevenue / forecastSales,
      confidence: Math.max(0, 1 - (i * 0.2)), // Decreasing confidence for further forecasts
      method: 'moving_average',
    });
  }
  
  return forecasts;
}

/**
 * Calculate standard deviation
 * @param {any[]} arr
 */
function calculateStandardDeviation(arr) {
  const n = arr.length;
  const mean = arr.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / n;
  return Math.sqrt(arr.map((/** @type {number} */ x) => Math.pow(x - mean, 2)).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / n);
}

/**
 * Generate analytics insights
 * @param {any[]} groupedData
 * @param {{ revenue_trend: string; sales_trend: string; growth_rates: { revenue: number; sales: number; }; moving_averages?: undefined; period_comparison?: undefined; } | { revenue_trend: string; sales_trend: string; growth_rates: { revenue: number; sales: number; }; moving_averages: { revenue: number[]; sales: number[]; }; period_comparison: { first_period: any; last_period: any; revenue_change: number; sales_change: number; }; }} trends
 * @param {{ total_sales?: any; total_revenue?: any; average_sale: any; peak_performance: any; date_range?: { start: Date; end: Date; days_analyzed: number; }; }} summary
 * @param {string} period
 */
// @ts-ignore
function generateAnalyticsInsights(groupedData, trends, summary, period) {
  const insights = [];
  
  if (groupedData.length === 0) {
    insights.push({
      type: 'no_data',
      message: 'No sales data available for analysis',
      priority: 'info',
    });
    return insights;
  }
  
  // Trend insights
  if (trends.revenue_trend === 'increasing') {
    insights.push({
      type: 'positive_trend',
      message: `Revenue is trending upward with ${trends.growth_rates.revenue.toFixed(1)}% growth`,
      priority: 'high',
      data: {
        growth_rate: trends.growth_rates.revenue,
        trend: trends.revenue_trend,
      },
    });
  } else if (trends.revenue_trend === 'decreasing') {
    insights.push({
      type: 'negative_trend',
      message: `Revenue is trending downward with ${Math.abs(trends.growth_rates.revenue).toFixed(1)}% decline`,
      priority: 'high',
      data: {
        decline_rate: Math.abs(trends.growth_rates.revenue),
        trend: trends.revenue_trend,
      },
    });
  }
  
  // Peak performance insight
  insights.push({
    type: 'peak_performance',
    message: `Peak sales hour is ${summary.peak_performance.hour}:00, best day is ${summary.peak_performance.day}`,
    priority: 'medium',
    data: {
      peak_hour: summary.peak_performance.hour,
      peak_day: summary.peak_performance.day,
      average_daily_sales: summary.peak_performance.average_daily_sales,
    },
  });
  
  // Consistency insight
  const revenueStdDev = calculateStandardDeviation(groupedData.map((/** @type {{ total_revenue: any; }} */ d) => d.total_revenue));
  const avgRevenue = groupedData.reduce((/** @type {any} */ sum, /** @type {{ total_revenue: any; }} */ d) => sum + d.total_revenue, 0) / groupedData.length;
  const consistencyRatio = revenueStdDev / avgRevenue;
  
  if (consistencyRatio < 0.2) {
    insights.push({
      type: 'high_consistency',
      message: 'Revenue shows high consistency across periods',
      priority: 'low',
      data: {
        consistency_ratio: consistencyRatio,
        interpretation: 'Stable performance',
      },
    });
  } else if (consistencyRatio > 0.5) {
    insights.push({
      type: 'low_consistency',
      message: 'Revenue shows high variability across periods',
      priority: 'medium',
      data: {
        consistency_ratio: consistencyRatio,
        interpretation: 'Unstable performance',
      },
    });
  }
  
  // Average sale value insight
  const lastPeriod = groupedData[groupedData.length - 1];
  if (lastPeriod.average_sale > summary.average_sale * 1.2) {
    insights.push({
      type: 'above_average_ticket',
      message: `Last period had ${((lastPeriod.average_sale / summary.average_sale - 1) * 100).toFixed(1)}% higher average sale value`,
      priority: 'medium',
      data: {
        last_period_average: lastPeriod.average_sale,
        overall_average: summary.average_sale,
        difference_percentage: ((lastPeriod.average_sale / summary.average_sale - 1) * 100),
      },
    });
  }
  
  // Growth opportunity insight
  if (trends.growth_rates.revenue > 0 && trends.growth_rates.sales < 0) {
    insights.push({
      type: 'growth_opportunity',
      message: 'Revenue is growing but sales count is decreasing. Focus on increasing transaction volume.',
      priority: 'high',
      data: {
        revenue_growth: trends.growth_rates.revenue,
        sales_growth: trends.growth_rates.sales,
      },
    });
  }
  
  return insights;
}

module.exports = getRevenueAnalytics;