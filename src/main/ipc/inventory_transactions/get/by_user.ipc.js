// inventory_transactions/get/by_user.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} userId
 * @param {Object} filters
 * @param {number} currentUserId
 */
async function getTransactionLogsByUser(userId, filters = {}, currentUserId) {
  try {
    if (!userId) {
      return {
        status: false,
        message: "User ID is required",
        data: null,
      };
    }

    // Check if user exists
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return {
        status: false,
        message: `User with ID ${userId} not found`,
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.location", "location")
      .where("transaction.performed_by_id = :user_id", { 
        user_id: userId.toString() 
      })
      .orderBy("transaction.created_at", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("transaction.created_at BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("transaction.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
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
    if (filters.change_type) {
      // @ts-ignore
      if (filters.change_type === 'increase') {
        queryBuilder.andWhere("transaction.change_amount > 0");
      // @ts-ignore
      } else if (filters.change_type === 'decrease') {
        queryBuilder.andWhere("transaction.change_amount < 0");
      // @ts-ignore
      } else if (filters.change_type === 'no_change') {
        queryBuilder.andWhere("transaction.change_amount = 0");
      }
    }

    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
    }

    const transactions = await queryBuilder.getMany();

    if (transactions.length === 0) {
      return {
        status: true,
        message: `No transaction logs found for user: ${user.username}`,
        data: {
          user_info: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
          },
          transactions: [],
          summary: {
            total_transactions: 0,
            total_impact: 0,
            product_count: 0,
          },
        },
      };
    }

    // Calculate user activity metrics
    const userMetrics = {
      total_transactions: transactions.length,
      first_transaction: transactions[transactions.length - 1].created_at,
      last_transaction: transactions[0].created_at,
      // @ts-ignore
      days_active: new Set(transactions.map(t => t.created_at.toISOString().split('T')[0])).size,
      total_increase: transactions
        // @ts-ignore
        .filter(t => t.change_amount > 0)
        // @ts-ignore
        .reduce((sum, t) => sum + t.change_amount, 0),
      total_decrease: Math.abs(transactions
        // @ts-ignore
        .filter(t => t.change_amount < 0)
        // @ts-ignore
        .reduce((sum, t) => sum + t.change_amount, 0)),
      // @ts-ignore
      net_change: transactions.reduce((sum, t) => sum + t.change_amount, 0),
      unique_products: new Set(transactions.map(t => t.product_id)).size,
      unique_locations: new Set(transactions.map(t => t.location_id).filter(id => id)).size,
      total_monetary_impact: transactions.reduce((sum, t) => 
        // @ts-ignore
        sum + (t.change_amount * (t.price_before || 0)), 0),
    };

    // Calculate average transactions per day
    // @ts-ignore
    const dateRange = filters.start_date && filters.end_date ? 
      // @ts-ignore
      (new Date(filters.end_date) - new Date(filters.start_date)) / (1000 * 60 * 60 * 24) :
      // @ts-ignore
      (new Date() - new Date(userMetrics.first_transaction)) / (1000 * 60 * 60 * 24);
    
    // @ts-ignore
    userMetrics.transactions_per_day = userMetrics.total_transactions / Math.max(1, dateRange);

    // Group by action type
    const actionBreakdown = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      if (!actionBreakdown[transaction.action]) {
        // @ts-ignore
        actionBreakdown[transaction.action] = {
          count: 0,
          total_change: 0,
          average_change: 0,
        };
      }
      // @ts-ignore
      actionBreakdown[transaction.action].count++;
      // @ts-ignore
      actionBreakdown[transaction.action].total_change += transaction.change_amount;
    });

    // Calculate averages
    Object.keys(actionBreakdown).forEach(action => {
      // @ts-ignore
      actionBreakdown[action].average_change = 
        // @ts-ignore
        actionBreakdown[action].total_change / actionBreakdown[action].count;
    });

    // Group by product
    const productActivity = {};
    transactions.forEach(transaction => {
      const productId = transaction.product_id;
      // @ts-ignore
      if (!productActivity[productId]) {
        // @ts-ignore
        productActivity[productId] = {
          product_id: productId,
          // @ts-ignore
          product_name: transaction.product?.name || `Product ${productId}`,
          transactions: 0,
          total_change: 0,
          increase: 0,
          decrease: 0,
        };
      }
      // @ts-ignore
      productActivity[productId].transactions++;
      // @ts-ignore
      productActivity[productId].total_change += transaction.change_amount;
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        productActivity[productId].increase += transaction.change_amount;
      } else {
        // @ts-ignore
        productActivity[productId].decrease += Math.abs(transaction.change_amount);
      }
    });

    // Get top 5 products by transaction count
    // @ts-ignore
    const topProducts = Object.values(productActivity)
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 5);

    // Group by date for activity trend
    const activityTrend = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      const date = transaction.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!activityTrend[date]) {
        // @ts-ignore
        activityTrend[date] = {
          date,
          transactions: 0,
          total_change: 0,
        };
      }
      // @ts-ignore
      activityTrend[date].transactions++;
      // @ts-ignore
      activityTrend[date].total_change += transaction.change_amount;
    });

    const activityTrendArray = Object.values(activityTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get recent activity
    // @ts-ignore
    const recentActivity = transactions.slice(0, 10).map(t => ({
      id: t.id,
      action: t.action,
      // @ts-ignore
      product_name: t.product?.name,
      change_amount: t.change_amount,
      created_at: t.created_at,
      // @ts-ignore
      location: t.location ? {
        // @ts-ignore
        id: t.location.id,
        // @ts-ignore
        name: t.location.name,
      } : null,
    }));

    // Generate user insights
    const insights = generateUserInsights(userMetrics, actionBreakdown);

    await log_audit("fetch_by_user", "InventoryTransactionLog", 0, currentUserId, {
      target_user_id: userId,
      user_name: user.username,
      transactions_count: transactions.length,
    });

    return {
      status: true,
      message: `Transaction logs for ${user.username} retrieved successfully`,
      data: {
        user_info: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
          employee_id: user.employee_id,
          department: user.department,
        },
        transactions,
        user_metrics: userMetrics,
        action_breakdown: actionBreakdown,
        product_activity: productActivity,
        // @ts-ignore
        top_products,
        activity_trend: activityTrendArray,
        // @ts-ignore
        recent_activity,
        insights,
        // @ts-ignore
        period: filters.start_date && filters.end_date ? 
          // @ts-ignore
          `${filters.start_date} to ${filters.end_date}` : 'All time',
      },
    };
  } catch (error) {
    console.error("getTransactionLogsByUser error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, currentUserId, {
      target_user_id: userId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get transaction logs by user: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate insights about user activity
 */
// @ts-ignore
function generateUserInsights(metrics, actionBreakdown) {
  const insights = [];

  // Activity level insight
  if (metrics.transactions_per_day > 5) {
    insights.push({
      type: 'high_activity',
      message: `High activity level: ${metrics.transactions_per_day.toFixed(1)} transactions per day`,
      priority: 'medium',
      data: { transactions_per_day: metrics.transactions_per_day },
    });
  } else if (metrics.transactions_per_day < 0.5) {
    insights.push({
      type: 'low_activity',
      message: `Low activity level: ${metrics.transactions_per_day.toFixed(1)} transactions per day`,
      priority: 'low',
      data: { transactions_per_day: metrics.transactions_per_day },
    });
  }

  // Impact insight
  if (metrics.net_change > 0) {
    insights.push({
      type: 'net_positive_impact',
      message: `Net positive impact: Increased stock by ${metrics.net_change} units`,
      priority: 'medium',
      data: { net_change: metrics.net_change },
    });
  } else if (metrics.net_change < 0) {
    insights.push({
      type: 'net_negative_impact',
      message: `Net negative impact: Decreased stock by ${Math.abs(metrics.net_change)} units`,
      priority: 'medium',
      data: { net_change: metrics.net_change },
    });
  }

  // Product diversity insight
  if (metrics.unique_products > 20) {
    insights.push({
      type: 'high_product_diversity',
      message: `Works with ${metrics.unique_products} different products`,
      priority: 'low',
      data: { unique_products: metrics.unique_products },
    });
  }

  // Most common action insight
  const mostCommonAction = Object.entries(actionBreakdown)
    .reduce((max, [action, data]) => data.count > max.count ? { action, ...data } : max, 
            { action: '', count: 0 });
  
  if (mostCommonAction.action) {
    const percentage = (mostCommonAction.count / metrics.total_transactions) * 100;
    insights.push({
      type: 'common_action',
      message: `Most common action: ${mostCommonAction.action} (${percentage.toFixed(1)}% of transactions)`,
      priority: 'low',
      data: {
        action: mostCommonAction.action,
        percentage: percentage,
        count: mostCommonAction.count,
      },
    });
  }

  // Monetary impact insight
  if (Math.abs(metrics.total_monetary_impact) > 10000) {
    const impactType = metrics.total_monetary_impact > 0 ? 'positive' : 'negative';
    insights.push({
      type: 'significant_monetary_impact',
      message: `Significant ${impactType} monetary impact: ₱${Math.abs(metrics.total_monetary_impact).toLocaleString()}`,
      priority: 'high',
      data: { monetary_impact: metrics.total_monetary_impact },
    });
  }

  return insights;
}

module.exports = getTransactionLogsByUser;