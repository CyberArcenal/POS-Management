// inventory_transactions/get/by_product.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} productId
 * @param {Object} filters
 * @param {number} userId
 */
async function getTransactionLogsByProduct(productId, filters = {}, userId) {
  try {
    if (!productId) {
      return {
        status: false,
        message: "Product ID is required",
        data: null,
      };
    }

    // Check if product exists
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: productId, is_deleted: false }
    });

    if (!product) {
      return {
        status: false,
        message: `Product with ID ${productId} not found`,
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .where("transaction.product_id = :product_id", { product_id: productId.toString() })
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
    if (filters.change_type) {
      // @ts-ignore
      if (filters.change_type === 'increase') {
        queryBuilder.andWhere("transaction.change_amount > 0");
      // @ts-ignore
      } else if (filters.change_type === 'decrease') {
        queryBuilder.andWhere("transaction.change_amount < 0");
      }
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
        message: `No transaction logs found for product: ${product.name}`,
        data: {
          product_info: product,
          transactions: [],
          summary: {
            total_transactions: 0,
            total_increase: 0,
            total_decrease: 0,
            net_change: 0,
          },
        },
      };
    }

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
      // @ts-ignore
      average_change: transactions.reduce((sum, t) => sum + t.change_amount, 0) / transactions.length,
      first_transaction_date: transactions[transactions.length - 1].created_at,
      last_transaction_date: transactions[0].created_at,
    };

    // Group by action type
    const actionBreakdown = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      if (!actionBreakdown[transaction.action]) {
        // @ts-ignore
        actionBreakdown[transaction.action] = {
          count: 0,
          total_change: 0,
          transactions: [],
        };
      }
      // @ts-ignore
      actionBreakdown[transaction.action].count++;
      // @ts-ignore
      actionBreakdown[transaction.action].total_change += transaction.change_amount;
      // @ts-ignore
      actionBreakdown[transaction.action].transactions.push(transaction.id);
    });

    // Calculate monthly trend
    const monthlyTrend = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      const month = transaction.created_at.toISOString().slice(0, 7); // YYYY-MM
      // @ts-ignore
      if (!monthlyTrend[month]) {
        // @ts-ignore
        monthlyTrend[month] = {
          transactions: 0,
          increase: 0,
          decrease: 0,
          net_change: 0,
        };
      }
      // @ts-ignore
      monthlyTrend[month].transactions++;
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        monthlyTrend[month].increase += transaction.change_amount;
      } else {
        // @ts-ignore
        monthlyTrend[month].decrease += Math.abs(transaction.change_amount);
      }
      // @ts-ignore
      monthlyTrend[month].net_change += transaction.change_amount;
    });

    // Get top 10 recent transactions
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      id: t.id,
      action: t.action,
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
    }));

    await log_audit("fetch_by_product", "InventoryTransactionLog", 0, userId, {
      product_id: productId,
      product_name: product.name,
      transactions_count: transactions.length,
    });

    return {
      status: true,
      message: `Transaction logs for ${product.name} retrieved successfully`,
      data: {
        product_info: product,
        transactions,
        summary,
        action_breakdown: actionBreakdown,
        monthly_trend: monthlyTrend,
        recent_transactions: recentTransactions,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getTransactionLogsByProduct error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      product_id: productId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get transaction logs by product: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getTransactionLogsByProduct;