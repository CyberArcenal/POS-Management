// loyalty/notifications/expiration_reminder.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");





/**
 * @param {any} customerId
 * @param {any} userId
 */
async function sendPointsExpirationReminder(customerId, userId) {
  try {
    const pointsRepo = AppDataSource.getRepository(PointsTransaction);
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    const customerRepo = AppDataSource.getRepository(Customer);
    
    // Get customer details
    const customer = await customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Get loyalty customer
    const loyaltyCustomer = await loyaltyRepo.findOne({
      where: { customer_id: customerId },
    });

    if (!loyaltyCustomer) {
      return {
        status: false,
        message: "Customer not enrolled in loyalty program",
        data: null,
      };
    }

    // Get points expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPoints = await pointsRepo
      .createQueryBuilder("transaction")
      .select("SUM(transaction.points_amount)", "total_points")
      .addSelect("MIN(transaction.expiration_date)", "earliest_expiry")
      .where("transaction.customer_id = :customerId", { customerId })
      .andWhere("transaction.expiration_date BETWEEN :now AND :future")
      .andWhere("transaction.status = 'active'")
      .setParameters({
        customerId,
        now: new Date(),
        future: thirtyDaysFromNow,
      })
      .getRawOne();

    const totalExpiring = parseInt(expiringPoints.total_points) || 0;
    
    if (totalExpiring === 0) {
      return {
        status: false,
        message: "No points expiring soon",
        data: { points_expiring: 0 },
      };
    }

    const earliestExpiry = expiringPoints.earliest_expiry;
    const daysUntilExpiry = earliestExpiry ? 
      // @ts-ignore
      Math.ceil((new Date(earliestExpiry) - new Date()) / (1000 * 60 * 60 * 24)) : 30;

    // Prepare notification data
    const notificationData = {
      customer_id: customerId,
      customer_name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
      customer_email: customer.email,
      customer_phone: customer.phone || customer.mobile,
      points_expiring: totalExpiring,
      expiry_date: earliestExpiry,
      days_until_expiry: daysUntilExpiry,
      current_points_balance: loyaltyCustomer.available_points,
      reminder_sent_at: new Date(),
    };

    // Here you would typically:
    // 1. Send email notification
    // 2. Send SMS notification
    // 3. Create in-app notification
    // 4. Log to notification system
    
    // For now, we'll just log it
    console.log("Points expiration reminder would be sent:", notificationData);

    // Update loyalty customer with expiring points info
    loyaltyCustomer.points_expiring_soon = totalExpiring;
    await loyaltyRepo.save(loyaltyCustomer);

    // Log activity
    await log_audit("notification", "PointsExpiration", customerId, userId, {
      customer_id: customerId,
      points_expiring: totalExpiring,
      expiry_date: earliestExpiry,
      notification_type: "expiration_reminder",
    });

    return {
      status: true,
      message: `Expiration reminder prepared for ${totalExpiring} points expiring in ${daysUntilExpiry} days`,
      data: notificationData,
    };
  } catch (error) {
    console.error("sendPointsExpirationReminder error:", error);
    
    await log_audit("error", "PointsExpiration", 0, userId, {
      customer_id: customerId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to send expiration reminder: ${error.message}`,
      data: null,
    };
  }
}

// Batch expiration reminders for all customers
/**
 * @param {any} userId
 */
// @ts-ignore
async function sendBatchExpirationReminders(userId) {
  try {
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    
    // Get all active loyalty customers
    const loyaltyCustomers = await loyaltyRepo.find({
      where: { is_active: true },
      relations: ["customer"],
    });

    let totalRemindersSent = 0;
    let totalPointsExpiring = 0;
    const results = [];

    for (const loyaltyCustomer of loyaltyCustomers) {
      try {
        const result = await sendPointsExpirationReminder(loyaltyCustomer.customer_id, userId);
        if (result.status) {
          totalRemindersSent++;
          // @ts-ignore
          totalPointsExpiring += result.data.points_expiring;
          results.push({
            customer_id: loyaltyCustomer.customer_id,
            success: true,
            message: result.message,
          });
        } else {
          results.push({
            customer_id: loyaltyCustomer.customer_id,
            success: false,
            message: result.message,
          });
        }
      } catch (error) {
        results.push({
          customer_id: loyaltyCustomer.customer_id,
          success: false,
          // @ts-ignore
          message: error.message,
        });
      }
    }

    return {
      status: true,
      message: `Sent ${totalRemindersSent} expiration reminders for ${totalPointsExpiring} total points`,
      data: {
        total_reminders_sent: totalRemindersSent,
        total_points_expiring: totalPointsExpiring,
        results: results,
      },
    };
  } catch (error) {
    console.error("sendBatchExpirationReminders error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to send batch expiration reminders: ${error.message}`,
      data: null,
    };
  }
}

module.exports = sendPointsExpirationReminder;
// Note: To enable batch processing, you can add another IPC method