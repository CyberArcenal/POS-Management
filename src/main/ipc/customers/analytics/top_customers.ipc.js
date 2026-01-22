// customers/analytics/top_customers.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} limit
 * @param {Object} date_range
 * @param {Object} filters
 * @param {number} userId
 */
async function getTopCustomers(limit = 10, date_range = {}, filters = {}, userId) {
  try {
    // @ts-ignore
    const customerRepo = AppDataSource.getRepository(Customer);
    const saleRepo = AppDataSource.getRepository(Sale);

    // Build base query for sales
    let saleQuery = saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select([
        "customer.id as customer_id",
        "customer.customer_code as customer_code",
        "customer.display_name as customer_name",
        "customer.customer_type as customer_type",
        "customer.status as customer_status",
        "COUNT(sale.id) as total_purchases",
        "SUM(sale.total) as total_spent",
        "AVG(sale.total) as avg_purchase_value",
        "MAX(sale.datetime) as last_purchase_date",
        "MIN(sale.datetime) as first_purchase_date",
      ])
      .where("customer.id IS NOT NULL")
      .groupBy("customer.id");

    // Apply date range filter
    // @ts-ignore
    if (date_range.start_date && date_range.end_date) {
      saleQuery.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: date_range.start_date,
        // @ts-ignore
        end_date: date_range.end_date,
      });
    }

    // Apply customer filters
    // @ts-ignore
    if (filters.customer_type) {
      saleQuery.andWhere("customer.customer_type = :customer_type", {
        // @ts-ignore
        customer_type: filters.customer_type,
      });
    }

    // @ts-ignore
    if (filters.customer_group) {
      saleQuery.andWhere("customer.customer_group = :customer_group", {
        // @ts-ignore
        customer_group: filters.customer_group,
      });
    }

    // @ts-ignore
    if (filters.status) {
      saleQuery.andWhere("customer.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // Order by total spent (descending)
    saleQuery.orderBy("total_spent", "DESC");

    // Apply limit
    saleQuery.limit(limit);

    // Get top customers by spending
    const topCustomersBySpending = await saleQuery.getRawMany();

    // Calculate additional metrics
    const enrichedCustomers = topCustomersBySpending.map((/** @type {{ last_purchase_date: string | number | Date; first_purchase_date: string | number | Date; total_spent: string; avg_purchase_value: string; total_purchases: string; }} */ customer) => {
      const daysSinceLastPurchase = customer.last_purchase_date ? 
        // @ts-ignore
        Math.floor((new Date() - new Date(customer.last_purchase_date)) / (1000 * 60 * 60 * 24)) : null;
      
      const customerAgeDays = customer.first_purchase_date ? 
        // @ts-ignore
        Math.floor((new Date() - new Date(customer.first_purchase_date)) / (1000 * 60 * 60 * 24)) : null;
      
      return {
        ...customer,
        total_spent: parseFloat(customer.total_spent) || 0,
        avg_purchase_value: parseFloat(customer.avg_purchase_value) || 0,
        total_purchases: parseInt(customer.total_purchases) || 0,
        days_since_last_purchase: daysSinceLastPurchase,
        customer_age_days: customerAgeDays,
        purchase_frequency: customerAgeDays ? 
          (parseInt(customer.total_purchases) || 0) / (customerAgeDays / 30) : 0, // purchases per month
        customer_value_score: calculateCustomerValueScore(
          parseFloat(customer.total_spent) || 0,
          parseInt(customer.total_purchases) || 0,
          daysSinceLastPurchase
        ),
      };
    });

    // Get top customers by purchase frequency
    const topByFrequency = await saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select([
        "customer.id as customer_id",
        "customer.customer_code as customer_code",
        "customer.display_name as customer_name",
        "COUNT(sale.id) as purchase_frequency",
        "COUNT(DISTINCT DATE(sale.datetime)) as unique_purchase_days",
      ])
      .where("customer.id IS NOT NULL")
      .groupBy("customer.id")
      .orderBy("purchase_frequency", "DESC")
      .limit(limit)
      .getRawMany();

    // Get top customers by recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topByRecentActivity = await saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select([
        "customer.id as customer_id",
        "customer.customer_code as customer_code",
        "customer.display_name as customer_name",
        "COUNT(sale.id) as recent_purchases",
        "SUM(sale.total) as recent_spending",
      ])
      .where("customer.id IS NOT NULL")
      .andWhere("sale.datetime >= :date", { date: thirtyDaysAgo })
      .groupBy("customer.id")
      .orderBy("recent_spending", "DESC")
      .limit(limit)
      .getRawMany();

    // Calculate summary statistics for top customers
    const summaryStats = {
      total_spending: enrichedCustomers.reduce((/** @type {any} */ sum, /** @type {{ total_spent: any; }} */ c) => sum + c.total_spent, 0),
      avg_spending: enrichedCustomers.reduce((/** @type {any} */ sum, /** @type {{ total_spent: any; }} */ c) => sum + c.total_spent, 0) / enrichedCustomers.length,
      total_purchases: enrichedCustomers.reduce((/** @type {any} */ sum, /** @type {{ total_purchases: any; }} */ c) => sum + c.total_purchases, 0),
      avg_purchase_frequency: enrichedCustomers.reduce((/** @type {any} */ sum, /** @type {{ purchase_frequency: any; }} */ c) => sum + c.purchase_frequency, 0) / enrichedCustomers.length,
      // @ts-ignore
      customer_types: [...new Set(enrichedCustomers.map((/** @type {{ customer_type: any; }} */ c) => c.customer_type))],
      // @ts-ignore
      active_customers: enrichedCustomers.filter((/** @type {{ customer_status: string; }} */ c) => c.customer_status === 'active').length,
      avg_customer_value_score: enrichedCustomers.reduce((/** @type {any} */ sum, /** @type {{ customer_value_score: any; }} */ c) => sum + c.customer_value_score, 0) / enrichedCustomers.length,
    };

    // Audit log
    await log_audit("fetch_top_customers", "Customer", 0, userId, {
      limit,
      date_range,
      filter_count: Object.keys(filters).length,
      result_count: enrichedCustomers.length,
    });

    return {
      status: true,
      message: "Top customers fetched successfully",
      data: {
        top_customers_by_spending: enrichedCustomers,
        top_customers_by_frequency: topByFrequency.map((/** @type {{ purchase_frequency: string; unique_purchase_days: string; }} */ c) => ({
          ...c,
          purchase_frequency: parseInt(c.purchase_frequency) || 0,
          unique_purchase_days: parseInt(c.unique_purchase_days) || 0,
        })),
        top_customers_by_recent_activity: topByRecentActivity.map((/** @type {{ recent_purchases: string; recent_spending: string; }} */ c) => ({
          ...c,
          recent_purchases: parseInt(c.recent_purchases) || 0,
          recent_spending: parseFloat(c.recent_spending) || 0,
        })),
        summary: summaryStats,
        ranking_criteria: {
          spending: "Total amount spent",
          frequency: "Number of purchases",
          recent_activity: "Activity in last 30 days",
        },
      },
      generated_at: new Date(),
      metadata: {
        limit_applied: limit,
        date_range_applied: date_range,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getTopCustomers error:", error);

    await log_audit("error", "TopCustomers", 0, userId, {
      limit,
      date_range,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch top customers: ${error.message}`,
      data: {
        top_customers_by_spending: [],
        top_customers_by_frequency: [],
        top_customers_by_recent_activity: [],
        summary: {
          total_spending: 0,
          avg_spending: 0,
          total_purchases: 0,
          avg_purchase_frequency: 0,
          customer_types: [],
          active_customers: 0,
          avg_customer_value_score: 0,
        },
      },
      generated_at: new Date(),
      metadata: {
        limit_applied: limit,
        date_range_applied: date_range,
        filters_applied: filters,
      },
    };
  }
}

/**
 * Calculate customer value score based on multiple factors
 * @param {number} totalSpent
 * @param {number} totalPurchases
 * @param {number|null} daysSinceLastPurchase
 * @returns {number}
 */
function calculateCustomerValueScore(totalSpent, totalPurchases, daysSinceLastPurchase) {
  let score = 0;
  
  // Spending score (0-50 points)
  if (totalSpent > 10000) score += 50;
  else if (totalSpent > 5000) score += 40;
  else if (totalSpent > 1000) score += 30;
  else if (totalSpent > 500) score += 20;
  else if (totalSpent > 100) score += 10;
  
  // Frequency score (0-30 points)
  if (totalPurchases > 50) score += 30;
  else if (totalPurchases > 20) score += 25;
  else if (totalPurchases > 10) score += 20;
  else if (totalPurchases > 5) score += 15;
  else if (totalPurchases > 2) score += 10;
  else if (totalPurchases > 0) score += 5;
  
  // Recency score (0-20 points)
  if (daysSinceLastPurchase !== null) {
    if (daysSinceLastPurchase <= 7) score += 20;
    else if (daysSinceLastPurchase <= 30) score += 15;
    else if (daysSinceLastPurchase <= 90) score += 10;
    else if (daysSinceLastPurchase <= 180) score += 5;
  }
  
  return score;
}

module.exports = getTopCustomers;