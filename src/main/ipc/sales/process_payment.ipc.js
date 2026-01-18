// sales/process_payment.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function processPayment(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    payment_method, 
    // @ts-ignore
    amount_paid, 
    // @ts-ignore
    change = 0, 
    // @ts-ignore
    transaction_id = "",
    // @ts-ignore
    payment_notes = "",
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    if (!sale_id) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    if (!payment_method) {
      return {
        status: false,
        message: "Payment method is required",
        data: null,
      };
    }

    const saleRepo = queryRunner.manager.getRepository(Sale);

    // Find the sale
    const sale = await saleRepo.findOne({
      where: { id: sale_id }
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${sale_id} not found`,
        data: null,
      };
    }

    // Check if sale is already paid
    // @ts-ignore
    if (sale.payment_status === 'paid') {
      return {
        status: false,
        message: "Sale is already paid",
        data: null,
      };
    }

    // Validate payment amount
    // @ts-ignore
    const amountDue = sale.total - (sale.amount_paid || 0);
    
    if (amount_paid < amountDue) {
      return {
        status: false,
        message: `Insufficient payment. Amount due: ₱${amountDue}, Amount paid: ₱${amount_paid}`,
        data: null,
      };
    }

    // Calculate actual change
    const actualChange = amount_paid - amountDue;
    
    // Update sale payment details
    const updateData = {
      payment_method,
      // @ts-ignore
      amount_paid: (sale.amount_paid || 0) + amount_paid,
      payment_change: actualChange,
      payment_transaction_id: transaction_id,
      payment_notes,
      payment_status: 'paid',
      paid_at: new Date(),
      updated_at: new Date(),
    };

    // If full payment, update status
    // @ts-ignore
    if ((sale.amount_paid || 0) + amount_paid >= sale.total) {
      // @ts-ignore
      updateData.status = 'completed';
    }

    await saleRepo.update(sale_id, updateData);

    const updatedSale = await saleRepo.findOne({
      where: { id: sale_id },
      relations: ["user"],
    });

    // Generate payment receipt
    const paymentReceipt = {
      receipt_number: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sale_reference: sale.reference_number,
      payment_date: new Date().toISOString(),
      payment_method,
      amount_paid,
      amount_due: amountDue,
      change_given: actualChange,
      transaction_id,
      processed_by: _userId,
    };

    // Log audit
    await log_audit("payment", "Sale", sale_id, _userId, {
      payment_method,
      amount_paid,
      change_given: actualChange,
      // @ts-ignore
      previous_payment_status: sale.payment_status,
      new_payment_status: 'paid',
    });

    return {
      status: true,
      message: "Payment processed successfully",
      data: {
        sale: updatedSale,
        payment_receipt: paymentReceipt,
        payment_summary: {
          total_amount: sale.total,
          // @ts-ignore
          previous_paid: sale.amount_paid || 0,
          this_payment: amount_paid,
          // @ts-ignore
          new_total_paid: (sale.amount_paid || 0) + amount_paid,
          change_given: actualChange,
          // @ts-ignore
          balance: Math.max(0, sale.total - ((sale.amount_paid || 0) + amount_paid)),
        },
      },
    };
  } catch (error) {
    console.error("processPayment error:", error);

    await log_audit("error", "Sale", sale_id, _userId, {
      action: "payment",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to process payment: ${error.message}`,
      data: null,
    };
  }
}

module.exports = processPayment;