const escpos = require("escpos");
escpos.USB = require("escpos-usb");

class ThermalDriver {
  constructor() {
    this.device = null;
    this.printer = null;
  }

  async _getPrinter() {
    if (!this.device) {
      this.device = new escpos.USB();
      await new Promise((resolve, reject) => {
        this.device.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.printer = new escpos.Printer(this.device);
    }
    return this.printer;
  }

  async print(text) {
    const printer = await this._getPrinter();
    return new Promise((resolve, reject) => {
      try {
        printer.text(text);
        printer.cut();
        printer.close();
        this.device = null; // device closed, reset
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  async openDrawer(pin = 0) {
    const printer = await this._getPrinter();
    return new Promise((resolve, reject) => {
      try {
        // ESC/POS command: ESC p m t1 t2 (m = pin 0/1)
        printer.drawer(pin);
        printer.close();
        this.device = null;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ThermalDriver;