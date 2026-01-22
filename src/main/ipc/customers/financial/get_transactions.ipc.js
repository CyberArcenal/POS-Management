// customers/financial/get_transactions.ipc.js
//@ts-check
const { CustomerTransaction } = require("../../../../entities/CustomerTransaction");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomerTransactions(customer_id, filters = {}, userId) {
  try {
    const transactionRepo = AppDataSource.getRepository(CustomerTransaction);

    // Build query
    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .where("transaction.customer_id = :customer_id", { customer_id })
      .orderBy("transaction.transaction_date", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.transaction_type) {
      queryBuilder.andWhere("transaction.transaction_type = :transaction_type", {
        // @ts-ignore
        transaction_type: filters.transaction_type,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("transaction.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.start_date) {
      queryBuilder.andWhere("transaction.transaction_date >= :start_date", {
        // @ts-ignore
        start_date: filters.start_date,
      });
    }

    // @ts-ignore
    if (filters.end_date) {
      queryBuilder.andWhere("transaction.transaction_date <= :end_date", {
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.min_amount !== undefined) {
      queryBuilder.andWhere("transaction.amount >= :min_amount", {
        // @ts-ignore
        min_amount: filters.min_amount,
      });
    }

    // @ts-ignore
    if (filters.max_amount !== undefined) {
      queryBuilder.andWhere("transaction.amount <= :max_amount", {
        // @ts-ignore
        max_amount: filters.max_amount,
      });
    }

    // Pagination
    // @ts-ignore
    const page = filters.page || 1;
    // @ts-ignore
    const pageSize = filters.pageSize || 20;
    const totalCount = await queryBuilder.getCount();

    const transactions = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate summary
    // @ts-ignore
    const summary = transactions.reduce((/** @type {{ total_transactions: number; total_amount: number; total_payments: number; payment_count: number; total_sales: number; sale_count: number; }} */ acc, /** @type {{ amount: string; transaction_type: string; }} */ transaction) => {
      acc.total_transactions += 1;
      acc.total_amount += parseFloat(transaction.amount);
      
      if (transaction.transaction_type === "payment") {
        acc.total_payments += parseFloat(transaction.amount);
        acc.payment_count += 1;
      } else if (transaction.transaction_type === "sale") {
        acc.total_sales += parseFloat(transaction.amount);
        acc.sale_count += 1;
      }
      
      return acc;
    }, {
      total_transactions: 0,
      total_amount: 0,
      total_payments: 0,
      total_sales: 0,
      payment_count: 0,
      sale_count: 0,
    });

    // Audit log
    await log_audit("fetch_transactions", "Customer", customer_id, userId, {
      transaction_count: transactions.length,
      filter_count: Object.keys(filters).length,
    });

    return {
      status: true,
      message: "Customer transactions fetched successfully",
      data: transactions,
      summary: summary,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("getCustomerTransactions error:", error);

    await log_audit("error", "CustomerTransaction", 0, userId, {
      customer_id,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customer transactions: ${error.message}`,
      data: [],
      summary: {
        total_transactions: 0,
        total_amount: 0,
        total_payments: 0,
        total_sales: 0,
        payment_count: 0,
        sale_count: 0,
      },
      pagination: {
        current_page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 0,
      },
    };
  }
}

module.exports = getCustomerTransactions;