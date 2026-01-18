// inventory_transactions/reports/statistics.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const Product = require("../../../../entities/Product");
// @ts-ignore
const { InventoryAction } = require("../../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getTransactionStatistics(filters = {}, userId) {
  try {
    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);
    const productRepo = AppDataSource.getRepository(Product);

    // Get date range (default to last 90 days)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Build query for all transactions
    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .leftJoinAndSelect("transaction.location", "location")
      .where("transaction.created_at BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      });

    // Apply additional filters
    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("transaction.action = :action", { action: filters.action });
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

    const transactions = await queryBuilder.getMany();

    if (transactions.length === 0) {
      return {
        status: true,
        message: "No transaction data found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          summary: {
            total_transactions: 0,
            total_products: 0,
            total_users: 0,
            total_locations: 0,
          },
          statistics: {},
          trends: {},
          comparisons: {},
          recommendations: [],
        },
      };
    }

    // Get product data for additional context
    const products = await productRepo.find({
      where: { is_deleted: false },
      select: ["id", "name", "sku", "stock", "category_name", "supplier_name"],
    });

    // Calculate comprehensive statistics
    const stats = calculateTransactionStatistics(transactions, products, startDate, endDate);

    // Generate trends
    const trends = calculateTransactionTrends(transactions, startDate, endDate);

    // Generate comparisons
    const comparisons = generateTransactionComparisons(stats, trends);

    // Generate recommendations
    const recommendations = generateTransactionRecommendations(stats, trends);

    await log_audit("transaction_statistics", "InventoryTransactionLog", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_transactions: transactions.length,
    });

    return {
      status: true,
      message: "Transaction statistics generated successfully",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: stats.period_days,
        },
        summary: {
          total_transactions: stats.total_transactions,
          total_products: stats.unique_products,
          total_users: stats.unique_users,
          total_locations: stats.unique_locations,
          period_days: stats.period_days,
        },
        statistics: stats,
        trends: trends,
        comparisons: comparisons,
        recommendations: recommendations,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getTransactionStatistics error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      action: "transaction_statistics",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate transaction statistics: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Calculate comprehensive transaction statistics
 * @param {any[]} transactions
 * @param {any[]} products
 * @param {number | Date} startDate
 * @param {number | Date} endDate
 */
