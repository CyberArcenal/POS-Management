// inventory_transactions/get/by_date_range.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {Object} filters
 * @param {number} userId
 */
async function getTransactionLogsByDateRange(startDate, endDate, filters = {}, userId) {
  try {
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Start date and end date are required",
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .leftJoinAndSelect("transaction.location", "location")
      .where("transaction.created_at BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .orderBy("transaction.created_at", "DESC");

    // Apply filters
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

    // Calculate summary statistics
    const summary = {
      total_transactions: transactions.length,
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

    // Group by action
    const actionSummary = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      if (!actionSummary[transaction.action]) {
        // @ts-ignore
        actionSummary[transaction.action] = {
          count: 0,
          total_change: 0,
          average_change: 0,
        };
      }
      // @ts-ignore
      actionSummary[transaction.action].count++;
      // @ts-ignore
      actionSummary[transaction.action].total_change += transaction.change_amount;
    });

    // Calculate averages
    Object.keys(actionSummary).forEach(action => {
      // @ts-ignore
      actionSummary[action].average_change = 
        // @ts-ignore
        actionSummary[action].total_change / actionSummary[action].count;
    });

    // Group by day for daily trend
    const dailyTrend = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      const date = transaction.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyTrend[date]) {
        // @ts-ignore
        dailyTrend[date] = {
          date,
          transactions: 0,
          increase: 0,
          decrease: 0,
          net_change: 0,
          products: new Set(),
        };
      }
      // @ts-ignore
      dailyTrend[date].transactions++;
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        dailyTrend[date].increase += transaction.change_amount;
      } else {
        // @ts-ignore
        dailyTrend[date].decrease += Math.abs(transaction.change_amount);
      }
      // @ts-ignore
      dailyTrend[date].net_change += transaction.change_amount;
      // @ts-ignore
      dailyTrend[date].products.add(transaction.product_id);
    });

    // Convert Set to count
    Object.keys(dailyTrend).forEach(date => {
      // @ts-ignore
      dailyTrend[date].unique_products = dailyTrend[date].products.size;
      // @ts-ignore
      delete dailyTrend[date].products;
    });

    const dailyTrendArray = Object.values(dailyTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by product for top movers
    const productMovements = {};
    transactions.forEach(transaction => {
      const productId = transaction.product_id;
      // @ts-ignore
      if (!productMovements[productId]) {
        // @ts-ignore
        productMovements[productId] = {
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
      productMovements[productId].transactions++;
      // @ts-ignore
      productMovements[productId].total_change += transaction.change_amount;
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        productMovements[productId].increase += transaction.change_amount;
      } else {
        // @ts-ignore
        productMovements[productId].decrease += Math.abs(transaction.change_amount);
      }
    });

    // Get top 10 products by absolute change
    const topProductsByChange = Object.values(productMovements)
      .sort((a, b) => Math.abs(b.total_change) - Math.abs(a.total_change))
      .slice(0, 10);

    // Get top 10 products by transaction count
    const topProductsByTransactions = Object.values(productMovements)
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 10);

    await log_audit("fetch_by_date_range", "InventoryTransactionLog", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      transactions_count: transactions.length,
    });

    return {
      status: true,
      message: "Transaction logs retrieved by date range successfully",
      data: {
        transactions,
        summary,
        date_range: {
          start: startDate,
          end: endDate,
          // @ts-ignore
          days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
        },
        action_summary: actionSummary,
        daily_trend: dailyTrendArray,
        top_products: {
          by_change: topProductsByChange,
          by_transactions: topProductsByTransactions,
        },
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getTransactionLogsByDateRange error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get transaction logs by date range: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getTransactionLogsByDateRange;