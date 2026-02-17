//@ts-check

const auditLogger = require("../utils/auditLogger");

class PrinterService {
  constructor() {
    try {
      this.driver = require("../drivers/escposDriver");
      console.log("[PrinterService] ESC/POS driver loaded");
    } catch (err) {
      // @ts-ignore
      console.warn("[PrinterService] No printer driver available:", err.message);
      this.driver = null;
    }
  }

  // @ts-ignore
  async printReceipt(sale) {
    if (!this.driver) {
      console.error("[PrinterService] No driver loaded, cannot print");
      return;
    }
    try {
      const receiptText = this.formatReceipt(sale);
      await this.driver.print(receiptText);

      await auditLogger.logCreate("PrinterEvent", sale.id, { action: "printReceipt" }, "system");
      console.log(`[PrinterService] Printed receipt for sale #${sale.id}`);
    } catch (err) {
      // @ts-ignore
      console.error("[PrinterService] Failed to print receipt:", err.message);
      throw err;
    }
  }

  // @ts-ignore
  formatReceipt(sale) {
    return `
      STORE NAME
      Address line
      -------------------------
      SALE #${sale.id}
      -------------------------
      ${sale.saleItems.map(
// @ts-ignore
      i => `${i.product.name} x${i.quantity} = ${i.lineTotal}`).join("\n")}
      -------------------------
      TOTAL: ${sale.totalAmount}
      Payment: ${sale.paymentMethod}
      Thank you for shopping!
    `;
  }
}

module.exports = PrinterService;