function calculateTransactionStatistics(transactions, products, startDate, endDate) {
  // @ts-ignore
  const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Basic counts
  const stats = {
    total_transactions: transactions.length,
    unique_products: new Set(transactions.map((/** @type {{ product_id: any; }} */ t) => t.product_id)).size,
    unique_users: new Set(transactions.map((/** @type {{ performed_by_id: any; }} */ t) => t.performed_by_id).filter((/** @type {any} */ id) => id)).size,
    unique_locations: new Set(transactions.map((/** @type {{ location_id: any; }} */ t) => t.location_id).filter((/** @type {any} */ id) => id)).size,
    unique_actions: new Set(transactions.map((/** @type {{ action: any; }} */ t) => t.action)).size,
    period_days: periodDays,
  };

  // Volume statistics
  // @ts-ignore
  stats.total_increase = transactions
    .filter((/** @type {{ change_amount: number; }} */ t) => t.change_amount > 0)
    .reduce((/** @type {any} */ sum, /** @type {{ change_amount: any; }} */ t) => sum + t.change_amount, 0);
  
  // @ts-ignore
  stats.total_decrease = Math.abs(transactions
    .filter((/** @type {{ change_amount: number; }} */ t) => t.change_amount < 0)
    .reduce((/** @type {any} */ sum, /** @type {{ change_amount: any; }} */ t) => sum + t.change_amount, 0));
  
  // @ts-ignore
  stats.net_change = transactions.reduce((/** @type {any} */ sum, /** @type {{ change_amount: any; }} */ t) => sum + t.change_amount, 0);
  
  // @ts-ignore
  stats.total_volume = Math.abs(stats.total_increase) + Math.abs(stats.total_decrease);
  
  // @ts-ignore
  stats.average_daily_transactions = stats.total_transactions / periodDays;
  // @ts-ignore
  stats.average_transaction_volume = stats.total_volume / stats.total_transactions;
  // @ts-ignore
  stats.average_daily_volume = stats.total_volume / periodDays;

  // Monetary impact
  // @ts-ignore
  stats.total_monetary_impact = transactions.reduce((/** @type {number} */ sum, /** @type {{ change_amount: number; price_before: any; }} */ t) => 
    sum + (t.change_amount * (t.price_before || 0)), 0);
  
  // @ts-ignore
  stats.average_monetary_impact = stats.total_monetary_impact / stats.total_transactions;

  // Action type breakdown
  // @ts-ignore
  stats.action_breakdown = {};
  transactions.forEach((/** @type {{ action: string | number; change_amount: number; price_before: any; }} */ transaction) => {
    // @ts-ignore
    if (!stats.action_breakdown[transaction.action]) {
      // @ts-ignore
      stats.action_breakdown[transaction.action] = {
        count: 0,
        volume: 0,
        increase: 0,
        decrease: 0,
        net_change: 0,
        monetary_impact: 0,
      };
    }
    
    // @ts-ignore
    const breakdown = stats.action_breakdown[transaction.action];
    breakdown.count++;
    breakdown.volume += Math.abs(transaction.change_amount);
    breakdown.monetary_impact += transaction.change_amount * (transaction.price_before || 0);
    
    if (transaction.change_amount > 0) {
      breakdown.increase += transaction.change_amount;
    } else {
      breakdown.decrease += Math.abs(transaction.change_amount);
    }
    
    breakdown.net_change += transaction.change_amount;
  });

  // Calculate averages for each action
  // @ts-ignore
  Object.keys(stats.action_breakdown).forEach(action => {
    // @ts-ignore
    const breakdown = stats.action_breakdown[action];
    breakdown.average_volume = breakdown.volume / breakdown.count;
    breakdown.average_monetary_impact = breakdown.monetary_impact / breakdown.count;
    breakdown.percentage_of_total = (breakdown.count / stats.total_transactions) * 100;
  });

  // Time-based statistics
  const hourlyDistribution = Array(24).fill(0);
  const dayOfWeekDistribution = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, 
    Thursday: 0, Friday: 0, Saturday: 0
  };
  
  transactions.forEach((/** @type {{ created_at: string | number | Date; }} */ transaction) => {
    const date = new Date(transaction.created_at);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    hourlyDistribution[hour]++;
    // @ts-ignore
    dayOfWeekDistribution[day]++;
  });

  // @ts-ignore
  stats.time_distribution = {
    hourly: hourlyDistribution,
    daily: dayOfWeekDistribution,
    peak_hour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
    peak_day: Object.entries(dayOfWeekDistribution)
      .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 }).day,
  };

  // User activity statistics
  const userActivity = {};
  transactions.forEach((/** @type {{ performed_by_id: any; change_amount: number; created_at: string | number | Date; }} */ transaction) => {
    if (!transaction.performed_by_id) return;
    
    const userId = transaction.performed_by_id;
    // @ts-ignore
    if (!userActivity[userId]) {
      // @ts-ignore
      userActivity[userId] = {
        count: 0,
        volume: 0,
        increase: 0,
        decrease: 0,
        net_change: 0,
        first_transaction: null,
        last_transaction: null,
        days_active: new Set(),
      };
    }
    
    // @ts-ignore
    const userStats = userActivity[userId];
    userStats.count++;
    userStats.volume += Math.abs(transaction.change_amount);
    userStats.net_change += transaction.change_amount;
    
    if (transaction.change_amount > 0) {
      userStats.increase += transaction.change_amount;
    } else {
      userStats.decrease += Math.abs(transaction.change_amount);
    }
    
    // @ts-ignore
    const date = transaction.created_at.toISOString().split('T')[0];
    userStats.days_active.add(date);
    
    if (!userStats.first_transaction || new Date(transaction.created_at) < new Date(userStats.first_transaction)) {
      userStats.first_transaction = transaction.created_at;
    }
    if (!userStats.last_transaction || new Date(transaction.created_at) > new Date(userStats.last_transaction)) {
      userStats.last_transaction = transaction.created_at;
    }
  });

  // Convert Set to count and calculate averages
  Object.keys(userActivity).forEach(userId => {
    // @ts-ignore
    userActivity[userId].days_active_count = userActivity[userId].days_active.size;
    // @ts-ignore
    userActivity[userId].transactions_per_active_day = userActivity[userId].count / userActivity[userId].days_active_count;
    // @ts-ignore
    userActivity[userId].average_volume_per_transaction = userActivity[userId].volume / userActivity[userId].count;
    // @ts-ignore
    delete userActivity[userId].days_active;
  });

  // @ts-ignore
  stats.user_activity = userActivity;

  // Product activity statistics
  const productActivity = {};
  products.forEach((/** @type {{ id: string | number; name: any; sku: any; stock: any; category_name: any; supplier_name: any; }} */ product) => {
    // @ts-ignore
    productActivity[product.id] = {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      current_stock: product.stock,
      category: product.category_name,
      supplier: product.supplier_name,
      transactions: 0,
      volume: 0,
      increase: 0,
      decrease: 0,
      net_change: 0,
      turnover_rate: 0,
    };
  });

  transactions.forEach((/** @type {{ product_id: any; product: { name: any; sku: any; stock: any; category_name: any; supplier_name: any; }; change_amount: number; }} */ transaction) => {
    const productId = transaction.product_id;
    // @ts-ignore
    if (!productActivity[productId]) {
      // @ts-ignore
      productActivity[productId] = {
        product_id: productId,
        product_name: transaction.product?.name || `Product ${productId}`,
        sku: transaction.product?.sku || 'N/A',
        current_stock: transaction.product?.stock || 0,
        category: transaction.product?.category_name || 'Uncategorized',
        supplier: transaction.product?.supplier_name || 'Unknown',
        transactions: 0,
        volume: 0,
        increase: 0,
        decrease: 0,
        net_change: 0,
        turnover_rate: 0,
      };
    }
    
    // @ts-ignore
    const productStats = productActivity[productId];
    productStats.transactions++;
    productStats.volume += Math.abs(transaction.change_amount);
    productStats.net_change += transaction.change_amount;
    
    if (transaction.change_amount > 0) {
      productStats.increase += transaction.change_amount;
    } else {
      productStats.decrease += Math.abs(transaction.change_amount);
    }
  });

  // Calculate turnover rate
  Object.keys(productActivity).forEach(productId => {
    // @ts-ignore
    const productStats = productActivity[productId];
    if (productStats.current_stock > 0) {
      productStats.turnover_rate = Math.abs(productStats.net_change) / productStats.current_stock;
    }
  });

  // @ts-ignore
  stats.product_activity = productActivity;

  // Efficiency metrics
  // @ts-ignore
  stats.efficiency_metrics = {
    transactions_per_product: stats.total_transactions / stats.unique_products,
    // @ts-ignore
    volume_per_transaction: stats.total_volume / stats.total_transactions,
    // @ts-ignore
    volume_per_product: stats.total_volume / stats.unique_products,
    users_per_product: stats.unique_users / stats.unique_products,
    locations_per_product: stats.unique_locations / stats.unique_products,
  };

  // Consistency metrics
  const dailyTransactionCounts = {};
  transactions.forEach((/** @type {{ created_at: { toISOString: () => string; }; }} */ transaction) => {
    const date = transaction.created_at.toISOString().split('T')[0];
    // @ts-ignore
    dailyTransactionCounts[date] = (dailyTransactionCounts[date] || 0) + 1;
  });

  const dailyCounts = Object.values(dailyTransactionCounts);
  const meanDailyTransactions = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
  const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - meanDailyTransactions, 2), 0) / dailyCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // @ts-ignore
  stats.consistency_metrics = {
    days_with_transactions: Object.keys(dailyTransactionCounts).length,
    transaction_coverage: (Object.keys(dailyTransactionCounts).length / periodDays) * 100,
    daily_transaction_mean: meanDailyTransactions,
    daily_transaction_std_dev: stdDev,
    consistency_score: stdDev > 0 ? (1 - (stdDev / meanDailyTransactions)) * 100 : 100,
  };

  return stats;
}

