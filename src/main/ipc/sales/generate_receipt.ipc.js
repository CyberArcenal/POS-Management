// sales/generate_receipt.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {number} saleId
 * @param {number} userId
 */
async function generateReceipt(saleId, userId) {
  try {
    if (!saleId) {
      return {
        status: false,
        message: "Sale ID is required",
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const sale = await saleRepo.findOne({
      where: { id: saleId },
      relations: [
        "user",
        "items",
        "items.product",
        "items.variant",
      ],
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${saleId} not found`,
        data: null,
      };
    }

    // Generate receipt data
    const receiptData = {
      receipt_number: sale.reference_number || `RECEIPT-${saleId}`,
      sale_id: sale.id,
      date_time: sale.datetime || sale.created_at,
      // @ts-ignore
      cashier: sale.user ? {
        // @ts-ignore
        id: sale.user.id,
        // @ts-ignore
        name: sale.user.display_name || sale.user.username,
      } : null,
      
      // Customer information
      customer: {
        // @ts-ignore
        name: sale.customer_name || 'Walk-in Customer',
        // @ts-ignore
        phone: sale.customer_phone,
        // @ts-ignore
        email: sale.customer_email,
      },
      
      // Items
      // @ts-ignore
      items: sale.items?.map((/** @type {{ id: any; product: { name: any; barcode: any; sku: any; }; product_id: any; variant: { name: any; }; quantity: any; unit_price: any; total_price: any; discount_amount: any; }} */ item) => ({
        id: item.id,
        product_name: item.product?.name || `Product ${item.product_id}`,
        variant_name: item.variant?.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount: item.discount_amount || 0,
        barcode: item.product?.barcode,
        sku: item.product?.sku,
      })) || [],
      
      // Totals
      // @ts-ignore
      subtotal: sale.subtotal || sale.items?.reduce((/** @type {any} */ sum, /** @type {{ total_price: any; }} */ item) => sum + item.total_price, 0) || 0,
      // @ts-ignore
      discount_total: sale.discount_amount || sale.items?.reduce((/** @type {any} */ sum, /** @type {{ discount_amount: any; }} */ item) => sum + (item.discount_amount || 0), 0) || 0,
      // @ts-ignore
      tax_total: sale.tax_amount || 0,
      grand_total: sale.total,
      
      // Payment information
      payment: {
        // @ts-ignore
        method: sale.payment_method || 'Cash',
        // @ts-ignore
        amount_paid: sale.amount_paid || sale.total,
        // @ts-ignore
        change: sale.payment_change || 0,
        // @ts-ignore
        status: sale.payment_status || 'paid',
      },
      
      // Store information (could be from config)
      store: {
        name: "POS Store",
        address: "123 Main Street, City",
        phone: "(123) 456-7890",
        vat_registration: "VAT-123456789",
      },
      
      // Receipt footer
      footer: {
        thank_you_message: "Thank you for your purchase!",
        return_policy: "Items can be returned within 7 days with receipt",
        contact_info: "For inquiries: support@posstore.com",
      },
    };

    // Calculate itemized totals
    const itemizedSummary = {
      total_items: receiptData.items.length,
      total_quantity: receiptData.items.reduce((/** @type {any} */ sum, /** @type {{ quantity: any; }} */ item) => sum + item.quantity, 0),
      total_before_discount: receiptData.items.reduce((/** @type {number} */ sum, /** @type {{ unit_price: number; quantity: number; }} */ item) => 
        sum + (item.unit_price * item.quantity), 0),
    };

    // Generate QR code data for receipt verification
    const qrData = {
      sale_id: sale.id,
      receipt_number: receiptData.receipt_number,
      date: receiptData.date_time,
      total: receiptData.grand_total,
      hash: generateReceiptHash(sale.id, receiptData.receipt_number, receiptData.grand_total),
    };

    await log_audit("generate_receipt", "Sale", saleId, userId, {
      receipt_number: receiptData.receipt_number,
      total_amount: receiptData.grand_total,
    });

    return {
      status: true,
      message: "Receipt generated successfully",
      data: {
        receipt: receiptData,
        itemized_summary: itemizedSummary,
        qr_data: qrData,
        print_data: formatForPrint(receiptData),
        download_url: `/receipts/${saleId}/download`,
      },
    };
  } catch (error) {
    console.error("generateReceipt error:", error);

    await log_audit("error", "Sale", saleId, userId, {
      action: "generate_receipt",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate receipt: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate a simple hash for receipt verification
 * @param {unknown} saleId
 * @param {{}} receiptNumber
 * @param {unknown} total
 */
function generateReceiptHash(saleId, receiptNumber, total) {
  const data = `${saleId}-${receiptNumber}-${total}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

/**
 * Format receipt data for thermal printer
 * @param {{ receipt_number: any; sale_id?: unknown; date_time: any; cashier: any; customer: any; items: any; subtotal: any; discount_total: any; tax_total: any; grand_total: any; payment: any; store: any; footer: any; }} receiptData
 */
function formatForPrint(receiptData) {
  const lines = [];
  
  // Store header
  lines.push("=".repeat(32));
  lines.push(`      ${receiptData.store.name}`);
  lines.push(`  ${receiptData.store.address}`);
  lines.push(`   ${receiptData.store.phone}`);
  lines.push("-".repeat(32));
  
  // Receipt info
  lines.push(`Receipt: ${receiptData.receipt_number}`);
  lines.push(`Date: ${new Date(receiptData.date_time).toLocaleString()}`);
  lines.push(`Cashier: ${receiptData.cashier?.name || 'System'}`);
  lines.push("-".repeat(32));
  
  // Customer info
  if (receiptData.customer.name !== 'Walk-in Customer') {
    lines.push(`Customer: ${receiptData.customer.name}`);
    if (receiptData.customer.phone) {
      lines.push(`Phone: ${receiptData.customer.phone}`);
    }
  }
  lines.push("-".repeat(32));
  
  // Items
  lines.push("Qty  Description           Price");
  lines.push("-".repeat(32));
  
  receiptData.items.forEach((/** @type {{ product_name: string; quantity: { toString: () => string; }; unit_price: number; total_price: number; discount: number; }} */ item) => {
    const name = item.product_name.length > 20 ? 
      item.product_name.substring(0, 17) + "..." : item.product_name;
    const qty = item.quantity.toString().padStart(3);
    const price = `₱${item.unit_price.toFixed(2)}`.padStart(8);
    // @ts-ignore
    const total = `₱${item.total_price.toFixed(2)}`;
    
    lines.push(`${qty} x ${name.padEnd(20)} ${price}`);
    if (item.discount > 0) {
      lines.push(`     Discount: -₱${item.discount.toFixed(2)}`.padStart(31));
    }
  });
  
  lines.push("-".repeat(32));
  
  // Totals
  lines.push(`Subtotal:        ₱${receiptData.subtotal.toFixed(2)}`.padStart(31));
  if (receiptData.discount_total > 0) {
    lines.push(`Discount:       -₱${receiptData.discount_total.toFixed(2)}`.padStart(31));
  }
  if (receiptData.tax_total > 0) {
    lines.push(`Tax:             ₱${receiptData.tax_total.toFixed(2)}`.padStart(31));
  }
  lines.push("=".repeat(32));
  lines.push(`TOTAL:           ₱${receiptData.grand_total.toFixed(2)}`.padStart(31));
  lines.push("=".repeat(32));
  
  // Payment
  lines.push(`Payment: ${receiptData.payment.method}`);
  lines.push(`Paid:    ₱${receiptData.payment.amount_paid.toFixed(2)}`);
  if (receiptData.payment.change > 0) {
    lines.push(`Change:  ₱${receiptData.payment.change.toFixed(2)}`);
  }
  
  // Footer
  lines.push("-".repeat(32));
  lines.push(receiptData.footer.thank_you_message);
  lines.push(receiptData.footer.return_policy);
  lines.push(receiptData.footer.contact_info);
  lines.push("=".repeat(32));
  
  return lines.join('\n');
}

module.exports = generateReceipt;