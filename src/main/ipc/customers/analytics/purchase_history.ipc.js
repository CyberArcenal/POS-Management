// customers/analytics/purchase_history.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
// @ts-ignore
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomerPurchaseHistory(customer_id, filters = {}, userId) {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);

    // Build query for customer purchases
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("sale.customer_id = :customer_id", { customer_id })
      .orderBy("sale.datetime", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.start_date) {
      queryBuilder.andWhere("sale.datetime >= :start_date", {
        // @ts-ignore
        start_date: filters.start_date,
      });
    }

    // @ts-ignore
    if (filters.end_date) {
      queryBuilder.andWhere("sale.datetime <= :end_date", {
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.min_amount !== undefined) {
      queryBuilder.andWhere("sale.total >= :min_amount", {
        // @ts-ignore
        min_amount: filters.min_amount,
      });
    }

    // @ts-ignore
    if (filters.max_amount !== undefined) {
      queryBuilder.andWhere("sale.total <= :max_amount", {
        // @ts-ignore
        max_amount: filters.max_amount,
      });
    }

    // @ts-ignore
    if (filters.payment_method) {
      queryBuilder.andWhere("sale.payment_method = :payment_method", {
        // @ts-ignore
        payment_method: filters.payment_method,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("sale.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // Execute query
    const purchases = await queryBuilder.getMany();

    if (purchases.length === 0) {
      return {
        status: true,
        message: "No purchase history found for customer",
        data: {
          purchases: [],
          summary: {
            total_purchases: 0,
            total_spent: 0,
            avg_purchase_value: 0,
          },
        },
      };
    }

    // Calculate comprehensive purchase statistics
    const purchaseStats = purchases.reduce((stats, sale) => {
      stats.total_purchases += 1;
      // @ts-ignore
      stats.total_spent += parseFloat(sale.total);
      stats.avg_purchase_value = stats.total_spent / stats.total_purchases;
      
      // Count by payment method
      // @ts-ignore
      stats.payment_methods[sale.payment_method] = 
        // @ts-ignore
        (stats.payment_methods[sale.payment_method] || 0) + 1;
      
      // Count by status
      // @ts-ignore
      stats.status_counts[sale.status] = 
        // @ts-ignore
        (stats.status_counts[sale.status] || 0) + 1;
      
      // Track date ranges
      // @ts-ignore
      const saleDate = new Date(sale.datetime);
      if (!stats.first_purchase || saleDate < new Date(stats.first_purchase)) {
        // @ts-ignore
        stats.first_purchase = sale.datetime;
      }
      if (!stats.last_purchase || saleDate > new Date(stats.last_purchase)) {
        // @ts-ignore
        stats.last_purchase = sale.datetime;
      }
      
      return stats;
    }, {
      total_purchases: 0,
      total_spent: 0,
      avg_purchase_value: 0,
      payment_methods: {},
      status_counts: {},
      first_purchase: null,
      last_purchase: null,
    });

    // Calculate product purchase analysis
    const productAnalysis = {};
    let totalItems = 0;
    
    purchases.forEach(sale => {
      // @ts-ignore
      sale.items.forEach((/** @type {{ quantity: number; product_id: { toString: () => any; }; product: { name: any; }; total_price: string; }} */ item) => {
        totalItems += item.quantity;
        
        const productId = item.product_id.toString();
        // @ts-ignore
        if (!productAnalysis[productId]) {
          // @ts-ignore
          productAnalysis[productId] = {
            product_id: item.product_id,
            product_name: item.product?.name || "Unknown",
            total_quantity: 0,
            total_amount: 0,
            purchase_count: 0,
            avg_quantity_per_purchase: 0,
          };
        }
        
        // @ts-ignore
        productAnalysis[productId].total_quantity += item.quantity;
        // @ts-ignore
        productAnalysis[productId].total_amount += parseFloat(item.total_price);
        // @ts-ignore
        productAnalysis[productId].purchase_count += 1;
      });
    });

    // Calculate averages for each product
    Object.values(productAnalysis).forEach(product => {
      product.avg_quantity_per_purchase = product.total_quantity / product.purchase_count;
    });

    // Sort products by total amount spent
    const topProducts = Object.values(productAnalysis)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    // Calculate purchase frequency analysis
    // @ts-ignore
    const purchaseDates = purchases.map(p => new Date(p.datetime).toISOString().split('T')[0]);
    const uniquePurchaseDays = [...new Set(purchaseDates)].length;
    
    // @ts-ignore
    const firstPurchaseDate = new Date(purchaseStats.first_purchase);
    // @ts-ignore
    const lastPurchaseDate = new Date(purchaseStats.last_purchase);
    // @ts-ignore
    const customerAgeDays = Math.floor((lastPurchaseDate - firstPurchaseDate) / (1000 * 60 * 60 * 24));
    const purchaseFrequencyDays = uniquePurchaseDays > 1 ? 
      customerAgeDays / (uniquePurchaseDays - 1) : customerAgeDays;

    // Calculate monthly purchase trend
    const monthlyTrend = {};
    purchases.forEach(sale => {
      // @ts-ignore
      const date = new Date(sale.datetime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // @ts-ignore
      if (!monthlyTrend[monthKey]) {
        // @ts-ignore
        monthlyTrend[monthKey] = {
          month: monthKey,
          purchase_count: 0,
          total_amount: 0,
          avg_amount: 0,
        };
      }
      
      // @ts-ignore
      monthlyTrend[monthKey].purchase_count += 1;
      // @ts-ignore
      monthlyTrend[monthKey].total_amount += parseFloat(sale.total);
    });

    // Calculate averages for monthly trend
    Object.values(monthlyTrend).forEach(month => {
      month.avg_amount = month.total_amount / month.purchase_count;
    });

    const monthlyTrendArray = Object.values(monthlyTrend)
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate day of week preference
    const dayOfWeekPref = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    purchases.forEach(sale => {
      // @ts-ignore
      const day = new Date(sale.datetime).getDay();
      // @ts-ignore
      dayOfWeekPref[day] = (dayOfWeekPref[day] || 0) + 1;
    });

    // Calculate time of day preference
    const timeOfDayPref = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    purchases.forEach(sale => {
      // @ts-ignore
      const hour = new Date(sale.datetime).getHours();
      if (hour >= 5 && hour < 12) timeOfDayPref.morning += 1;
      else if (hour >= 12 && hour < 17) timeOfDayPref.afternoon += 1;
      else if (hour >= 17 && hour < 21) timeOfDayPref.evening += 1;
      else timeOfDayPref.night += 1;
    });

    // Generate purchase patterns
    const purchasePatterns = analyzePurchasePatterns(purchases, productAnalysis);

    // Compile comprehensive report
    const purchaseHistoryReport = {
      overview: {
        customer_id: customer_id,
        analysis_period: {
          start: purchaseStats.first_purchase,
          end: purchaseStats.last_purchase,
          total_days: customerAgeDays,
        },
        purchase_summary: purchaseStats,
      },
      product_analysis: {
        total_products_purchased: Object.keys(productAnalysis).length,
        total_items_purchased: totalItems,
        top_products: topProducts,
        product_categories: analyzeProductCategories(Object.values(productAnalysis)),
        product_preferences: identifyProductPreferences(Object.values(productAnalysis)),
      },
      behavioral_analysis: {
        purchase_frequency: {
          unique_purchase_days: uniquePurchaseDays,
          avg_days_between_purchases: Math.round(purchaseFrequencyDays),
          purchase_consistency: calculateConsistencyScore(purchaseDates),
          likely_next_purchase_days: Math.round(purchaseFrequencyDays),
        },
        temporal_patterns: {
          day_of_week_preference: dayOfWeekPref,
          time_of_day_preference: timeOfDayPref,
          preferred_purchase_time: identifyPeakPurchaseTime(timeOfDayPref),
        },
        monetary_patterns: {
          avg_purchase_value: purchaseStats.avg_purchase_value,
          purchase_value_distribution: calculateValueDistribution(purchases),
          spending_trend: analyzeSpendingTrend(monthlyTrendArray),
        },
      },
      trend_analysis: {
        monthly_trend: monthlyTrendArray,
        quarterly_trend: aggregateByQuarter(monthlyTrendArray),
        yearly_trend: aggregateByYear(monthlyTrendArray),
        growth_metrics: calculateGrowthMetrics(monthlyTrendArray),
      },
      insights: {
        purchase_patterns: purchasePatterns,
        customer_segment: segmentCustomerByBehavior(purchaseStats, purchasePatterns),
        loyalty_indicator: calculateLoyaltyScore(
          purchaseStats.total_purchases,
          customerAgeDays,
          purchaseStats.total_spent
        ),
        potential_opportunities: identifyOpportunities(productAnalysis, purchases),
      },
      recommendations: generatePurchaseHistoryRecommendations(
        purchaseStats,
        purchasePatterns,
        productAnalysis
      ),
    };

    // Audit log
    await log_audit("fetch_purchase_history", "Customer", customer_id, userId, {
      customer_id,
      purchase_count: purchases.length,
      total_spent: purchaseStats.total_spent,
      analysis_period: `${purchaseStats.first_purchase} to ${purchaseStats.last_purchase}`,
    });

    return {
      status: true,
      message: "Customer purchase history analyzed successfully",
      data: purchaseHistoryReport,
      raw_purchases: purchases.map(p => ({
        id: p.id,
        date: p.datetime,
        total: p.total,
        // @ts-ignore
        items: p.items.length,
        // @ts-ignore
        payment_method: p.payment_method,
        status: p.status,
      })),
      generated_at: new Date(),
      metadata: {
        filters_applied: filters,
        analysis_depth: "Comprehensive behavioral analysis",
        data_points_analyzed: purchases.length,
      },
    };
  } catch (error) {
    console.error("getCustomerPurchaseHistory error:", error);

    await log_audit("error", "PurchaseHistory", 0, userId, {
      customer_id,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to analyze purchase history: ${error.message}`,
      data: null,
      raw_purchases: [],
      generated_at: new Date(),
      metadata: {
        filters_applied: filters,
        analysis_depth: "None",
        data_points_analyzed: 0,
      },
    };
  }
}

// Helper functions for purchase pattern analysis

/**
 * @param {any[]} purchases
 * @param {{}} productAnalysis
 */
// @ts-ignore
function analyzePurchasePatterns(purchases, productAnalysis) {
  const patterns = {
    frequent_small_purchases: false,
    occasional_large_purchases: false,
    seasonal_pattern: false,
    product_bundle_preference: false,
    brand_loyalty: false,
    price_sensitive: false,
    impulse_buyer: false,
    planned_purchases: false,
  };

  // Analyze based on purchase data
  if (purchases.length > 10) {
    patterns.frequent_small_purchases = true;
  }

  const avgPurchaseValue = purchases.reduce((/** @type {number} */ sum, /** @type {{ total: string; }} */ p) => sum + parseFloat(p.total), 0) / purchases.length;
  if (avgPurchaseValue > 1000) {
    patterns.occasional_large_purchases = true;
  }

  // Check for seasonal patterns
  const monthlyPurchases = {};
  purchases.forEach((/** @type {{ datetime: string | number | Date; }} */ p) => {
    const month = new Date(p.datetime).getMonth();
    // @ts-ignore
    monthlyPurchases[month] = (monthlyPurchases[month] || 0) + 1;
  });

  const maxPurchases = Math.max(...Object.values(monthlyPurchases));
  const minPurchases = Math.min(...Object.values(monthlyPurchases));
  if (maxPurchases / minPurchases > 3) {
    patterns.seasonal_pattern = true;
  }

  return patterns;
}

/**
 * @param {any[]} products
 */
// @ts-ignore
function analyzeProductCategories(products) {
  // This would require product category data
  // For now, return placeholder
  return {
    category_count: "N/A - Category data required",
    top_category: "N/A",
    category_diversity: "N/A",
  };
}

/**
 * @param {any[]} products
 */
function identifyProductPreferences(products) {
  const preferences = {
    favorite_product: products[0]?.product_name || "None",
    most_frequent_product: products.sort((/** @type {{ purchase_count: number; }} */ a, /** @type {{ purchase_count: number; }} */ b) => b.purchase_count - a.purchase_count)[0]?.product_name || "None",
    highest_value_product: products.sort((/** @type {{ total_amount: number; }} */ a, /** @type {{ total_amount: number; }} */ b) => b.total_amount - a.total_amount)[0]?.product_name || "None",
    product_variety_score: products.length > 5 ? "High" : products.length > 2 ? "Medium" : "Low",
  };
  return preferences;
}

/**
 * @param {any[]} purchaseDates
 */
function calculateConsistencyScore(purchaseDates) {
  if (purchaseDates.length < 2) return "Insufficient data";
  
  // @ts-ignore
  const dates = purchaseDates.map((/** @type {string | number | Date} */ d) => new Date(d)).sort((/** @type {number} */ a, /** @type {number} */ b) => a - b);
  const gaps = [];
  
  for (let i = 1; i < dates.length; i++) {
    // @ts-ignore
    gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
  }
  
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  
  const cv = (stdDev / avgGap) * 100;
  
  if (cv < 30) return "Very Consistent";
  if (cv < 50) return "Consistent";
  if (cv < 80) return "Moderately Consistent";
  return "Inconsistent";
}

/**
 * @param {{ [s: string]: any; } | ArrayLike<any>} timeOfDayPref
 */
function identifyPeakPurchaseTime(timeOfDayPref) {
  const max = Math.max(...Object.values(timeOfDayPref));
  for (const [time, count] of Object.entries(timeOfDayPref)) {
    if (count === max) return time;
  }
  return "Unknown";
}

/**
 * @param {any[]} purchases
 */
function calculateValueDistribution(purchases) {
  const values = purchases.map((/** @type {{ total: string; }} */ p) => parseFloat(p.total)).sort((/** @type {number} */ a, /** @type {number} */ b) => a - b);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    median: values[Math.floor(values.length / 2)],
    quartile_1: values[Math.floor(values.length * 0.25)],
    quartile_3: values[Math.floor(values.length * 0.75)],
    interquartile_range: values[Math.floor(values.length * 0.75)] - values[Math.floor(values.length * 0.25)],
  };
}

/**
 * @param {any[]} monthlyTrend
 */
function analyzeSpendingTrend(monthlyTrend) {
  if (monthlyTrend.length < 3) return "Insufficient data for trend analysis";
  
  const amounts = monthlyTrend.map((/** @type {{ total_amount: any; }} */ m) => m.total_amount);
  const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
  const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
  
  const avgFirst = firstHalf.reduce((/** @type {any} */ sum, /** @type {any} */ a) => sum + a, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((/** @type {any} */ sum, /** @type {any} */ a) => sum + a, 0) / secondHalf.length;
  
  const growthRate = ((avgSecond - avgFirst) / avgFirst) * 100;
  
  if (growthRate > 20) return "Strong Growth";
  if (growthRate > 5) return "Moderate Growth";
  if (growthRate > -5) return "Stable";
  if (growthRate > -20) return "Declining";
  return "Sharp Decline";
}

/**
 * @param {any[]} monthlyTrend
 */
function aggregateByQuarter(monthlyTrend) {
  const quarterly = {};
  
  monthlyTrend.forEach((/** @type {{ month: { split: (arg0: string) => [any, any]; }; purchase_count: any; total_amount: any; }} */ month) => {
    const [year, monthNum] = month.month.split('-');
    const quarter = Math.ceil(parseInt(monthNum) / 3);
    const key = `${year}-Q${quarter}`;
    
    // @ts-ignore
    if (!quarterly[key]) {
      // @ts-ignore
      quarterly[key] = {
        quarter: key,
        purchase_count: 0,
        total_amount: 0,
      };
    }
    
    // @ts-ignore
    quarterly[key].purchase_count += month.purchase_count;
    // @ts-ignore
    quarterly[key].total_amount += month.total_amount;
  });
  
  return Object.values(quarterly).sort((a, b) => a.quarter.localeCompare(b.quarter));
}

/**
 * @param {any[]} monthlyTrend
 */
function aggregateByYear(monthlyTrend) {
  const yearly = {};
  
  monthlyTrend.forEach((/** @type {{ month: string; purchase_count: any; total_amount: any; }} */ month) => {
    const year = month.month.split('-')[0];
    
    // @ts-ignore
    if (!yearly[year]) {
      // @ts-ignore
      yearly[year] = {
        year: year,
        purchase_count: 0,
        total_amount: 0,
      };
    }
    
    // @ts-ignore
    yearly[year].purchase_count += month.purchase_count;
    // @ts-ignore
    yearly[year].total_amount += month.total_amount;
  });
  
  return Object.values(yearly).sort((a, b) => a.year - b.year);
}

/**
 * @param {any[]} monthlyTrend
 */
function calculateGrowthMetrics(monthlyTrend) {
  if (monthlyTrend.length < 2) return { monthly_growth: "N/A", trend_strength: "Weak" };
  
  const amounts = monthlyTrend.map((/** @type {{ total_amount: any; }} */ m) => m.total_amount);
  const growthRates = [];
  
  for (let i = 1; i < amounts.length; i++) {
    const growth = ((amounts[i] - amounts[i-1]) / amounts[i-1]) * 100;
    growthRates.push(growth);
  }
  
  const avgGrowth = growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length;
  const positiveMonths = growthRates.filter(g => g > 0).length;
  const consistency = (positiveMonths / growthRates.length) * 100;
  
  return {
    avg_monthly_growth: Math.round(avgGrowth * 100) / 100,
    growth_consistency: Math.round(consistency * 100) / 100,
    trend_strength: consistency > 70 ? "Strong" : consistency > 40 ? "Moderate" : "Weak",
    volatility: calculateVolatility(growthRates),
  };
}

/**
 * @param {any[]} values
 */
function calculateVolatility(values) {
  const avg = values.reduce((/** @type {any} */ sum, /** @type {any} */ v) => sum + v, 0) / values.length;
  const variance = values.reduce((/** @type {number} */ sum, /** @type {number} */ v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * @param {{ total_purchases: any; total_spent?: number; avg_purchase_value: any; payment_methods?: {}; status_counts?: {}; first_purchase?: null; last_purchase?: null; }} stats
 * @param {{ frequent_small_purchases: any; occasional_large_purchases: any; seasonal_pattern: any; product_bundle_preference?: boolean; brand_loyalty?: boolean; price_sensitive?: boolean; impulse_buyer?: boolean; planned_purchases?: boolean; }} patterns
 */
function segmentCustomerByBehavior(stats, patterns) {
  if (patterns.frequent_small_purchases && stats.avg_purchase_value < 100) {
    return "High-Frequency, Low-Value Buyer";
  }
  if (patterns.occasional_large_purchases && stats.total_purchases < 5) {
    return "Low-Frequency, High-Value Buyer";
  }
  if (patterns.frequent_small_purchases && patterns.seasonal_pattern) {
    return "Seasonal Regular";
  }
  if (stats.total_purchases > 20) {
    return "Loyal Regular";
  }
  if (stats.total_purchases < 3) {
    return "New or Occasional Buyer";
  }
  return "Average Buyer";
}

/**
 * @param {number} purchaseCount
 * @param {number} customerAgeDays
 * @param {number} totalSpent
 */
function calculateLoyaltyScore(purchaseCount, customerAgeDays, totalSpent) {
  const frequencyScore = Math.min(100, (purchaseCount / (customerAgeDays / 30)) * 10);
  const monetaryScore = Math.min(100, totalSpent / 100);
  const recencyScore = 100; // Assuming active since we're analyzing history
  
  return Math.round((frequencyScore * 0.4 + monetaryScore * 0.4 + recencyScore * 0.2));
}

/**
 * @param {{}} productAnalysis
 * @param {any[]} purchases
 */
function identifyOpportunities(productAnalysis, purchases) {
  const opportunities = [];
  
  // Cross-selling opportunities
  const productIds = Object.keys(productAnalysis);
  if (productIds.length > 0 && productIds.length < 10) {
    opportunities.push("Potential for cross-selling related products");
  }
  
  // Upselling opportunities
  const avgPurchaseValue = purchases.reduce((/** @type {number} */ sum, /** @type {{ total: string; }} */ p) => sum + parseFloat(p.total), 0) / purchases.length;
  if (avgPurchaseValue < 500) {
    opportunities.push("Upselling opportunity to premium products");
  }
  
  // Frequency increase opportunity
  if (purchases.length < 5) {
    opportunities.push("Increase purchase frequency through engagement");
  }
  
  return opportunities;
}

/**
 * @param {{ total_purchases?: number; total_spent?: number; avg_purchase_value: any; payment_methods?: {}; status_counts?: {}; first_purchase?: null; last_purchase?: null; }} stats
 * @param {{ frequent_small_purchases: any; occasional_large_purchases: any; seasonal_pattern: any; product_bundle_preference?: boolean; brand_loyalty?: boolean; price_sensitive?: boolean; impulse_buyer?: boolean; planned_purchases?: boolean; }} patterns
 * @param {{}} productAnalysis
 */
function generatePurchaseHistoryRecommendations(stats, patterns, productAnalysis) {
  const recommendations = [];
  
  if (patterns.frequent_small_purchases) {
    recommendations.push("Consider bundling products to increase average order value");
    recommendations.push("Offer subscription model for regular purchases");
  }
  
  if (patterns.occasional_large_purchases) {
    recommendations.push("Implement loyalty program for high-value customers");
    recommendations.push("Offer personalized consultation for premium products");
  }
  
  if (patterns.seasonal_pattern) {
    recommendations.push("Plan targeted marketing campaigns before peak seasons");
    recommendations.push("Offer early bird discounts for seasonal products");
  }
  
  if (Object.keys(productAnalysis).length === 1) {
    recommendations.push("Introduce related products to increase basket size");
    recommendations.push("Offer bundle discounts with complementary products");
  }
  
  if (stats.avg_purchase_value < 100) {
    recommendations.push("Implement minimum purchase incentives");
    recommendations.push("Offer free shipping threshold");
  }
  
  return recommendations;
}

module.exports = getCustomerPurchaseHistory;