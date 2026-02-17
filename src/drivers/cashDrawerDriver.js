// src/drivers/cashDrawerDriver.js
module.exports = {
  async open() {
    try {
      // Kung RJ11 port via printer, kadalasan ESC/POS command lang:
      // sendPulse() o openDrawer() depende sa library
      console.log("[cashDrawerDriver] Signal sent to open drawer");
      // TODO: integrate actual library call here
    } catch (err) {
      console.error("[cashDrawerDriver] Failed to open drawer:", err.message);
      throw err;
    }
  }
};