/**
 * Calculate transaction trends
 * @param {any[]} transactions
 * @param {string | number | Date} startDate
 * @param {number | Date} endDate
 */
function calculateTransactionTrends(transactions, startDate, endDate) {
  const trends = {
    daily: {},
    weekly: {},
    monthly: {},
  };

  // Initialize date ranges
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    // @ts-ignore
    trends.daily[dateStr] = {
      date: dateStr,
      transactions: 0,
      volume: 0,
      increase: 0,
      decrease: 0,
      net_change: 0,
      users: new Set(),
      products: new Set(),
    };
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill in transaction data
  transactions.forEach((/** @type {{ created_at: string | number | Date; change_amount: number; performed_by_id: any; product_id: any; }} */ transaction) => {
    const date = new Date(transaction.created_at);
    const dateStr = date.toISOString().split('T')[0];
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Daily trends
    // @ts-ignore
    if (trends.daily[dateStr]) {
      // @ts-ignore
      const daily = trends.daily[dateStr];
      daily.transactions++;
      daily.volume += Math.abs(transaction.change_amount);
      daily.net_change += transaction.change_amount;
      
      if (transaction.change_amount > 0) {
        daily.increase += transaction.change_amount;
      } else {
        daily.decrease += Math.abs(transaction.change_amount);
      }
      
      if (transaction.performed_by_id) {
        daily.users.add(transaction.performed_by_id);
      }
      daily.products.add(transaction.product_id);
    }

    // Weekly trends
    // @ts-ignore
    if (!trends.weekly[weekKey]) {
      // @ts-ignore
      trends.weekly[weekKey] = {
        week: weekKey,
        transactions: 0,
        volume: 0,
        increase: 0,
        decrease: 0,
        net_change: 0,
        days: 0,
      };
    }
    
    // @ts-ignore
    const weekly = trends.weekly[weekKey];
    weekly.transactions++;
    weekly.volume += Math.abs(transaction.change_amount);
    weekly.net_change += transaction.change_amount;
    
    if (transaction.change_amount > 0) {
      weekly.increase += transaction.change_amount;
    } else {
      weekly.decrease += Math.abs(transaction.change_amount);
    }

    // Monthly trends
    // @ts-ignore
    if (!trends.monthly[monthKey]) {
      // @ts-ignore
      trends.monthly[monthKey] = {
        month: monthKey,
        transactions: 0,
        volume: 0,
        increase: 0,
        decrease: 0,
        net_change: 0,
        weeks: 0,
      };
    }
    
    // @ts-ignore
    const monthly = trends.monthly[monthKey];
    monthly.transactions++;
    monthly.volume += Math.abs(transaction.change_amount);
    monthly.net_change += transaction.change_amount;
    
    if (transaction.change_amount > 0) {
      monthly.increase += transaction.change_amount;
    } else {
      monthly.decrease += Math.abs(transaction.change_amount);
    }
  });

  // Convert Sets to counts and calculate additional metrics
  Object.keys(trends.daily).forEach(date => {
    // @ts-ignore
    const daily = trends.daily[date];
    daily.unique_users = daily.users.size;
    daily.unique_products = daily.products.size;
    daily.average_volume = daily.transactions > 0 ? daily.volume / daily.transactions : 0;
    delete daily.users;
    delete daily.products;
  });

  // Calculate weekly metrics
  Object.keys(trends.weekly).forEach(weekKey => {
    // @ts-ignore
    const weekly = trends.weekly[weekKey];
    weekly.average_daily_transactions = weekly.transactions / 7;
    weekly.average_daily_volume = weekly.volume / 7;
  });

  // Calculate monthly metrics
  Object.keys(trends.monthly).forEach(monthKey => {
    // @ts-ignore
    const monthly = trends.monthly[monthKey];
    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    monthly.average_daily_transactions = monthly.transactions / daysInMonth;
    monthly.average_daily_volume = monthly.volume / daysInMonth;
    monthly.average_weekly_transactions = monthly.transactions / 4.33; // Approximate weeks per month
    monthly.average_weekly_volume = monthly.volume / 4.33;
  });

  // Convert to arrays for easier consumption
  // @ts-ignore
  trends.daily_array = Object.values(trends.daily)
    // @ts-ignore
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // @ts-ignore
  trends.weekly_array = Object.values(trends.weekly)
    .sort((a, b) => a.week.localeCompare(b.week));
  
  // @ts-ignore
  trends.monthly_array = Object.values(trends.monthly)
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate growth rates
  // @ts-ignore
  if (trends.daily_array.length >= 2) {
    // @ts-ignore
    const firstDay = trends.daily_array[0];
    // @ts-ignore
    const lastDay = trends.daily_array[trends.daily_array.length - 1];
    
    // @ts-ignore
    trends.growth_rates = {
      daily_transaction_growth: ((lastDay.transactions - firstDay.transactions) / firstDay.transactions) * 100,
      daily_volume_growth: ((lastDay.volume - firstDay.volume) / firstDay.volume) * 100,
      daily_user_growth: ((lastDay.unique_users - firstDay.unique_users) / firstDay.unique_users) * 100,
      daily_product_growth: ((lastDay.unique_products - firstDay.unique_products) / firstDay.unique_products) * 100,
    };
  }

  return trends;
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
 * Generate transaction comparisons
 * @param {{ total_transactions: any; unique_products?: number; unique_users?: number; unique_locations?: number; unique_actions?: number; period_days?: number; action_breakdown?: any; user_activity?: any; product_activity?: any; average_daily_transactions?: any; consistency_metrics?: any; }} stats
 * @param {{ daily?: {}; weekly?: {}; monthly?: {}; daily_array?: any; weekly_array?: any; monthly_array?: any; }} trends
 */
function generateTransactionComparisons(stats, trends) {
  const comparisons = {
    period_vs_period: {},
    action_comparisons: {},
    user_comparisons: {},
    product_comparisons: {},
  };

  // Compare current period to previous period (if we had data)
  comparisons.period_vs_period = {
    description: "Comparison would require historical data from previous period",
    available: false,
  };

  // Compare actions
  const actionArray = Object.entries(stats.action_breakdown)
    .map(([action, data]) => ({ action, ...data }))
    .sort((a, b) => b.count - a.count);
  
  if (actionArray.length >= 2) {
    const topAction = actionArray[0];
    const secondAction = actionArray[1];
    
    comparisons.action_comparisons = {
      top_action: topAction.action,
      top_action_percentage: topAction.percentage_of_total,
      second_action: secondAction.action,
      second_action_percentage: secondAction.percentage_of_total,
      difference: topAction.percentage_of_total - secondAction.percentage_of_total,
      volume_ratio: topAction.volume / secondAction.volume,
    };
  }

  // Compare users
  const userArray = Object.entries(stats.user_activity)
    .map(([userId, data]) => ({ user_id: userId, ...data }))
    .sort((a, b) => b.count - a.count);
  
  if (userArray.length >= 2) {
    const topUser = userArray[0];
    const secondUser = userArray[1];
    
    comparisons.user_comparisons = {
      top_user_id: topUser.user_id,
      top_user_transactions: topUser.count,
      top_user_percentage: (topUser.count / stats.total_transactions) * 100,
      second_user_id: secondUser.user_id,
      second_user_transactions: secondUser.count,
      second_user_percentage: (secondUser.count / stats.total_transactions) * 100,
      transaction_ratio: topUser.count / secondUser.count,
    };
  }

  // Compare products
  const productArray = Object.values(stats.product_activity)
    .filter(product => product.transactions > 0)
    .sort((a, b) => b.transactions - a.transactions);
  
  if (productArray.length >= 2) {
    const topProduct = productArray[0];
    const secondProduct = productArray[1];
    
    comparisons.product_comparisons = {
      top_product_id: topProduct.product_id,
      top_product_name: topProduct.product_name,
      top_product_transactions: topProduct.transactions,
      top_product_percentage: (topProduct.transactions / stats.total_transactions) * 100,
      second_product_id: secondProduct.product_id,
      second_product_name: secondProduct.product_name,
      second_product_transactions: secondProduct.transactions,
      second_product_percentage: (secondProduct.transactions / stats.total_transactions) * 100,
      transaction_ratio: topProduct.transactions / secondProduct.transactions,
      volume_ratio: topProduct.volume / secondProduct.volume,
    };
  }

  // Daily vs weekly vs monthly comparison
  if (trends.daily_array.length > 0 && trends.weekly_array.length > 0 && trends.monthly_array.length > 0) {
    const avgDailyTransactions = stats.average_daily_transactions;
    const avgWeeklyTransactions = trends.weekly_array.reduce((/** @type {any} */ sum, /** @type {{ transactions: any; }} */ week) => sum + week.transactions, 0) / trends.weekly_array.length;
    const avgMonthlyTransactions = trends.monthly_array.reduce((/** @type {any} */ sum, /** @type {{ transactions: any; }} */ month) => sum + month.transactions, 0) / trends.monthly_array.length;
    
    // @ts-ignore
    comparisons.time_period_comparisons = {
      daily_to_weekly_ratio: avgDailyTransactions * 7 / avgWeeklyTransactions,
      weekly_to_monthly_ratio: avgWeeklyTransactions * 4.33 / avgMonthlyTransactions,
      daily_consistency: stats.consistency_metrics.consistency_score,
      weekly_variation: calculateVariation(trends.weekly_array.map((/** @type {{ transactions: any; }} */ w) => w.transactions)),
      monthly_variation: calculateVariation(trends.monthly_array.map((/** @type {{ transactions: any; }} */ m) => m.transactions)),
    };
  }

  return comparisons;
}

/**
 * Calculate variation coefficient
 * @param {any[]} array
 */
function calculateVariation(array) {
  if (array.length === 0) return 0;
  const mean = array.reduce((/** @type {any} */ sum, /** @type {any} */ val) => sum + val, 0) / array.length;
  const variance = array.reduce((/** @type {number} */ sum, /** @type {number} */ val) => sum + Math.pow(val - mean, 2), 0) / array.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

/**
 * Generate transaction recommendations
 * @param {{ total_transactions: any; unique_products?: number; unique_users?: number; unique_locations?: number; unique_actions?: number; period_days?: number; average_daily_transactions?: any; consistency_metrics?: any; user_activity?: any; action_breakdown?: any; time_distribution?: any; product_activity?: any; }} stats
 * @param {{ daily?: {}; weekly?: {}; monthly?: {}; growth_rates?: any; }} trends
 */
function generateTransactionRecommendations(stats, trends) {
  const recommendations = [];

  // Transaction volume recommendations
  if (stats.average_daily_transactions < 1) {
    recommendations.push({
      type: 'low_transaction_volume',
      message: 'Low transaction volume detected. Consider reviewing inventory activity and processes.',
      priority: 'medium',
      action: 'Review inventory management processes and user training.',
    });
  }

  if (stats.average_daily_transactions > 50) {
    recommendations.push({
      type: 'high_transaction_volume',
      message: 'High transaction volume detected. Ensure system performance can handle the load.',
      priority: 'medium',
      action: 'Monitor system performance and consider optimizations.',
    });
  }

  // Consistency recommendations
  if (stats.consistency_metrics.consistency_score < 50) {
    recommendations.push({
      type: 'low_consistency',
      message: 'Low transaction consistency across days. Consider standardizing inventory processes.',
      priority: 'high',
      action: 'Implement standardized inventory procedures and schedules.',
    });
  }

  // User concentration recommendations
  const userArray = Object.values(stats.user_activity);
  if (userArray.length > 0) {
    const topUser = userArray.reduce((max, user) => user.count > max.count ? user : max);
    const userConcentration = (topUser.count / stats.total_transactions) * 100;
    
    if (userConcentration > 50) {
      recommendations.push({
        type: 'high_user_concentration',
        message: `High transaction concentration with one user (${userConcentration.toFixed(1)}%). Consider distributing responsibilities.`,
        priority: 'medium',
        action: 'Train additional staff and distribute inventory management tasks.',
      });
    }
  }

  // Action type recommendations
  const manualAdjustments = stats.action_breakdown['MANUAL_ADJUSTMENT'];
  if (manualAdjustments && manualAdjustments.percentage_of_total > 30) {
    recommendations.push({
      type: 'high_manual_adjustments',
      message: `High percentage of manual adjustments (${manualAdjustments.percentage_of_total.toFixed(1)}%). Consider automating more processes.`,
      priority: 'high',
      action: 'Review processes that require manual adjustments and explore automation options.',
    });
  }

  // Time distribution recommendations
  if (stats.time_distribution.peak_hour >= 14 && stats.time_distribution.peak_hour <= 16) {
    recommendations.push({
      type: 'peak_time_optimization',
      message: `Peak transaction hour is ${stats.time_distribution.peak_hour}:00. Consider allocating resources accordingly.`,
      priority: 'low',
      action: 'Schedule additional staff during peak hours if needed.',
    });
  }

  // Product turnover recommendations
  const lowTurnoverProducts = Object.values(stats.product_activity)
    .filter(product => product.turnover_rate < 0.1 && product.transactions > 0)
    .slice(0, 5);
  
  if (lowTurnoverProducts.length > 0) {
    recommendations.push({
      type: 'low_turnover_products',
      message: `${lowTurnoverProducts.length} products with low turnover rates (< 10%). Consider reviewing stock levels.`,
      priority: 'medium',
      action: 'Review and adjust stock levels for low-turnover products.',
      data: {
        products: lowTurnoverProducts.map(p => ({
          product_id: p.product_id,
          product_name: p.product_name,
          turnover_rate: p.turnover_rate,
        })),
      },
    });
  }

  // High volume products recommendations
  const highVolumeProducts = Object.values(stats.product_activity)
    .filter(product => product.volume > 100)
    .slice(0, 5);
  
  if (highVolumeProducts.length > 0) {
    recommendations.push({
      type: 'high_volume_products',
      message: `${highVolumeProducts.length} products with high transaction volumes (> 100 units). Monitor stock levels closely.`,
      priority: 'medium',
      action: 'Set up stock alerts for high-volume products.',
      data: {
        products: highVolumeProducts.map(p => ({
          product_id: p.product_id,
          product_name: p.product_name,
          volume: p.volume,
        })),
      },
    });
  }

  // Trend-based recommendations
  if (trends.growth_rates) {
    if (trends.growth_rates.daily_transaction_growth < -10) {
      recommendations.push({
        type: 'declining_activity',
        message: 'Transaction activity shows declining trend. Investigate potential issues.',
        priority: 'high',
        action: 'Investigate reasons for declining inventory activity.',
      });
    }
    
    if (trends.growth_rates.daily_transaction_growth > 20) {
      recommendations.push({
        type: 'rapid_growth',
        message: 'Transaction activity shows rapid growth. Ensure capacity can handle increased load.',
        priority: 'medium',
        action: 'Monitor system capacity and plan for scalability.',
      });
    }
  }

  // Data quality recommendations
  const transactionsWithoutUser = Object.values(stats.user_activity)
    .filter(user => !user.user_id).length;
  
  if (transactionsWithoutUser > stats.total_transactions * 0.1) {
    recommendations.push({
      type: 'missing_user_data',
      message: `${transactionsWithoutUser} transactions missing user information. Improve data capture.`,
      priority: 'medium',
      action: 'Ensure all inventory transactions capture user information.',
    });
  }

  return recommendations;
}

module.exports = getTransactionStatistics;