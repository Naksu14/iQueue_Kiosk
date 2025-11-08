import escpos from "escpos";
import QRCode from "qrcode";
import { createWriteStream } from "fs";

escpos.USB = require("escpos-usb");

export async function printTicketWithQR(message, transactionCode) {
  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(
    JSON.stringify({ code: transactionCode }),
    { type: "png", width: 200 }
  );

  // Connect to USB printer
  const device = new escpos.USB();
  const printer = new escpos.Printer(device);

  device.open(function () {
    printer.text(message);
    printer.image(qrBuffer, "s8");
    printer.cut();
    printer.close();
  });
}
