import QRCode from "qrcode";

export async function generateQRCodeASCII(data) {
  // Generate QR code as ASCII art
  return await QRCode.toString(data, { type: "terminal" });
}
