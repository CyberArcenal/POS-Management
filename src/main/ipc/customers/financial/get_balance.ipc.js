// customers/financial/get_balance.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { CustomerTransaction } = require("../../../../entities/CustomerTransaction");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {number} userId
 */
async function getCustomerBalance(customer_id, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);
    const transactionRepo = AppDataSource.getRepository(CustomerTransaction);

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

    // Get recent transactions
    const recentTransactions = await transactionRepo.find({
      where: { customer_id },
      order: { transaction_date: "DESC" },
      take: 10,
    });

    // Get transaction summary for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSummary = await transactionRepo
      .createQueryBuilder("transaction")
      .select([
        "SUM(CASE WHEN transaction.transaction_type = 'sale' THEN transaction.amount ELSE 0 END) as total_sales",
        "SUM(CASE WHEN transaction.transaction_type = 'payment' THEN transaction.amount ELSE 0 END) as total_payments",
        "COUNT(*) as transaction_count",
      ])
      .where("transaction.customer_id = :customer_id", { customer_id })
      .andWhere("transaction.transaction_date >= :date", { date: thirtyDaysAgo })
      .andWhere("transaction.status = 'completed'")
      .getRawOne();

    // Calculate aging analysis
    const agingBuckets = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    // Simple aging based on last transaction
    const lastPayment = recentTransactions.find(t => t.transaction_type === "payment");
    if (lastPayment) {
      const daysSinceLastPayment = Math.floor(
        // @ts-ignore
        (new Date() - new Date(lastPayment.transaction_date)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPayment <= 30) {
        // @ts-ignore
        agingBuckets.current = parseFloat(customer.current_balance);
      } else if (daysSinceLastPayment <= 60) {
        // @ts-ignore
        agingBuckets["1-30"] = parseFloat(customer.current_balance);
      } else if (daysSinceLastPayment <= 90) {
        // @ts-ignore
        agingBuckets["31-60"] = parseFloat(customer.current_balance);
      } else {
        // @ts-ignore
        agingBuckets["61-90"] = parseFloat(customer.current_balance);
      }
    }

    // Audit log
    await log_audit("fetch_balance", "Customer", customer_id, userId, {
      customer_code: customer.customer_code,
      current_balance: customer.current_balance,
      credit_limit: customer.credit_limit,
    });

    return {
      status: true,
      message: "Customer balance fetched successfully",
      data: {
        customer: {
          id: customer.id,
          code: customer.customer_code,
          name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
        },
        balance_details: {
          // @ts-ignore
          current_balance: parseFloat(customer.current_balance) || 0,
          // @ts-ignore
          credit_limit: parseFloat(customer.credit_limit) || 0,
          // @ts-ignore
          available_credit: Math.max(0, (parseFloat(customer.credit_limit) || 0) - (parseFloat(customer.current_balance) || 0)),
          // @ts-ignore
          credit_utilization: parseFloat(customer.credit_limit) > 0 ? 
            // @ts-ignore
            ((parseFloat(customer.current_balance) || 0) / parseFloat(customer.credit_limit)) * 100 : 0,
        },
        recent_transactions: recentTransactions,
        recent_summary: {
          total_sales: parseFloat(recentSummary?.total_sales) || 0,
          total_payments: parseFloat(recentSummary?.total_payments) || 0,
          transaction_count: parseInt(recentSummary?.transaction_count) || 0,
          net_change: (parseFloat(recentSummary?.total_sales) || 0) - (parseFloat(recentSummary?.total_payments) || 0),
        },
        aging_analysis: agingBuckets,
        last_updated: customer.updated_at,
      },
    };
  } catch (error) {
    console.error("getCustomerBalance error:", error);

    await log_audit("error", "CustomerBalance", 0, userId, {
      customer_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customer balance: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getCustomerBalance;