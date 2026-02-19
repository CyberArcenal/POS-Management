// src/drivers/usbDrawerDriver.js
// Example using a serial port or USB HID – adapt to your hardware
const { SerialPort } = require('serialport'); // or 'usb' package

class UsbDrawerDriver {
  constructor() {
    this.port = null;
  }

  async _openPort() {
    // Implement based on your device (e.g., /dev/ttyUSB0, COM3)
    const path = await require('../utils/system').cashDrawerDevicePath();
    this.port = new SerialPort({ path, baudRate: 9600 });
    return new Promise((resolve, reject) => {
      this.port.on('open', resolve);
      this.port.on('error', reject);
    });
  }

  async openDrawer(pin = 0) {
    if (!this.port) await this._openPort();
    // Send the appropriate command to open the drawer
    // For many cash drawers, a simple pulse on pin 2 (RJ11) is sent via a serial command
    // Example: send a byte 0x00 or something – consult your drawer's manual
    return new Promise((resolve, reject) => {
      this.port.write(Buffer.from([0x00]), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = UsbDrawerDriver;