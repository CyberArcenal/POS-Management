// customers/financial/get_statement.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { CustomerTransaction } = require("../../../../entities/CustomerTransaction");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {string} start_date
 * @param {string} end_date
 * @param {number} userId
 */
async function getCustomerStatement(customer_id, start_date, end_date, userId) {
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

    // Get opening balance (balance before start_date)
    const openingBalanceQuery = await transactionRepo
      .createQueryBuilder("transaction")
      .select("COALESCE(SUM(CASE WHEN transaction.transaction_type IN ('sale', 'debit_note', 'adjustment') THEN transaction.amount ELSE -transaction.amount END), 0)", "opening_balance")
      .where("transaction.customer_id = :customer_id", { customer_id })
      .andWhere("transaction.transaction_date < :start_date", { start_date })
      .andWhere("transaction.status = 'completed'")
      .getRawOne();

    const openingBalance = parseFloat(openingBalanceQuery?.opening_balance) || 0;

    // Get transactions in date range
    const transactions = await transactionRepo
      .createQueryBuilder("transaction")
      .where("transaction.customer_id = :customer_id", { customer_id })
      .andWhere("transaction.transaction_date BETWEEN :start_date AND :end_date", {
        start_date,
        end_date,
      })
      .andWhere("transaction.status = 'completed'")
      .orderBy("transaction.transaction_date", "ASC")
      .addOrderBy("transaction.created_at", "ASC")
      .getMany();

    // Calculate running balance
    let runningBalance = openingBalance;
    // @ts-ignore
    const statementItems = transactions.map((/** @type {{ amount: string; transaction_type: string; }} */ transaction) => {
      let amount = parseFloat(transaction.amount);
      
      // Adjust amount based on transaction type
      if (transaction.transaction_type === "payment" || transaction.transaction_type === "credit_note") {
        amount = -amount; // Negative for credits
      }
      
      runningBalance += amount;
      
      return {
        ...transaction,
        amount: Math.abs(amount),
        is_credit: amount < 0,
        running_balance: runningBalance,
      };
    });

    // Calculate summary
    // @ts-ignore
    const summary = transactions.reduce((/** @type {{ total_sales: number; debit_total: number; total_payments: number; credit_total: number; total_credit_notes: number; total_debit_notes: number; total_adjustments_debit: number; total_adjustments_credit: number; }} */ acc, /** @type {{ amount: string; transaction_type: any; }} */ transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transaction_type) {
        case "sale":
          acc.total_sales += amount;
          acc.debit_total += amount;
          break;
        case "payment":
          acc.total_payments += amount;
          acc.credit_total += amount;
          break;
        case "credit_note":
          acc.total_credit_notes += amount;
          acc.credit_total += amount;
          break;
        case "debit_note":
          acc.total_debit_notes += amount;
          acc.debit_total += amount;
          break;
        case "adjustment":
          if (amount > 0) {
            acc.total_adjustments_debit += amount;
            acc.debit_total += amount;
          } else {
            acc.total_adjustments_credit += Math.abs(amount);
            acc.credit_total += Math.abs(amount);
          }
          break;
      }
      
      return acc;
    }, {
      total_sales: 0,
      total_payments: 0,
      total_credit_notes: 0,
      total_debit_notes: 0,
      total_adjustments_debit: 0,
      total_adjustments_credit: 0,
      debit_total: 0,
      credit_total: 0,
      net_change: 0,
    });

    // @ts-ignore
    summary.net_change = summary.debit_total - summary.credit_total;
    // @ts-ignore
    const closingBalance = openingBalance + summary.net_change;

    // Generate statement number
    const statementNumber = `STMT-${customer.customer_code}-${new Date().getTime()}`;

    // Audit log
    await log_audit("generate_statement", "Customer", customer_id, userId, {
      customer_code: customer.customer_code,
      start_date,
      end_date,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      transaction_count: transactions.length,
      statement_number: statementNumber,
    });

    return {
      status: true,
      message: "Customer statement generated successfully",
      data: {
        statement_info: {
          statement_number: statementNumber,
          customer_id: customer.id,
          customer_code: customer.customer_code,
          customer_name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
          period: {
            start: start_date,
            end: end_date,
            generated_at: new Date(),
          },
        },
        opening_balance: openingBalance,
        closing_balance: closingBalance,
        transactions: statementItems,
        summary: summary,
        totals: {
          opening_balance: openingBalance,
          // @ts-ignore
          total_debits: summary.debit_total,
          // @ts-ignore
          total_credits: summary.credit_total,
          // @ts-ignore
          net_change: summary.net_change,
          closing_balance: closingBalance,
        },
      },
    };
  } catch (error) {
    console.error("getCustomerStatement error:", error);

    await log_audit("error", "CustomerStatement", 0, userId, {
      customer_id,
      start_date,
      end_date,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate customer statement: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getCustomerStatement;