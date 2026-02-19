// src/main/services/BarcodeService.js
//@ts-check
const { BrowserWindow } = require('electron');
const { logger } = require('../utils/logger');

class BarcodeService {
  /**
   * I-broadcast ang barcode sa lahat ng renderer windows.
   * @param {string} barcode
   */
  emitBarcode(barcode) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('barcode-scanned', barcode);
      }
    }
    if (logger) logger.info(`[Barcode] Emitted: ${barcode}`);
  }
}

const barcodeService = new BarcodeService();
module.exports = barcodeService;