// src/main/ipc/loyalty/bulk_create.ipc.js
//@ts-check
const auditLogger = require("../../../utils/auditLogger");
const { validateLoyaltyTransaction } = require("../../../utils/loyaltyUtils");

/**
 * Bulk create multiple loyalty transactions
 * @param {Object} params
 * @param {Array<{customerId: number, pointsChange: number, notes?: string, saleId?: number}>} params.transactions
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    if (!params.transactions || !Array.isArray(params.transactions) || params.transactions.length === 0) {
      return { status: false, message: 'transactions array is required and cannot be empty', data: null };
    }

    const customerRepo = queryRunner.manager.getRepository('Customer');
    const saleRepo = queryRunner.manager.getRepository('Sale');
    const txRepo = queryRunner.manager.getRepository('LoyaltyTransaction');

    const results = [];
    const errors = [];

    for (const [index, item] of params.transactions.entries()) {
      try {
        // Validate each item
        if (!item.customerId) throw new Error(`Item ${index}: customerId is required`);
        if (item.pointsChange === undefined || item.pointsChange === 0) {
          throw new Error(`Item ${index}: pointsChange must be non-zero`);
        }

        const validation = validateLoyaltyTransaction(item);
        if (!validation.valid) {
          throw new Error(`Item ${index}: ${validation.errors.join(', ')}`);
        }

        // Fetch customer
        const customer = await customerRepo.findOne({ where: { id: item.customerId } });
        if (!customer) {
          throw new Error(`Item ${index}: Customer with ID ${item.customerId} not found`);
        }

        // Check balance if redeeming
        if (item.pointsChange < 0 && customer.loyaltyPointsBalance + item.pointsChange < 0) {
          throw new Error(
            `Item ${index}: Insufficient points for customer ${customer.id}. Available: ${customer.loyaltyPointsBalance}, Requested: ${-item.pointsChange}`
          );
        }

        // Fetch sale if provided
        let sale = null;
        if (item.saleId) {
          sale = await saleRepo.findOne({ where: { id: item.saleId } });
          if (!sale) {
            throw new Error(`Item ${index}: Sale with ID ${item.saleId} not found`);
          }
        }

        // Update customer balance
        const oldBalance = customer.loyaltyPointsBalance;
        customer.loyaltyPointsBalance += item.pointsChange;
        customer.updatedAt = new Date();
        const updatedCustomer = await customerRepo.save(customer);

        // Create transaction
        const transaction = txRepo.create({
          pointsChange: item.pointsChange,
          notes: item.notes || null,
          customer: updatedCustomer,
          sale: sale,
          timestamp: new Date(),
        });
        const savedTx = await txRepo.save(transaction);

        // Audit logs
        await auditLogger.logUpdate(
          'Customer',
          customer.id,
          { loyaltyPointsBalance: oldBalance },
          { loyaltyPointsBalance: updatedCustomer.loyaltyPointsBalance },
          params.user || 'system',
          queryRunner.manager
        );
        await auditLogger.logCreate(
          'LoyaltyTransaction',
          savedTx.id,
          savedTx,
          params.user || 'system',
          queryRunner.manager
        );

        results.push(savedTx);
      } catch (err) {
        errors.push({ index, error: err.message });
        // Optionally break or continue? We'll continue and collect errors.
      }
    }

    if (errors.length > 0) {
      return {
        status: false,
        message: 'Some transactions failed',
        data: {
          successful: results,
          errors,
        },
      };
    }

    return {
      status: true,
      data: results,
      message: `Successfully created ${results.length} transactions`,
    };
  } catch (error) {
    console.error('Error in bulkCreateLoyaltyTransactions:', error);
    return {
      status: false,
      message: error.message || 'Failed to bulk create loyalty transactions',
      data: null,
    };
  }
};