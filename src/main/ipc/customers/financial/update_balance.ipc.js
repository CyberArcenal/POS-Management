// customers/financial/update_balance.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const CustomerTransaction = require("../../../../entities/CustomerTransaction");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateCustomerBalance(params, queryRunner) {
  const { 
    // @ts-ignore
    customer_id,
    // @ts-ignore
    amount,
    // @ts-ignore
    transaction_type = "adjustment",
    // @ts-ignore
    description = "",
    // @ts-ignore
    reference_id = null,
    // @ts-ignore
    reference_type = null,
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

    // Calculate new balance
    const balanceBefore = parseFloat(customer.current_balance) || 0;
    let newBalance = balanceBefore;

    // Apply amount based on transaction type
    switch (transaction_type) {
      case "payment":
      case "credit_note":
        // Decrease balance (customer paid or got credit)
        newBalance -= Math.abs(amount);
        break;
      case "sale":
      case "debit_note":
      case "adjustment":
        // Increase balance (customer owes more)
        newBalance += Math.abs(amount);
        break;
      default:
        return {
          status: false,
          message: `Invalid transaction type: ${transaction_type}`,
          data: null,
        };
    }

    // Update customer balance
    customer.current_balance = newBalance;
    customer.updated_at = new Date();
    await customerRepo.save(customer);

    // Create transaction record
    const transaction = transactionRepo.create({
      customer_id,
      transaction_type,
      transaction_date: new Date(),
      amount: Math.abs(amount),
      balance_before: balanceBefore,
      balance_after: newBalance,
      description: description || `Balance ${transaction_type}`,
      reference_id,
      reference_type,
      created_by: _userId,
      status: "completed",
    });

    await transactionRepo.save(transaction);

    // Log activity
    await log_audit("update_balance", "Customer", customer_id, _userId, {
      customer_code: customer.customer_code,
      transaction_type,
      amount: Math.abs(amount),
      balance_before: balanceBefore,
      balance_after: newBalance,
      change: newBalance - balanceBefore,
      transaction_id: transaction.id,
    });

    return {
      status: true,
      message: "Customer balance updated successfully",
      data: {
        customer: {
          id: customer.id,
          code: customer.customer_code,
          name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
        },
        transaction: transaction,
        balance_summary: {
          before: balanceBefore,
          after: newBalance,
          change: newBalance - balanceBefore,
        },
      },
    };
  } catch (error) {
    console.error("updateCustomerBalance error:", error);
    
    await log_audit("error", "CustomerBalance", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
      amount,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update customer balance: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateCustomerBalance;