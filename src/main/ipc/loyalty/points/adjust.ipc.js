// loyalty/points/adjust.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ customer_id: any; points_amount: any; transaction_type: any; description: any; reference_type?: "manual" | undefined; reference_id?: null | undefined; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function adjustCustomerPoints(params, queryRunner) {
  const {
    customer_id,
    points_amount,
    transaction_type,
    description,
    reference_type = "manual",
    reference_id = null,
    _userId,
  } = params;

  try {
    const loyaltyRepo = queryRunner.manager.getRepository(LoyaltyCustomer);
    const pointsRepo = queryRunner.manager.getRepository(PointsTransaction);

    // Get loyalty customer
    const loyaltyCustomer = await loyaltyRepo.findOne({
      where: { customer_id: customer_id },
    });

    if (!loyaltyCustomer) {
      return {
        status: false,
        message: "Customer not enrolled in loyalty program",
        data: null,
      };
    }

    // Calculate new balances
    const balanceBefore = loyaltyCustomer.available_points;
    let balanceAfter = balanceBefore;

    if (transaction_type === "earn" || transaction_type === "bonus") {
      balanceAfter = balanceBefore + points_amount;
      
      // Update loyalty customer
      loyaltyCustomer.current_points += points_amount;
      loyaltyCustomer.total_points_earned += points_amount;
      loyaltyCustomer.available_points = balanceAfter;
      loyaltyCustomer.last_points_activity = new Date();
    } else if (transaction_type === "redeem") {
      if (balanceBefore < points_amount) {
        return {
          status: false,
          message: "Insufficient points balance",
          data: null,
        };
      }
      
      balanceAfter = balanceBefore - points_amount;
      
      // Update loyalty customer
      loyaltyCustomer.current_points -= points_amount;
      loyaltyCustomer.total_points_redeemed += points_amount;
      loyaltyCustomer.available_points = balanceAfter;
      loyaltyCustomer.last_points_activity = new Date();
    } else if (transaction_type === "adjustment") {
      balanceAfter = points_amount; // Direct adjustment
      
      const difference = points_amount - balanceBefore;
      if (difference > 0) {
        loyaltyCustomer.total_points_earned += difference;
      } else {
        loyaltyCustomer.total_points_redeemed += Math.abs(difference);
      }
      
      loyaltyCustomer.current_points = points_amount;
      loyaltyCustomer.available_points = points_amount;
      loyaltyCustomer.last_points_activity = new Date();
    }

    // Save loyalty customer
    await loyaltyRepo.save(loyaltyCustomer);

    // Create points transaction
    const transaction = pointsRepo.create({
      customer_id,
      loyalty_customer_id: loyaltyCustomer.id,
      transaction_type,
      points_amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type,
      reference_id,
      description,
      status: "active",
      created_by: _userId,
    });

    await pointsRepo.save(transaction);

    // Log activity
    await log_audit(transaction_type, "PointsTransaction", transaction.id, _userId, {
      customer_id,
      points_amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description,
    });

    return {
      status: true,
      message: "Points adjusted successfully",
      data: {
        transaction,
        customer: loyaltyCustomer,
      },
    };
  } catch (error) {
    console.error("adjustCustomerPoints error:", error);
    
    await log_audit("error", "PointsTransaction", 0, _userId, {
      customer_id,
      points_amount,
      transaction_type,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to adjust points: ${error.message}`,
      data: null,
    };
  }
}

module.exports = adjustCustomerPoints;