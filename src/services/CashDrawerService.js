// src/services/CashDrawerService.js
//@ts-check
const auditLogger = require("../utils/auditLogger");

class CashDrawerService {
  constructor() {
    try {
      // Load driver (hal. RJ11 via printer, USB, o mock driver)
      this.driver = require("../drivers/cashDrawerDriver");
      console.log("[CashDrawerService] Driver loaded");
    } catch (err) {
      // @ts-ignore
      console.warn("[CashDrawerService] No cash drawer driver available:", err.message);
      this.driver = null;
    }
  }

  async openDrawer(reason = "sale") {
    if (!this.driver) {
      console.error("[CashDrawerService] No driver loaded, cannot open drawer");
      return;
    }
    try {
      await this.driver.open();

      await auditLogger.logCreate("CashDrawerEvent", null, { action: "openDrawer", reason }, "system");
      console.log(`[CashDrawerService] Drawer opened (${reason})`);
    } catch (err) {
      console.error("[CashDrawerService] Failed to open drawer:", err.message);
      throw err;
    }
  }
}

module.exports = CashDrawerService;
