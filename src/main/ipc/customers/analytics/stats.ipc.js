// customers/analytics/stats.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} date_range
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomerStats(date_range = {}, filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);
    const saleRepo = AppDataSource.getRepository(Sale);

    // Base query for customers
    const customerQueryBuilder = customerRepo.createQueryBuilder("customer");

    // Apply customer filters
    // @ts-ignore
    if (filters.customer_type) {
      customerQueryBuilder.andWhere("customer.customer_type = :customer_type", {
        // @ts-ignore
        customer_type: filters.customer_type,
      });
    }

    // @ts-ignore
    if (filters.customer_group) {
      customerQueryBuilder.andWhere("customer.customer_group = :customer_group", {
        // @ts-ignore
        customer_group: filters.customer_group,
      });
    }

    // @ts-ignore
    if (filters.status) {
      customerQueryBuilder.andWhere("customer.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // Get customer statistics
    const customerStats = await customerQueryBuilder
      .select([
        "COUNT(customer.id) as total_customers",
        "SUM(customer.current_balance) as total_balance",
        "AVG(customer.current_balance) as avg_balance",
        "MAX(customer.current_balance) as max_balance",
        "MIN(customer.current_balance) as min_balance",
        "SUM(CASE WHEN customer.status = 'active' THEN 1 ELSE 0 END) as active_customers",
        "SUM(CASE WHEN customer.status = 'inactive' THEN 1 ELSE 0 END) as inactive_customers",
        "SUM(CASE WHEN customer.status = 'blocked' THEN 1 ELSE 0 END) as blocked_customers",
        "COUNT(DISTINCT customer.customer_type) as unique_customer_types",
        "COUNT(DISTINCT customer.customer_group) as unique_customer_groups",
      ])
      .getRawOne();

    // Get customer type distribution
    const typeDistribution = await customerRepo
      .createQueryBuilder("customer")
      .select("customer.customer_type, COUNT(*) as count, AVG(customer.current_balance) as avg_balance")
      .groupBy("customer.customer_type")
      .getRawMany();

    // Get customer group distribution
    const groupDistribution = await customerRepo
      .createQueryBuilder("customer")
      .select("customer.customer_group, COUNT(*) as count, AVG(customer.current_balance) as avg_balance")
      .where("customer.customer_group IS NOT NULL")
      .groupBy("customer.customer_group")
      .getRawMany();

    // Get top customers by balance
    const topCustomersByBalance = await customerRepo
      .createQueryBuilder("customer")
      .select([
        "customer.id",
        "customer.customer_code",
        "customer.display_name",
        "customer.current_balance",
        "customer.status",
        "customer.last_purchase_at",
      ])
      .orderBy("customer.current_balance", "DESC")
      .take(10)
      .getMany();

    // Get customer acquisition trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const acquisitionTrend = await customerRepo
      .createQueryBuilder("customer")
      .select([
        "DATE_FORMAT(customer.created_at, '%Y-%m') as month",
        "COUNT(*) as new_customers",
        "SUM(CASE WHEN customer.status = 'active' THEN 1 ELSE 0 END) as active_customers",
      ])
      .where("customer.created_at >= :date", { date: twelveMonthsAgo })
      .groupBy("DATE_FORMAT(customer.created_at, '%Y-%m')")
      .orderBy("month", "ASC")
      .getRawMany();

    // Get customer sales statistics
    const salesStats = await saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select([
        "COUNT(DISTINCT customer.id) as customers_with_sales",
        "SUM(sale.total) as total_revenue",
        "AVG(sale.total) as avg_sale_value",
        "COUNT(sale.id) as total_sales",
      ])
      .where("customer.id IS NOT NULL")
      .getRawOne();

    // Calculate customer lifetime value (LTV)
    const ltvStats = await saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select([
        "customer.id",
        "customer.customer_code",
        "COUNT(sale.id) as total_purchases",
        "SUM(sale.total) as total_spent",
        "AVG(sale.total) as avg_purchase_value",
        "MIN(sale.datetime) as first_purchase",
        "MAX(sale.datetime) as last_purchase",
      ])
      .where("customer.id IS NOT NULL")
      .groupBy("customer.id")
      .having("COUNT(sale.id) > 0")
      .orderBy("total_spent", "DESC")
      .limit(10)
      .getRawMany();

    // Calculate churn risk (customers with no purchase in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const churnRisk = await customerRepo
      .createQueryBuilder("customer")
      .select([
        "COUNT(customer.id) as total_at_risk",
        "SUM(customer.current_balance) as total_balance_at_risk",
      ])
      .where("customer.last_purchase_at < :date OR customer.last_purchase_at IS NULL", {
        date: ninetyDaysAgo,
      })
      .andWhere("customer.status = 'active'")
      .getRawOne();

    // Compile comprehensive statistics
    const comprehensiveStats = {
      customer_overview: {
        total_customers: parseInt(customerStats.total_customers) || 0,
        active_customers: parseInt(customerStats.active_customers) || 0,
        inactive_customers: parseInt(customerStats.inactive_customers) || 0,
        blocked_customers: parseInt(customerStats.blocked_customers) || 0,
        // @ts-ignore
        acquisition_rate: date_range.start_date ? 
          // @ts-ignore
          `Data for period ${date_range.start_date} to ${date_range.end_date}` : 
          "All time",
      },
      financial_overview: {
        total_balance: parseFloat(customerStats.total_balance) || 0,
        avg_balance: parseFloat(customerStats.avg_balance) || 0,
        max_balance: parseFloat(customerStats.max_balance) || 0,
        min_balance: parseFloat(customerStats.min_balance) || 0,
        credit_exposure: parseFloat(customerStats.total_balance) || 0,
      },
      sales_performance: {
        customers_with_sales: parseInt(salesStats.customers_with_sales) || 0,
        total_revenue: parseFloat(salesStats.total_revenue) || 0,
        avg_sale_value: parseFloat(salesStats.avg_sale_value) || 0,
        total_sales: parseInt(salesStats.total_sales) || 0,
        conversion_rate: (parseInt(salesStats.customers_with_sales) || 0) / 
          (parseInt(customerStats.total_customers) || 1) * 100,
      },
      distribution: {
        customer_types: typeDistribution,
        customer_groups: groupDistribution,
        unique_types: parseInt(customerStats.unique_customer_types) || 0,
        unique_groups: parseInt(customerStats.unique_customer_groups) || 0,
      },
      trends: {
        acquisition_trend: acquisitionTrend,
        top_customers_by_balance: topCustomersByBalance,
        top_customers_by_spending: ltvStats,
      },
      risk_assessment: {
        churn_risk_customers: parseInt(churnRisk.total_at_risk) || 0,
        churn_risk_balance: parseFloat(churnRisk.total_balance_at_risk) || 0,
        churn_risk_percentage: (parseInt(churnRisk.total_at_risk) || 0) / 
          (parseInt(customerStats.active_customers) || 1) * 100,
        high_balance_customers: topCustomersByBalance.filter(c => 
          // @ts-ignore
          parseFloat(c.current_balance) > 1000
        ).length,
      },
      key_metrics: {
        customer_acquisition_cost: 0, // Would require additional data
        customer_lifetime_value: ltvStats.length > 0 ? 
          ltvStats.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / ltvStats.length : 0,
        // @ts-ignore
        retention_rate: date_range.start_date ? 
          "Calculate based on period" : "All time data",
        avg_customer_age_days: "Calculate from created_at",
      },
    };

    // Audit log
    await log_audit("fetch_stats", "Customer", 0, userId, {
      date_range,
      filter_count: Object.keys(filters).length,
      stats_generated: Object.keys(comprehensiveStats).length,
    });

    return {
      status: true,
      message: "Customer statistics fetched successfully",
      data: comprehensiveStats,
      generated_at: new Date(),
      metadata: {
        date_range_applied: date_range,
        filters_applied: filters,
        data_points: Object.values(comprehensiveStats).reduce((sum, category) => 
          sum + Object.keys(category).length, 0
        ),
      },
    };
  } catch (error) {
    console.error("getCustomerStats error:", error);

    await log_audit("error", "CustomerStats", 0, userId, {
      date_range,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customer statistics: ${error.message}`,
      data: null,
      generated_at: new Date(),
      metadata: {
        date_range_applied: date_range,
        filters_applied: filters,
        data_points: 0,
      },
    };
  }
}

module.exports = getCustomerStats;