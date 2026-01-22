// customers/analytics/lifetime_value.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {number} userId
 */
async function getCustomerLifetimeValue(customer_id, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);
    const saleRepo = AppDataSource.getRepository(Sale);

    // Find customer
    const customer = await customerRepo.findOne({
      where: { id: customer_id }
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Get all sales for customer
    const sales = await saleRepo.find({
      // @ts-ignore
      where: { customer_id },
      order: { datetime: "ASC" },
    });

    if (sales.length === 0) {
      return {
        status: true,
        message: "Customer has no purchase history",
        data: {
          customer: {
            id: customer.id,
            code: customer.customer_code,
            name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
          },
          lifetime_value: {
                total_value: 0,
                avg_value: 0,
                calculation: "No purchase history",
          },
        },
      };
    }

    // Calculate basic LTV metrics
    // @ts-ignore
    const firstPurchase = new Date(sales[0].datetime);
    // @ts-ignore
    const lastPurchase = new Date(sales[sales.length - 1].datetime);
    // @ts-ignore
    const customerAgeDays = Math.floor((new Date() - firstPurchase) / (1000 * 60 * 60 * 24));
    const customerAgeMonths = customerAgeDays / 30.44;
    const customerAgeYears = customerAgeDays / 365.25;

    // @ts-ignore
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const totalProfit = sales.reduce((sum, sale) => {
      // Assuming 30% profit margin if cost data not available
      // @ts-ignore
      return sum + (parseFloat(sale.total) * 0.3);
    }, 0);

    // Calculate purchase frequency metrics
    const purchaseDays = [...new Set(sales.map(sale => 
      // @ts-ignore
      new Date(sale.datetime).toISOString().split('T')[0]
    ))];
    
    const avgDaysBetweenPurchases = purchaseDays.length > 1 ? 
      customerAgeDays / (purchaseDays.length - 1) : customerAgeDays;

    // Calculate recency metrics
    // @ts-ignore
    const daysSinceLastPurchase = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));

    // Calculate customer value segments
    let valueSegment = "Low";
    let retentionRisk = "Low";
    
    if (totalRevenue > 10000) valueSegment = "VIP";
    else if (totalRevenue > 5000) valueSegment = "High";
    else if (totalRevenue > 1000) valueSegment = "Medium";
    
    if (daysSinceLastPurchase > 180) retentionRisk = "High";
    else if (daysSinceLastPurchase > 90) retentionRisk = "Medium";

    // Predict future value
    const predictedFutureMonths = 12; // Predict next 12 months
    const avgMonthlySpend = totalRevenue / customerAgeMonths;
    const predictedFutureValue = avgMonthlySpend * predictedFutureMonths;

    // Calculate customer health score
    const healthScore = calculateCustomerHealthScore(
      totalRevenue,
      sales.length,
      daysSinceLastPurchase,
      customerAgeMonths
    );

    // Generate insights
    const insights = generateLTVInsights(
      totalRevenue,
      sales.length,
      daysSinceLastPurchase,
      valueSegment,
      retentionRisk
    );

    // Calculate cohort analysis (if applicable)
    const cohortMonth = `${firstPurchase.getFullYear()}-${String(firstPurchase.getMonth() + 1).padStart(2, '0')}`;
    const cohortCustomers = await customerRepo
      .createQueryBuilder("customer")
      .where("DATE_FORMAT(customer.created_at, '%Y-%m') = :cohort", { cohort: cohortMonth })
      .getCount();

    const cohortRevenue = await saleRepo
      .createQueryBuilder("sale")
      .leftJoin("sale.customer", "customer")
      .select("SUM(sale.total)", "total")
      .where("DATE_FORMAT(customer.created_at, '%Y-%m') = :cohort", { cohort: cohortMonth })
      .getRawOne();

    const cohortAvgLTV = cohortCustomers > 0 ? 
      parseFloat(cohortRevenue.total) / cohortCustomers : 0;

    // Compile comprehensive LTV report
    const ltvReport = {
      customer_profile: {
        id: customer.id,
        code: customer.customer_code,
        name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
        type: customer.customer_type,
        status: customer.status,
        created_at: customer.created_at,
        cohort: cohortMonth,
      },
      historical_performance: {
        first_purchase: firstPurchase,
        last_purchase: lastPurchase,
        customer_age: {
          days: customerAgeDays,
          months: Math.round(customerAgeMonths * 100) / 100,
          years: Math.round(customerAgeYears * 100) / 100,
        },
        total_transactions: sales.length,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        estimated_profit: Math.round(totalProfit * 100) / 100,
        avg_transaction_value: Math.round((totalRevenue / sales.length) * 100) / 100,
        unique_purchase_days: purchaseDays.length,
        avg_days_between_purchases: Math.round(avgDaysBetweenPurchases * 100) / 100,
        purchase_frequency_per_month: Math.round((sales.length / customerAgeMonths) * 100) / 100,
      },
      lifetime_value_calculations: {
        historical_ltv: Math.round(totalRevenue * 100) / 100,
        monthly_ltv: Math.round((totalRevenue / customerAgeMonths) * 100) / 100,
        annual_ltv: Math.round((totalRevenue / customerAgeYears) * 100) / 100,
        predicted_future_12m_value: Math.round(predictedFutureValue * 100) / 100,
        total_predicted_lifetime_value: Math.round((totalRevenue + predictedFutureValue) * 100) / 100,
        calculation_method: "Historical average with 12-month projection",
      },
      segmentation: {
        value_segment: valueSegment,
        retention_risk: retentionRisk,
        health_score: healthScore,
        purchase_behavior: sales.length > 10 ? "Frequent buyer" : "Occasional buyer",
        revenue_tier: totalRevenue > 5000 ? "Premium" : "Standard",
      },
      cohort_analysis: {
        cohort_month: cohortMonth,
        cohort_size: cohortCustomers,
        cohort_total_revenue: parseFloat(cohortRevenue.total) || 0,
        cohort_avg_ltv: Math.round(cohortAvgLTV * 100) / 100,
        customer_position_in_cohort: totalRevenue > cohortAvgLTV ? "Above average" : "Below average",
        percentile_rank: "Calculate based on cohort distribution",
      },
      predictive_metrics: {
        churn_probability: calculateChurnProbability(daysSinceLastPurchase, sales.length),
        next_purchase_prediction_days: Math.round(avgDaysBetweenPurchases),
        expected_lifetime_months: valueSegment === "VIP" ? 36 : valueSegment === "High" ? 24 : 12,
        potential_upsell_opportunity: valueSegment === "Low" ? "High" : valueSegment === "Medium" ? "Medium" : "Low",
      },
      insights: insights,
      recommendations: generateLTVRecommendations(
        valueSegment,
        retentionRisk,
        healthScore,
        daysSinceLastPurchase
      ),
      comparison_benchmarks: {
        industry_avg_ltv: 500, // Example industry benchmark
        business_avg_ltv: cohortAvgLTV,
        percentile_vs_peers: "Calculate from database",
      },
    };

    // Audit log
    await log_audit("fetch_ltv", "Customer", customer_id, userId, {
      customer_code: customer.customer_code,
      ltv_value: totalRevenue,
      purchase_count: sales.length,
      value_segment: valueSegment,
    });

    return {
      status: true,
      message: "Customer lifetime value calculated successfully",
      data: ltvReport,
      generated_at: new Date(),
      analysis_period: {
        historical_data_from: firstPurchase,
        historical_data_to: lastPurchase,
        projection_period_months: 12,
      },
    };
  } catch (error) {
    console.error("getCustomerLifetimeValue error:", error);

    await log_audit("error", "CustomerLTV", 0, userId, {
      customer_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to calculate customer lifetime value: ${error.message}`,
      data: null,
      generated_at: new Date(),
      analysis_period: null,
    };
  }
}

/**
 * Calculate customer health score
 */
// @ts-ignore
function calculateCustomerHealthScore(revenue, purchases, daysSinceLastPurchase, customerAgeMonths) {
  let score = 50; // Base score
  
  // Revenue contribution (0-25 points)
  if (revenue > 10000) score += 25;
  else if (revenue > 5000) score += 20;
  else if (revenue > 1000) score += 15;
  else if (revenue > 500) score += 10;
  else if (revenue > 100) score += 5;
  
  // Purchase frequency (0-15 points)
  const purchasesPerMonth = purchases / customerAgeMonths;
  if (purchasesPerMonth > 4) score += 15;
  else if (purchasesPerMonth > 2) score += 12;
  else if (purchasesPerMonth > 1) score += 10;
  else if (purchasesPerMonth > 0.5) score += 8;
  else if (purchasesPerMonth > 0.2) score += 5;
  
  // Recency (0-10 points)
  if (daysSinceLastPurchase <= 7) score += 10;
  else if (daysSinceLastPurchase <= 30) score += 8;
  else if (daysSinceLastPurchase <= 90) score += 5;
  else if (daysSinceLastPurchase <= 180) score += 2;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate churn probability
 */
// @ts-ignore
function calculateChurnProbability(daysSinceLastPurchase, totalPurchases) {
  if (daysSinceLastPurchase > 180) return "High (80-100%)";
  if (daysSinceLastPurchase > 90) return "Medium (50-80%)";
  if (daysSinceLastPurchase > 30) return "Low (20-50%)";
  if (totalPurchases < 3) return "Medium (50-80%)";
  return "Low (0-20%)";
}

/**
 * Generate LTV insights
 */
// @ts-ignore
function generateLTVInsights(revenue, purchases, daysSinceLastPurchase, valueSegment, retentionRisk) {
  const insights = [];
  
  if (revenue > 5000) {
    insights.push("High-value customer contributing significantly to revenue");
  }
  
  if (purchases > 10) {
    insights.push("Loyal customer with frequent purchases");
  }
  
  if (daysSinceLastPurchase > 90) {
    insights.push("Customer showing signs of inactivity");
  }
  
  if (valueSegment === "VIP" && retentionRisk === "Low") {
    insights.push("VIP customer with strong engagement - high retention expected");
  }
  
  if (revenue > 1000 && purchases < 3) {
    insights.push("High transaction value but low frequency - potential for more frequent purchases");
  }
  
  return insights;
}

/**
 * Generate LTV recommendations
 */
// @ts-ignore
function generateLTVRecommendations(valueSegment, retentionRisk, healthScore, daysSinceLastPurchase) {
  const recommendations = [];
  
  if (valueSegment === "VIP") {
    recommendations.push("Assign dedicated account manager");
    recommendations.push("Offer exclusive VIP benefits and early access");
    recommendations.push("Regular check-ins and personalized communications");
  }
  
  if (retentionRisk === "High") {
    recommendations.push("Implement re-engagement campaign");
    recommendations.push("Offer special promotion to encourage return");
    recommendations.push("Conduct win-back survey to understand churn reasons");
  }
  
  if (healthScore > 80) {
    recommendations.push("Focus on upselling and cross-selling opportunities");
    recommendations.push("Consider referral program incentives");
  }
  
  if (daysSinceLastPurchase > 60) {
    recommendations.push("Send personalized re-engagement email");
    recommendations.push("Check if customer needs assistance with recent purchase");
  }
  
  if (valueSegment === "Low" && healthScore < 50) {
    recommendations.push("Educate on product benefits and use cases");
    recommendations.push("Offer onboarding assistance if needed");
  }
  
  return recommendations;
}

module.exports = getCustomerLifetimeValue;