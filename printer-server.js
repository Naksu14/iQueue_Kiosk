import express from "express";
import { writeFileSync, unlinkSync } from "fs";
import bodyParser from "body-parser";
import { exec } from "child_process";
import cors from "cors";
import util from "util";
import qrcode from "qrcode-terminal";

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

app.post("/print", async (req, res) => {
  try {
    const { queueNumber, transactionCode, transactionArray } = req.body;

    if (!queueNumber || !transactionCode || !transactionArray) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    let message = `\n================================\n`;
    message += `  Jesus Good Shepherd School\n`;
    message += `      Transaction Slip\n`;
    message += `--------- iQueue Ticket --------\n`;
    message += `Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}\n`;
    message += `Queue No: ${queueNumber}\n`;
    message += `--------------------------------\n`;
    message += `Transaction(s):\n`;

    // Print each transaction detail
    for (let i = 0; i < transactionArray.length; i++) {
      const t = transactionArray[i];
      message += `${i + 1}. ${t.transactionDetails || ""}\n`;
      message += `   ${t.officeName || ""}\n`;
      if (t.fee) message += `   Fee: Php ${t.fee}\n`;
      if (t.paymentStatus) message += `   Payment: ${t.paymentStatus}\n`;
      message += `\n`;
    }

    message += `--------------------------------\n`;
    message += `Transaction Code: ${transactionCode}\n`;
    message += `--------------------------------\n`;
    message += `      Thank you for using iQueue!\n`;
    message += `================================\n\n`;
    // Print QR code to console (contains only transaction code)
    const qrPayload = JSON.stringify({ code: transactionCode });
    console.log("QR Code for ticket:");
    qrcode.generate(qrPayload, { small: true });

    // Temporary file for printing
    const tmpFile = "/tmp/ticket.txt";
    writeFileSync(tmpFile, message);

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
