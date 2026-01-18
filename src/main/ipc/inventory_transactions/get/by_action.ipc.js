// inventory_transactions/get/by_action.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const { InventoryAction } = require("../../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} action
 * @param {Object} filters
 * @param {number} userId
 */
async function getTransactionLogsByAction(action, filters = {}, userId) {
  try {
    if (!action) {
      return {
        status: false,
        message: "Action is required",
        data: null,
      };
    }

    // Validate action
    const validActions = Object.values(InventoryAction);
    if (!validActions.includes(action)) {
      return {
        status: false,
        message: `Invalid action. Valid actions are: ${validActions.join(', ')}`,
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .where("transaction.action = :action", { action })
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
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.reference_type) {
      queryBuilder.andWhere("transaction.reference_type = :reference_type", {
        // @ts-ignore
        reference_type: filters.reference_type,
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
    if (filters.min_change_amount !== undefined) {
      queryBuilder.andWhere("ABS(transaction.change_amount) >= :min_change_amount", {
        // @ts-ignore
        min_change_amount: Math.abs(filters.min_change_amount),
      });
    }

    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
    }

    // @ts-ignore
    if (filters.offset) {
      // @ts-ignore
      queryBuilder.skip(filters.offset);
    }

    const transactions = await queryBuilder.getMany();

    if (transactions.length === 0) {
      return {
        status: true,
        message: `No transaction logs found for action: ${action}`,
        data: {
          action,
          transactions: [],
          summary: {
            total_transactions: 0,
            total_change: 0,
            average_change: 0,
          },
        },
      };
    }

    // Calculate summary statistics for this action
    const summary = {
      total_transactions: transactions.length,
      // @ts-ignore
      total_change: transactions.reduce((sum, t) => sum + t.change_amount, 0),
      // @ts-ignore
      average_change: transactions.reduce((sum, t) => sum + t.change_amount, 0) / transactions.length,
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
      unique_users: new Set(transactions.map(t => t.performed_by_id)).size,
      total_monetary_impact: transactions.reduce((sum, t) => 
        // @ts-ignore
        sum + (t.change_amount * (t.price_before || 0)), 0),
    };

    // Get action-specific insights
    const insights = generateActionInsights(action, transactions, summary);

    // Group by product
    const productBreakdown = {};
    transactions.forEach(transaction => {
      const productId = transaction.product_id;
      // @ts-ignore
      if (!productBreakdown[productId]) {
        // @ts-ignore
        productBreakdown[productId] = {
          product_id: productId,
          // @ts-ignore
          product_name: transaction.product?.name || `Product ${productId}`,
          transactions: 0,
          total_change: 0,
          average_change: 0,
        };
      }
      // @ts-ignore
      productBreakdown[productId].transactions++;
      // @ts-ignore
      productBreakdown[productId].total_change += transaction.change_amount;
    });

    // Calculate averages
    Object.keys(productBreakdown).forEach(productId => {
      // @ts-ignore
      productBreakdown[productId].average_change = 
        // @ts-ignore
        productBreakdown[productId].total_change / productBreakdown[productId].transactions;
    });

    // Get top 10 products by transaction count
    // @ts-ignore
    const topProducts = Object.values(productBreakdown)
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 10);

    // Group by date for trend analysis
    const dateTrend = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      const date = transaction.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!dateTrend[date]) {
        // @ts-ignore
        dateTrend[date] = {
          date,
          transactions: 0,
          total_change: 0,
        };
      }
      // @ts-ignore
      dateTrend[date].transactions++;
      // @ts-ignore
      dateTrend[date].total_change += transaction.change_amount;
    });

    const dateTrendArray = Object.values(dateTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get recent transactions
    // @ts-ignore
    const recentTransactions = transactions.slice(0, 20).map(t => ({
      id: t.id,
      product_id: t.product_id,
      // @ts-ignore
      product_name: t.product?.name,
      change_amount: t.change_amount,
      quantity_before: t.quantity_before,
      quantity_after: t.quantity_after,
      created_at: t.created_at,
      // @ts-ignore
      performed_by: t.performed_by ? {
        // @ts-ignore
        id: t.performed_by.id,
        // @ts-ignore
        username: t.performed_by.username,
      } : null,
      reference_id: t.reference_id,
      reference_type: t.reference_type,
    }));

    await log_audit("fetch_by_action", "InventoryTransactionLog", 0, userId, {
      action,
      transactions_count: transactions.length,
      total_change: summary.total_change,
    });

    return {
      status: true,
      message: `Transaction logs for action '${action}' retrieved successfully`,
      data: {
        action,
        action_description: getActionDescription(action),
        transactions,
        summary,
        insights,
        product_breakdown: productBreakdown,
        // @ts-ignore
        top_products,
        date_trend: dateTrendArray,
        // @ts-ignore
        recent_transactions,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getTransactionLogsByAction error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      action,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get transaction logs by action: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Get human-readable description of action
 * @param {string} action
 */
function getActionDescription(action) {
  const descriptions = {
    'ORDER_ALLOCATION': 'Order allocation - stock reserved for customer order',
    'ORDER_CANCELLATION': 'Order cancellation - stock returned from cancelled order',
    'ORDER_CONFIRMATION': 'Order confirmation - stock confirmed for order',
    'ORDER_COMPLETED': 'Order completed - stock deducted for completed order',
    'ORDER_REFUND': 'Order refund - stock returned from refund',
    'MANUAL_ADJUSTMENT': 'Manual adjustment - stock manually adjusted',
    'RETURN': 'Return - customer return of products',
    'TRANSFER_IN': 'Transfer in - stock received from transfer',
    'TRANSFER_OUT': 'Transfer out - stock sent in transfer',
    'DAMAGE': 'Damage - stock marked as damaged',
    'REPLENISHMENT': 'Replenishment - stock received from supplier',
    'STOCK_TAKE': 'Stock take - stock adjustment from inventory count',
    'EXPIRY': 'Expiry - stock expired and removed',
    'FOUND': 'Found - previously missing stock found',
    'THEFT': 'Theft - stock lost to theft',
    'CORRECTION': 'Correction - stock correction',
    'QUICK_INCREASE': 'Quick increase - quick stock increase',
    'QUICK_DECREASE': 'Quick decrease - quick stock decrease',
    'BULK_INCREASE': 'Bulk increase - bulk stock increase',
    'BULK_DECREASE': 'Bulk decrease - bulk stock decrease',
    'VARIANT_ADJUSTMENT': 'Variant adjustment - stock adjustment between variants',
    'QUARANTINE': 'Quarantine - stock placed in quarantine',
    'CONSIGNMENT': 'Consignment - stock on consignment',
    'DONATION': 'Donation - stock donated',
    'PRODUCTION': 'Production - stock from production',
    'RECALL': 'Recall - stock recalled',
    'PURCHASE_RECEIVE': 'Purchase receive - stock received from purchase',
    'PURCHASE_CANCEL': 'Purchase cancel - purchase cancelled',
    'SALE': 'Sale - stock sold to customer',
    'PRICE_CHANGE': 'Price change - product price changed',
    'STOCK_SYNC': 'Stock sync - stock synchronized',
    'CATEGORY_CHANGE': 'Category change - product category changed',
    'SUPPLIER_CHANGE': 'Supplier change - product supplier changed',
    'PRODUCT_CREATED': 'Product created - new product created',
    'PRODUCT_UPDATED': 'Product updated - product details updated',
    'PRODUCT_ARCHIVED': 'Product archived - product archived',
    'PRODUCT_RESTORED': 'Product restored - product restored from archive',
  };
  
  // @ts-ignore
  return descriptions[action] || action;
}

/**
 * Generate insights based on action type
 * @param {string} action
 * @param {any[]} transactions
 * @param {{ total_transactions?: number; total_change: any; average_change: any; total_increase: any; total_decrease: any; net_change?: number; unique_products: any; unique_users?: number; total_monetary_impact?: number; }} summary
 */
function generateActionInsights(action, transactions, summary) {
  const insights = [];

  if (transactions.length === 0) {
    insights.push({
      type: 'no_data',
      message: 'No transactions found for this action',
      priority: 'info',
    });
    return insights;
  }

  // Common insights
  if (summary.total_change > 0) {
    insights.push({
      type: 'net_positive',
      message: `Net increase of ${summary.total_change} units across all products`,
      priority: 'medium',
      data: { net_change: summary.total_change },
    });
  } else if (summary.total_change < 0) {
    insights.push({
      type: 'net_negative',
      message: `Net decrease of ${Math.abs(summary.total_change)} units across all products`,
      priority: 'medium',
      data: { net_change: summary.total_change },
    });
  }

  // Action-specific insights
  if (action === 'MANUAL_ADJUSTMENT') {
    const avgAdjustment = Math.abs(summary.average_change);
    if (avgAdjustment > 10) {
      insights.push({
        type: 'large_adjustments',
        message: `Large manual adjustments detected (average: ${avgAdjustment.toFixed(1)} units)`,
        priority: 'high',
        data: { average_adjustment: avgAdjustment },
      });
    }
  }

  if (action === 'SALE') {
    const totalSales = summary.total_decrease;
    insights.push({
      type: 'sales_volume',
      message: `${totalSales} units sold across ${summary.unique_products} products`,
      priority: 'medium',
      data: { total_sales: totalSales, unique_products: summary.unique_products },
    });
  }

  if (action === 'RETURN') {
    const totalReturns = summary.total_increase;
    insights.push({
      type: 'returns_volume',
      message: `${totalReturns} units returned across ${summary.unique_products} products`,
      priority: 'medium',
      data: { total_returns: totalReturns, unique_products: summary.unique_products },
    });
  }

  // Frequency insight
  const daysCovered = new Set(transactions.map((/** @type {{ created_at: { toISOString: () => string; }; }} */ t) => t.created_at.toISOString().split('T')[0])).size;
  const transactionsPerDay = transactions.length / daysCovered;
  
  if (transactionsPerDay > 10) {
    insights.push({
      type: 'high_frequency',
      message: `High frequency: ${transactionsPerDay.toFixed(1)} transactions per day on average`,
      priority: 'medium',
      data: { transactions_per_day: transactionsPerDay },
    });
  }

  // Product concentration insight
  if (summary.unique_products > 0) {
    const concentration = (topProductCount(transactions, 3) / transactions.length) * 100;
    if (concentration > 50) {
      insights.push({
        type: 'product_concentration',
        message: `Top 3 products account for ${concentration.toFixed(1)}% of transactions`,
        priority: 'low',
        data: { concentration_percentage: concentration },
      });
    }
  }

  return insights;
}

/**
 * Count transactions for top N products
 * @param {any[]} transactions
 * @param {number | undefined} n
 */
function topProductCount(transactions, n) {
  const productCounts = {};
  transactions.forEach((/** @type {{ product_id: string | number; }} */ t) => {
    // @ts-ignore
    productCounts[t.product_id] = (productCounts[t.product_id] || 0) + 1;
  });
  
  const sortedProducts = Object.values(productCounts).sort((a, b) => b - a);
  return sortedProducts.slice(0, n).reduce((sum, count) => sum + count, 0);
}

module.exports = getTransactionLogsByAction;