// inventory_transactions/reports/adjustments.ipc.js
//@ts-check
const Product = require("../../../../entities/Product");
const { InventoryAction } = require("../../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getStockAdjustmentSummary(filters = {}, userId) {
  try {
    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);
    // @ts-ignore
    const productRepo = AppDataSource.getRepository(Product);

    // Define adjustment actions
    const adjustmentActions = [
      InventoryAction.MANUAL_ADJUSTMENT,
      InventoryAction.QUICK_INCREASE,
      InventoryAction.QUICK_DECREASE,
      InventoryAction.BULK_INCREASE,
      InventoryAction.BULK_DECREASE,
      InventoryAction.CORRECTION,
      InventoryAction.STOCK_TAKE,
      InventoryAction.STOCK_SYNC,
    ];

    // Get date range (default to last 30 days)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Build query for adjustment transactions
    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .leftJoinAndSelect("transaction.location", "location")
      .where("transaction.created_at BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .andWhere("transaction.action IN (:...actions)", { actions: adjustmentActions })
      .orderBy("transaction.created_at", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("transaction.performed_by_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.location_id) {
      queryBuilder.andWhere("transaction.location_id = :location_id", {
        // @ts-ignore
        location_id: filters.location_id,
      });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("transaction.action = :action", { action: filters.action });
    }

    const adjustments = await queryBuilder.getMany();

    if (adjustments.length === 0) {
      return {
        status: true,
        message: "No stock adjustments found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          summary: {
            total_adjustments: 0,
            total_increase: 0,
            total_decrease: 0,
            net_adjustment: 0,
            unique_products: 0,
            unique_users: 0,
          },
          adjustments: [],
          product_adjustments: [],
          user_adjustments: [],
          insights: [],
        },
      };
    }

    // Calculate summary statistics
    const summary = {
      total_adjustments: adjustments.length,
      total_increase: adjustments
        // @ts-ignore
        .filter(a => a.change_amount > 0)
        // @ts-ignore
        .reduce((sum, a) => sum + a.change_amount, 0),
      total_decrease: Math.abs(adjustments
        // @ts-ignore
        .filter(a => a.change_amount < 0)
        // @ts-ignore
        .reduce((sum, a) => sum + a.change_amount, 0)),
      // @ts-ignore
      net_adjustment: adjustments.reduce((sum, a) => sum + a.change_amount, 0),
      unique_products: new Set(adjustments.map(a => a.product_id)).size,
      unique_users: new Set(adjustments.map(a => a.performed_by_id)).size,
      total_monetary_impact: adjustments.reduce((sum, a) => 
        // @ts-ignore
        sum + (a.change_amount * (a.price_before || 0)), 0),
      // @ts-ignore
      average_adjustment: adjustments.reduce((sum, a) => sum + a.change_amount, 0) / adjustments.length,
      // @ts-ignore
      period_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    };

    // Group adjustments by action type
    const actionBreakdown = {};
    adjustments.forEach(adjustment => {
      // @ts-ignore
      if (!actionBreakdown[adjustment.action]) {
        // @ts-ignore
        actionBreakdown[adjustment.action] = {
          count: 0,
          total_change: 0,
          average_change: 0,
          increases: 0,
          decreases: 0,
          monetary_impact: 0,
        };
      }
      // @ts-ignore
      actionBreakdown[adjustment.action].count++;
      // @ts-ignore
      actionBreakdown[adjustment.action].total_change += adjustment.change_amount;
      // @ts-ignore
      actionBreakdown[adjustment.action].monetary_impact += 
        // @ts-ignore
        adjustment.change_amount * (adjustment.price_before || 0);
      
      // @ts-ignore
      if (adjustment.change_amount > 0) {
        // @ts-ignore
        actionBreakdown[adjustment.action].increases++;
      } else {
        // @ts-ignore
        actionBreakdown[adjustment.action].decreases++;
      }
    });

    // Calculate averages
    Object.keys(actionBreakdown).forEach(action => {
      // @ts-ignore
      actionBreakdown[action].average_change = 
        // @ts-ignore
        actionBreakdown[action].total_change / actionBreakdown[action].count;
    });

    // Group by product
    const productAdjustments = {};
    adjustments.forEach(adjustment => {
      const productId = adjustment.product_id;
      // @ts-ignore
      if (!productAdjustments[productId]) {
        // @ts-ignore
        productAdjustments[productId] = {
          product_id: productId,
          // @ts-ignore
          product_name: adjustment.product?.name || `Product ${productId}`,
          // @ts-ignore
          sku: adjustment.product?.sku || 'N/A',
          adjustments: [],
          total_adjustments: 0,
          total_increase: 0,
          total_decrease: 0,
          net_adjustment: 0,
          average_adjustment: 0,
          first_adjustment: null,
          last_adjustment: null,
        };
      }

      // @ts-ignore
      productAdjustments[productId].adjustments.push({
        id: adjustment.id,
        action: adjustment.action,
        change_amount: adjustment.change_amount,
        quantity_before: adjustment.quantity_before,
        quantity_after: adjustment.quantity_after,
        date: adjustment.created_at,
        // @ts-ignore
        performed_by: adjustment.performed_by ? {
          // @ts-ignore
          id: adjustment.performed_by.id,
          // @ts-ignore
          username: adjustment.performed_by.username,
        } : null,
        notes: adjustment.notes,
      });

      // @ts-ignore
      productAdjustments[productId].total_adjustments++;
      
      // @ts-ignore
      if (adjustment.change_amount > 0) {
        // @ts-ignore
        productAdjustments[productId].total_increase += adjustment.change_amount;
      } else {
        // @ts-ignore
        productAdjustments[productId].total_decrease += Math.abs(adjustment.change_amount);
      }
      
      // @ts-ignore
      productAdjustments[productId].net_adjustment += adjustment.change_amount;

      // Update first and last adjustment dates
      // @ts-ignore
      const adjustmentDate = new Date(adjustment.created_at);
      // @ts-ignore
      if (!productAdjustments[productId].first_adjustment || 
          // @ts-ignore
          adjustmentDate < new Date(productAdjustments[productId].first_adjustment)) {
        // @ts-ignore
        productAdjustments[productId].first_adjustment = adjustment.created_at;
      }
      // @ts-ignore
      if (!productAdjustments[productId].last_adjustment || 
          // @ts-ignore
          adjustmentDate > new Date(productAdjustments[productId].last_adjustment)) {
        // @ts-ignore
        productAdjustments[productId].last_adjustment = adjustment.created_at;
      }
    });

    // Calculate averages and convert to array
    const productAdjustmentsArray = Object.values(productAdjustments)
      .map(product => ({
        ...product,
        average_adjustment: product.net_adjustment / product.total_adjustments,
        adjustment_frequency: product.total_adjustments / summary.period_days,
        consistency_score: calculateConsistencyScore(product.adjustments),
      }));

    // Group by user
    const userAdjustments = {};
    adjustments.forEach(adjustment => {
      if (!adjustment.performed_by_id) return;
      
      const userId = adjustment.performed_by_id;
      // @ts-ignore
      if (!userAdjustments[userId]) {
        // @ts-ignore
        userAdjustments[userId] = {
          user_id: userId,
          // @ts-ignore
          username: adjustment.performed_by?.username || `User ${userId}`,
          // @ts-ignore
          display_name: adjustment.performed_by?.display_name || 'N/A',
          adjustments: [],
          total_adjustments: 0,
          total_increase: 0,
          total_decrease: 0,
          net_adjustment: 0,
          first_adjustment: null,
          last_adjustment: null,
        };
      }

      // @ts-ignore
      userAdjustments[userId].adjustments.push({
        id: adjustment.id,
        action: adjustment.action,
        change_amount: adjustment.change_amount,
        // @ts-ignore
        product_name: adjustment.product?.name,
        date: adjustment.created_at,
      });

      // @ts-ignore
      userAdjustments[userId].total_adjustments++;
      
      // @ts-ignore
      if (adjustment.change_amount > 0) {
        // @ts-ignore
        userAdjustments[userId].total_increase += adjustment.change_amount;
      } else {
        // @ts-ignore
        userAdjustments[userId].total_decrease += Math.abs(adjustment.change_amount);
      }
      
      // @ts-ignore
      userAdjustments[userId].net_adjustment += adjustment.change_amount;

      // Update first and last adjustment dates
      // @ts-ignore
      const adjustmentDate = new Date(adjustment.created_at);
      // @ts-ignore
      if (!userAdjustments[userId].first_adjustment || 
          // @ts-ignore
          adjustmentDate < new Date(userAdjustments[userId].first_adjustment)) {
        // @ts-ignore
        userAdjustments[userId].first_adjustment = adjustment.created_at;
      }
      // @ts-ignore
      if (!userAdjustments[userId].last_adjustment || 
          // @ts-ignore
          adjustmentDate > new Date(userAdjustments[userId].last_adjustment)) {
        // @ts-ignore
        userAdjustments[userId].last_adjustment = adjustment.created_at;
      }
    });

    // Calculate averages and convert to array
    const userAdjustmentsArray = Object.values(userAdjustments)
      .map(user => ({
        ...user,
        average_adjustment: user.net_adjustment / user.total_adjustments,
        adjustments_per_day: user.total_adjustments / summary.period_days,
        impact_per_adjustment: Math.abs(user.net_adjustment) / user.total_adjustments,
      }));

    // Sort arrays for reporting
    const topProductsByAdjustments = [...productAdjustmentsArray]
      .sort((a, b) => b.total_adjustments - a.total_adjustments)
      .slice(0, 10);

    const topProductsByNetChange = [...productAdjustmentsArray]
      .sort((a, b) => Math.abs(b.net_adjustment) - Math.abs(a.net_adjustment))
      .slice(0, 10);

    const topUsersByAdjustments = [...userAdjustmentsArray]
      .sort((a, b) => b.total_adjustments - a.total_adjustments)
      .slice(0, 10);

    const topUsersByNetChange = [...userAdjustmentsArray]
      .sort((a, b) => Math.abs(b.net_adjustment) - Math.abs(a.net_adjustment))
      .slice(0, 10);

    // Group by day for trend analysis
    const dailyTrend = {};
    adjustments.forEach(adjustment => {
      // @ts-ignore
      const date = adjustment.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyTrend[date]) {
        // @ts-ignore
        dailyTrend[date] = {
          date,
          adjustments: 0,
          increase: 0,
          decrease: 0,
          net_adjustment: 0,
          users: new Set(),
          products: new Set(),
        };
      }
      // @ts-ignore
      dailyTrend[date].adjustments++;
      // @ts-ignore
      if (adjustment.change_amount > 0) {
        // @ts-ignore
        dailyTrend[date].increase += adjustment.change_amount;
      } else {
        // @ts-ignore
        dailyTrend[date].decrease += Math.abs(adjustment.change_amount);
      }
      // @ts-ignore
      dailyTrend[date].net_adjustment += adjustment.change_amount;
      
      if (adjustment.performed_by_id) {
        // @ts-ignore
        dailyTrend[date].users.add(adjustment.performed_by_id);
      }
      // @ts-ignore
      dailyTrend[date].products.add(adjustment.product_id);
    });

    // Convert Sets to counts
    Object.keys(dailyTrend).forEach(date => {
      // @ts-ignore
      dailyTrend[date].unique_users = dailyTrend[date].users.size;
      // @ts-ignore
      dailyTrend[date].unique_products = dailyTrend[date].products.size;
      // @ts-ignore
      delete dailyTrend[date].users;
      // @ts-ignore
      delete dailyTrend[date].products;
    });

    const dailyTrendArray = Object.values(dailyTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate insights
    const insights = generateAdjustmentInsights(summary, actionBreakdown, 
      productAdjustmentsArray, userAdjustmentsArray, dailyTrendArray);

    await log_audit("adjustment_report", "InventoryTransactionLog", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_adjustments: summary.total_adjustments,
      unique_products: summary.unique_products,
    });

    return {
      status: true,
      message: "Stock adjustment summary generated successfully",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: summary.period_days,
        },
        summary,
        action_breakdown: actionBreakdown,
        adjustments,
        product_adjustments: productAdjustmentsArray,
        user_adjustments: userAdjustmentsArray,
        top_lists: {
          products_by_adjustments: topProductsByAdjustments,
          products_by_net_change: topProductsByNetChange,
          users_by_adjustments: topUsersByAdjustments,
          users_by_net_change: topUsersByNetChange,
        },
        daily_trend: dailyTrendArray,
        insights,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getStockAdjustmentSummary error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      action: "adjustment_report",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate stock adjustment summary: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Calculate consistency score for adjustments (higher = more consistent)
 */
