import { createRequire } from "module";
const require = createRequire(import.meta.url);
const escpos = require("escpos");
const escposUsb = require("escpos-usb");
import QRCode from "qrcode";

escpos.USB = escposUsb;

// Print the ticket. Returns a Promise that resolves when printing completes or rejects on error.
export function printTicketWithQR(message, transactionCode) {
  return new Promise(async (resolve, reject) => {
    try {
      // Generate QR code as PNG buffer (kept here for future use)
      // const qrBuffer = await QRCode.toBuffer(JSON.stringify({ code: transactionCode }), { type: "png", width: 200 });

      // Connect to USB printer
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      device.open(function (err) {
        if (err) return reject(err);
        try {
          printer.align("lt");
          printer.text(message);
          // Image printing (QR) is disabled for now — implement when escpos image loader is available.
          printer.cut();
          printer.close();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
