// src/main/ipc/loyalty/create.ipc.js
//@ts-check
const { validateLoyaltyTransaction } = require("../../../utils/loyaltyUtils");
const auditLogger = require("../../../utils/auditLogger");

/**
 * Create a manual loyalty transaction (adjustment)
 * @param {Object} params
 * @param {number} params.customerId
 * @param {number} params.pointsChange - Positive for earn, negative for redeem
 * @param {string} [params.notes]
 * @param {number} [params.saleId] - Optional associated sale
 * @param {string} [params.user] - User performing action (default 'system')
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    // Validate input
    if (!params.customerId) {
      return { status: false, message: 'customerId is required', data: null };
    }
    if (params.pointsChange === undefined || params.pointsChange === 0) {
      return { status: false, message: 'pointsChange must be non-zero', data: null };
    }

    const validation = validateLoyaltyTransaction(params);
    if (!validation.valid) {
      return { status: false, message: validation.errors.join(', '), data: null };
    }

    const customerRepo = queryRunner.manager.getRepository('Customer');
    const saleRepo = queryRunner.manager.getRepository('Sale');
    const txRepo = queryRunner.manager.getRepository('LoyaltyTransaction');

    // Fetch customer
    const customer = await customerRepo.findOne({ where: { id: params.customerId } });
    if (!customer) {
      return { status: false, message: `Customer with ID ${params.customerId} not found`, data: null };
    }

    // Check balance if redeeming
    if (params.pointsChange < 0 && customer.loyaltyPointsBalance + params.pointsChange < 0) {
      return {
        status: false,
        message: `Insufficient points. Available: ${customer.loyaltyPointsBalance}, Requested: ${-params.pointsChange}`,
        data: null,
      };
    }

    // Fetch sale if provided
    let sale = null;
    if (params.saleId) {
      sale = await saleRepo.findOne({ where: { id: params.saleId } });
      if (!sale) {
        return { status: false, message: `Sale with ID ${params.saleId} not found`, data: null };
      }
    }

    // Update customer balance
    const oldBalance = customer.loyaltyPointsBalance;
    customer.loyaltyPointsBalance += params.pointsChange;
    customer.updatedAt = new Date();
    const updatedCustomer = await customerRepo.save(customer);

    // Create transaction record
    const transaction = txRepo.create({
      pointsChange: params.pointsChange,
      notes: params.notes || null,
      customer: updatedCustomer,
      sale: sale,
      timestamp: new Date(),
    });
    const savedTx = await txRepo.save(transaction);

    // Audit logs (using queryRunner to keep within transaction)
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

    return {
      status: true,
      data: savedTx,
      message: 'Loyalty transaction created successfully',
    };
  } catch (error) {
    console.error('Error in createLoyaltyTransaction:', error);
    return {
      status: false,
      message: error.message || 'Failed to create loyalty transaction',
      data: null,
    };
  }
};