// @ts-ignore
function calculateConsistencyScore(adjustments) {
  if (adjustments.length < 2) return 0;
  
  // @ts-ignore
  const changes = adjustments.map(a => a.change_amount);
  // @ts-ignore
  const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  // @ts-ignore
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency
  const maxExpectedChange = Math.max(...changes.map(Math.abs));
  if (maxExpectedChange === 0) return 100;
  
  const consistency = 100 * (1 - (stdDev / maxExpectedChange));
  return Math.max(0, Math.min(100, consistency));
}

/**
 * Generate insights from adjustment data
 */
// @ts-ignore
function generateAdjustmentInsights(summary, actionBreakdown, 
  // @ts-ignore
  productAdjustments, userAdjustments, dailyTrend) {
  const insights = [];

  // Overall adjustment insight
  const adjustmentsPerDay = summary.total_adjustments / summary.period_days;
  if (adjustmentsPerDay > 5) {
    insights.push({
      type: 'high_adjustment_frequency',
      message: `High adjustment frequency: ${adjustmentsPerDay.toFixed(1)} adjustments per day on average`,
      priority: 'medium',
      data: { adjustments_per_day: adjustmentsPerDay },
    });
  }

  // Net adjustment insight
  if (summary.net_adjustment > 0) {
    insights.push({
      type: 'net_positive_adjustment',
      message: `Net positive adjustment: ${summary.net_adjustment} units added overall`,
      priority: 'medium',
      data: { net_adjustment: summary.net_adjustment },
    });
  } else if (summary.net_adjustment < 0) {
    insights.push({
      type: 'net_negative_adjustment',
      message: `Net negative adjustment: ${Math.abs(summary.net_adjustment)} units removed overall`,
      priority: 'medium',
      data: { net_adjustment: summary.net_adjustment },
    });
  }

  // Most common action insight
  const mostCommonAction = Object.entries(actionBreakdown)
    .reduce((max, [action, data]) => data.count > max.count ? { action, ...data } : max, 
            { action: '', count: 0 });
  
  if (mostCommonAction.action) {
    const percentage = (mostCommonAction.count / summary.total_adjustments) * 100;
    insights.push({
      type: 'common_adjustment_type',
      message: `Most common adjustment type: ${mostCommonAction.action} (${percentage.toFixed(1)}% of adjustments)`,
      priority: 'low',
      data: {
        action: mostCommonAction.action,
        percentage: percentage,
        count: mostCommonAction.count,
      },
    });
  }

  // Product concentration insight
  if (productAdjustments.length > 0) {
    const topProduct = productAdjustments
      // @ts-ignore
      .reduce((max, product) => product.total_adjustments > max.total_adjustments ? product : max);
    
    const concentration = (topProduct.total_adjustments / summary.total_adjustments) * 100;
    if (concentration > 20) {
      insights.push({
        type: 'product_concentration',
        message: `${topProduct.product_name} accounts for ${concentration.toFixed(1)}% of all adjustments`,
        priority: 'medium',
        data: {
          product_name: topProduct.product_name,
          concentration: concentration,
          adjustments: topProduct.total_adjustments,
        },
      });
    }
  }

  // User concentration insight
  if (userAdjustments.length > 0) {
    const topUser = userAdjustments
      // @ts-ignore
      .reduce((max, user) => user.total_adjustments > max.total_adjustments ? user : max);
    
    const concentration = (topUser.total_adjustments / summary.total_adjustments) * 100;
    if (concentration > 30) {
      insights.push({
        type: 'user_concentration',
        message: `${topUser.username} accounts for ${concentration.toFixed(1)}% of all adjustments`,
        priority: 'medium',
        data: {
          username: topUser.username,
          concentration: concentration,
          adjustments: topUser.total_adjustments,
        },
      });
    }
  }

  // Daily consistency insight
  // @ts-ignore
  const daysWithAdjustments = dailyTrend.filter(day => day.adjustments > 0).length;
  const consistency = (daysWithAdjustments / summary.period_days) * 100;
  
  if (consistency < 50) {
    insights.push({
      type: 'inconsistent_adjustments',
      message: `Adjustments only made on ${consistency.toFixed(1)}% of days (${daysWithAdjustments}/${summary.period_days} days)`,
      priority: 'medium',
      data: { consistency_percentage: consistency, active_days: daysWithAdjustments },
    });
  }

  // Large adjustments insight
  const largeAdjustments = productAdjustments
    // @ts-ignore
    .filter(product => Math.abs(product.net_adjustment) > 100)
    .slice(0, 5);
  
  if (largeAdjustments.length > 0) {
    insights.push({
      type: 'large_adjustments',
      message: `${largeAdjustments.length} products with adjustments over 100 units`,
      priority: 'high',
      data: {
        // @ts-ignore
        products: largeAdjustments.map(p => ({
          product_name: p.product_name,
          net_adjustment: p.net_adjustment,
        })),
      },
    });
  }

  // Frequent adjustment insight
  const frequentProducts = productAdjustments
    // @ts-ignore
    .filter(product => product.adjustment_frequency > 0.5)
    .slice(0, 5);
  
  if (frequentProducts.length > 0) {
    insights.push({
      type: 'frequent_adjustments',
      message: `${frequentProducts.length} products adjusted more than once every 2 days`,
      priority: 'medium',
      data: {
        // @ts-ignore
        products: frequentProducts.map(p => ({
          product_name: p.product_name,
          adjustment_frequency: p.adjustment_frequency,
        })),
      },
    });
  }

  return insights;
}

module.exports = getStockAdjustmentSummary;