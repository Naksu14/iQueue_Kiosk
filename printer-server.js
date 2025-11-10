import express from "express";
import { writeFileSync, unlinkSync } from "fs";
import bodyParser from "body-parser";
import { exec } from "child_process";
import cors from "cors";
import util from "util";
import qrcode from "qrcode-terminal";

// Build ESC/POS QR code bytes for a UTF-8 string without using native modules.
// Uses the standard GS ( k ... ) sequence to store and print QR data on most ESC/POS printers.
function buildEscposQRCode(data, size = 6, errorCorrection = 0x30) {
  const dataBuf = Buffer.from(data, "utf8");
  // Select model: 2
  const modelCmd = Buffer.from([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
  // Set module size
  const sizeCmd = Buffer.from([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]);
  // Set error correction level (48..51 => levels L..H typically)
  const errorCmd = Buffer.from([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, errorCorrection]);
  // Store data in the symbol storage area
  const len = dataBuf.length + 3;
  const pL = len & 0xFF;
  const pH = (len >> 8) & 0xFF;
  const storeCmd = Buffer.from([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
  // Print the symbol
  const printCmd = Buffer.from([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

  return Buffer.concat([modelCmd, sizeCmd, errorCmd, storeCmd, dataBuf, printCmd]);
}

const app = express();
const execAsync = util.promisify(exec); // Allows async/await usage

// CORS configuration
const corsOptions = {
  // Allow the React dev server and local network for kiosk access.
  // In production restrict this to the kiosk UI origin or specific IPs.
  origin: ["http://localhost:3000", "http://127.0.0.1", "*"], // React app origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
  optionsSuccessStatus: 204, // for legacy browsers
};

// Apply CORS middleware globally
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Health check endpoint
app.get("/ping", (req, res) => res.json({ ok: true }));

app.post("/pickUpPrint", async (req, res) => {
  const { personalId, office, pickup, transactionCode, pickUpTransaction } = req.body;

  if (!personalId || !transactionDetails) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  // Here, you could save it to DB or memory (for demo, just echo)
  const newTransaction = {
    id: Date.now(),
    personalId,
    transactionDetails,
    fee: fee || 0,
    createdAt: new Date(),
  };

  console.log("New Transaction:", newTransaction);

  res.json({ success: true, transaction: newTransaction });
});

app.post("/print", async (req, res) => {
  try {
    const { queueNumber, transactionCode, transactionArray } = req.body;

    if (!queueNumber || !transactionCode || !transactionArray) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // Build ticket header up to the 'Queue No:' label. We'll print the queue number enlarged
    const header = `\n================================\n` +
      `  Jesus Good Shepherd School\n` +
      `      Transaction Slip\n` +
      `--------- iQueue Ticket --------\n` +
      `Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}\n` +
      `     \n `; // queueNumber will be printed enlarged

    const afterQueue = `\n--------------------------------\n` +
      `Transaction(s):\n`;

    // Build transaction lines
    let txLines = "";
    for (let i = 0; i < transactionArray.length; i++) {
      const t = transactionArray[i];
      txLines += `${i + 1}. ${t.transactionDetails || ""}\n`;
      if (t.fee) txLines += `   Fee: Php ${t.fee}\n`;
    }

    const footer = `--------------------------------\n` +
      ` T-Code: ${transactionCode}\n` +
      `--------------------------------\n` +
      `   Thank you for using iQueue!\n` +
      `================================\n\n`;

  // Build QR payload JSON as requested: {"Code":"..."}
  const qrPayload = JSON.stringify({Code: transactionCode });
  console.log("QR Code for ticket (console):");
  qrcode.generate(qrPayload, { small: true });

  // ESC/POS: set double width & height for the queue number using GS ! n (0x1D 0x21 n)
  const GS_SIZE_2X = Buffer.from([0x1D, 0x21, 0x11]); // 2x width & 2x height
  const GS_SIZE_NORMAL = Buffer.from([0x1D, 0x21, 0x00]); // reset
  // ESC/POS alignment: ESC a n  (0 left, 1 center, 2 right)
  const ESC_ALIGN_CENTER = Buffer.from([0x1B, 0x61, 0x01]);
  const ESC_ALIGN_LEFT = Buffer.from([0x1B, 0x61, 0x00]);

  const beforeBuf = Buffer.from(header, "utf8");
  const queueBuf = Buffer.from(`${queueNumber}\n`, "utf8");
  const qrBuf = buildEscposQRCode(qrPayload, 6, 0x30); // size=6, error level L
  const afterBuf = Buffer.from(afterQueue + txLines + footer, "utf8");

    // Center the QR block using ESC a 1, then reset alignment to left
    const LF = Buffer.from([0x0A]);
    const finalBuf = Buffer.concat([
      beforeBuf,
      // Center and print the enlarged queue number
      ESC_ALIGN_CENTER,
      GS_SIZE_2X,
      queueBuf,
      GS_SIZE_NORMAL,
      LF,
      ESC_ALIGN_LEFT,
      // Center QR afterwards
      ESC_ALIGN_CENTER,
      qrBuf,
      LF,
      ESC_ALIGN_LEFT,
      afterBuf,
    ]);

  // Temporary file for printing (binary)
  const tmpFile = "/tmp/ticket.txt";
  writeFileSync(tmpFile, finalBuf);

    // Execute print command
    await execAsync(`sudo tee /dev/usb/lp0 < ${tmpFile}`);

    // Cleanup
    unlinkSync(tmpFile);
    console.log(` Printed successfully: Queue ${queueNumber}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Print error:", err);
    res.status(500).json({ success: false, message: "Printer error" });
  }
});

// Start server
const PORT = 4000;
const HOST = "0.0.0.0"; // bind to all interfaces so remote browsers on the kiosk can connect

app.listen(PORT, HOST, () => {
  console.log(` Printer server running on ${HOST}:${PORT}`);
});

