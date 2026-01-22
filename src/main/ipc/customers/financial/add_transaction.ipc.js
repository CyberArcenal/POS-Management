// customers/financial/add_transaction.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const CustomerTransaction = require("../../../../entities/CustomerTransaction");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function addTransaction(params, queryRunner) {
  const { 
    // @ts-ignore
    customer_id,
    // @ts-ignore
    transaction_data,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const customerRepo = queryRunner.manager.getRepository(Customer);
    const transactionRepo = queryRunner.manager.getRepository(CustomerTransaction);

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

    // Calculate balance impact
    const balanceBefore = parseFloat(customer.current_balance) || 0;
    let balanceChange = 0;

    switch (transaction_data.transaction_type) {
      case "payment":
      case "credit_note":
        // Decrease balance (customer paid or got credit)
        balanceChange = -Math.abs(transaction_data.amount);
        break;
      case "sale":
      case "debit_note":
      case "adjustment":
        // Increase balance (customer owes more)
        balanceChange = Math.abs(transaction_data.amount);
        break;
      default:
        return {
          status: false,
          message: `Invalid transaction type: ${transaction_data.transaction_type}`,
          data: null,
        };
    }

    // Update customer balance if transaction is completed
    if (transaction_data.status === "completed") {
      customer.current_balance = balanceBefore + balanceChange;
      customer.updated_at = new Date();
      await customerRepo.save(customer);
    }

    // Create transaction
    const transaction = transactionRepo.create({
      customer_id,
      ...transaction_data,
      balance_before: balanceBefore,
      balance_after: transaction_data.status === "completed" ? 
        balanceBefore + balanceChange : balanceBefore,
      created_by: _userId,
    });

    await transactionRepo.save(transaction);

    // Log activity
    await log_audit("add_transaction", "Customer", customer_id, _userId, {
      customer_code: customer.customer_code,
      transaction_type: transaction_data.transaction_type,
      amount: transaction_data.amount,
      status: transaction_data.status,
      transaction_id: transaction.id,
      balance_impact: balanceChange,
    });

    return {
      status: true,
      message: "Transaction added successfully",
      data: {
        transaction,
        customer_balance: {
          before: balanceBefore,
          after: transaction_data.status === "completed" ? 
            balanceBefore + balanceChange : balanceBefore,
          change: transaction_data.status === "completed" ? balanceChange : 0,
        },
      },
    };
  } catch (error) {
    console.error("addTransaction error:", error);
    
    await log_audit("error", "CustomerTransaction", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to add transaction: ${error.message}`,
      data: null,
    };
  }
}

module.exports = addTransaction;