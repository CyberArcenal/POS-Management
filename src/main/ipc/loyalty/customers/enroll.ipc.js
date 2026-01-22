// loyalty/customers/enroll.ipc.js
//@ts-check

const Customer = require("../../../../entities/Customer");
const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { LoyaltyProgram } = require("../../../../entities/LoyaltyProgram");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");


/**
 * @param {{ customer_id: any; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; customer_code: unknown; first_name: unknown; last_name: unknown; display_name: unknown; email: unknown; phone: unknown; mobile: unknown; address_line1: unknown; address_line2: unknown; city: unknown; state: unknown; postal_code: unknown; country: unknown; company_name: unknown; tax_id: unknown; customer_type: unknown; status: unknown; credit_limit: unknown; current_balance: unknown; payment_terms: unknown; preferred_payment_method: unknown; customer_group: unknown; customer_rating: unknown; notes: unknown; tags: unknown; allow_marketing_emails: unknown; allow_sms_notifications: unknown; created_at: unknown; updated_at: unknown; last_purchase_at: unknown; created_by: unknown; updated_by: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; customer_id: unknown; customer_code: unknown; tier: unknown; current_points: unknown; total_points_earned: unknown; total_points_redeemed: unknown; available_points: unknown; pending_points: unknown; points_expiring_soon: unknown; next_tier_points_needed: unknown; last_tier_upgrade: unknown; membership_start_date: unknown; membership_end_date: unknown; last_points_activity: unknown; is_active: unknown; enrollment_source: unknown; receive_points_notifications: unknown; receive_tier_notifications: unknown; created_at: unknown; updated_at: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; program_name: unknown; program_description: unknown; points_currency_name: unknown; points_per_currency: unknown; minimum_redemption_points: unknown; expiration_months: unknown; signup_bonus_points: unknown; birthday_bonus_points: unknown; anniversary_bonus_points: unknown; tier_requirements: unknown; tier_benefits: unknown; is_active: unknown; created_at: unknown; updated_at: unknown; created_by: unknown; updated_by: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; customer_id: unknown; loyalty_customer_id: unknown; transaction_type: unknown; points_amount: unknown; balance_before: unknown; balance_after: unknown; reference_type: unknown; reference_id: unknown; reference_number: unknown; description: unknown; expiration_date: unknown; status: unknown; created_at: unknown; created_by: unknown; reversed_at: unknown; reversed_by: unknown; reversal_reason: unknown; }>) => { (): any; new (): any; findOne: { (arg0: { where: { is_active: boolean; }; }): any; new (): any; }; }; }; }} queryRunner
 */
async function enrollCustomerInLoyalty(params, queryRunner) {
  const { customer_id, _userId } = params;
  
  try {
    const customerRepo = queryRunner.manager.getRepository(Customer);
    const loyaltyRepo = queryRunner.manager.getRepository(LoyaltyCustomer);
    const pointsRepo = queryRunner.manager.getRepository(PointsTransaction);
    
    // Get customer
    const customer = await customerRepo.findOne({
      // @ts-ignore
      where: { id: customer_id },
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Check if already enrolled
    const existing = await loyaltyRepo.findOne({
      // @ts-ignore
      where: { customer_id: customer_id },
    });

    if (existing) {
      return {
        status: false,
        message: "Customer already enrolled in loyalty program",
        data: { loyalty_customer: existing },
      };
    }

    // Get loyalty settings for signup bonus
    const loyaltySettings = await queryRunner.manager
      .getRepository(LoyaltyProgram)
      .findOne({ where: { is_active: true } });

    const signupBonus = loyaltySettings?.signup_bonus_points || 0;

    // Create loyalty customer
    // @ts-ignore
    const loyaltyCustomer = loyaltyRepo.create({
      customer_id: customer.id,
      customer_code: customer.customer_code,
      tier: "bronze",
      current_points: signupBonus,
      available_points: signupBonus,
      total_points_earned: signupBonus,
      enrollment_source: "manual",
      is_active: true,
    });

    // @ts-ignore
    await loyaltyRepo.save(loyaltyCustomer);

    // Create points transaction for signup bonus
    if (signupBonus > 0) {
      // @ts-ignore
      const transaction = pointsRepo.create({
        customer_id: customer.id,
        loyalty_customer_id: loyaltyCustomer.id,
        transaction_type: "bonus",
        points_amount: signupBonus,
        balance_before: 0,
        balance_after: signupBonus,
        reference_type: "signup",
        description: "Signup bonus points",
        status: "active",
        created_by: _userId,
      });

      // @ts-ignore
      await pointsRepo.save(transaction);
    }

    // Log activity
    // @ts-ignore
    await log_audit("enroll", "LoyaltyCustomer", loyaltyCustomer.id, _userId, {
      customer_id: customer.id,
      customer_code: customer.customer_code,
      points_awarded: signupBonus,
    });

    return {
      status: true,
      message: "Customer enrolled in loyalty program successfully",
      data: {
        // @ts-ignore
        loyalty_customer,
        points_credited: signupBonus,
      },
    };
  } catch (error) {
    console.error("enrollCustomerInLoyalty error:", error);
    
    // @ts-ignore
    await log_audit("error", "LoyaltyCustomer", 0, _userId, {
      customer_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to enroll customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = enrollCustomerInLoyalty;