const escpos = require("escpos");
escpos.USB = require("escpos-usb");

module.exports = {
  async print(text) {
    return new Promise((resolve, reject) => {
      try {
        const device = new escpos.USB(); // auto-detect USB printer
        const printer = new escpos.Printer(device);

        device.open(() => {
          printer.text(text);
          printer.cut();
          printer.close();
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};
