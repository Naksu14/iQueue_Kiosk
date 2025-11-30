import express from "express";
import { writeFileSync, unlinkSync } from "fs";
import { promises as fsp } from "fs";
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
  const modelCmd = Buffer.from([
    0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
  ]);
  // Set module size
  const sizeCmd = Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]);
  // Set error correction level (48..51 => levels L..H typically)
  const errorCmd = Buffer.from([
    0x1d,
    0x28,
    0x6b,
    0x03,
    0x00,
    0x31,
    0x45,
    errorCorrection,
  ]);
  // Store data in the symbol storage area
  const len = dataBuf.length + 3;
  const pL = len & 0xff;
  const pH = (len >> 8) & 0xff;
  const storeCmd = Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
  // Print the symbol
  const printCmd = Buffer.from([
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
  ]);

  return Buffer.concat([
    modelCmd,
    sizeCmd,
    errorCmd,
    storeCmd,
    dataBuf,
    printCmd,
  ]);
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
app.use(express.json());

// Health check endpoint
app.get("/ping", (req, res) => res.json({ ok: true }));

// Simple printer paper-status checker using ESC/POS DLE EOT 1 (0x10 0x04 0x01).
// This is best-effort: it writes the status-request bytes to the device and
// attempts to read a single response byte with a short timeout. Many ESC/POS
// printers respond with a status byte; this code returns the raw byte (hex)
// and a conservative heuristic `hasPaper` boolean. If the device doesn't
// respond the endpoint reports no-response.
// Check printer status using DLE EOT n (0x10 0x04 n). `statusType` is the n value.
async function checkPrinterPaper(
  devicePath = "/dev/usb/lp0",
  timeoutMs = 700,
  statusType = 1
) {
  const req = Buffer.from([0x10, 0x04, statusType]); // DLE EOT n
  try {
    const fd = await fsp.open(devicePath, "r+");
    try {
      // Write request
      await fd.write(req);

      // Attempt to read a single byte with a timeout
      const readPromise = fd
        .read(Buffer.alloc(1), 0, 1, null)
        .then(({ bytesRead, buffer }) => {
          if (bytesRead === 1) return buffer[0];
          return null;
        });

      const timeout = new Promise((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      );
      const resByte = await Promise.race([readPromise, timeout]);

      await fd.close();

      if (resByte === null) {
        return { ok: false, message: "no-response", raw: null, hasPaper: null };
      }

      const hex = resByte.toString(16).padStart(2, "0");

      // Heuristic: many ESC/POS printers use bit 5 (0x20) in the response to
      // indicate paper end / paper sensor. This heuristic treats bit 5 == 0 as
      // "has paper" and bit 5 == 1 as "no paper". Results may vary by model.
      const hasPaper = (resByte & 0x20) === 0;

      return { ok: true, raw: hex, hasPaper };
    } catch (err) {
      try {
        await fd.close();
      } catch (e) {}
      return { ok: false, message: "io-error", error: String(err) };
    }
  } catch (err) {
    return { ok: false, message: "open-failed", error: String(err) };
  }
}

// Perform multiple quick reads and return a stable majority result.
async function getStablePaperStatus(
  devicePath = "/dev/usb/lp0",
  statusType = 2,
  attempts = 3,
  delayMs = 120
) {
  const readings = [];
  for (let i = 0; i < attempts; i++) {
    const r = await checkPrinterPaper(devicePath, 500, statusType);
    // If IO failed, record as null so it doesn't count toward majority
    if (!r || !r.ok) {
      readings.push(null);
    } else {
      readings.push(r.hasPaper === true ? 1 : 0);
    }
    // small delay between attempts
    if (i < attempts - 1) await new Promise((res) => setTimeout(res, delayMs));
  }

  // Count only non-null readings
  const valid = readings.filter((v) => v === 0 || v === 1);
  if (valid.length === 0)
    return { ok: false, message: "no-valid-responses", readings };

  const ones = valid.filter((v) => v === 1).length;
  const zeros = valid.length - ones;
  const hasPaper = ones > zeros;
  return { ok: true, hasPaper, readings, sampleCount: valid.length };
}

// Printer status endpoint: returns raw response and hasPaper heuristic
app.get("/printerStatus", async (req, res) => {
  try {
    const typeParam = req.query.type;
    if (typeParam) {
      const type = parseInt(typeParam || "1", 10) || 1;
      const result = await checkPrinterPaper(undefined, undefined, type);
      return res.json(result);
    }

    // Default: use a stable majority check on status type=2 (paper-sensor friendly)
    const stable = await getStablePaperStatus(undefined, 2, 3, 120);
    res.json(stable);
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: "status-check-failed", error: String(err) });
  }
});

// Diagnostic endpoint: query status types 1..4 and return raw bytes and heuristics.
app.get("/printerStatus/all", async (req, res) => {
  try {
    const results = {};
    for (let n = 1; n <= 4; n++) {
      // keep default device path and timeout
      const r = await checkPrinterPaper(undefined, 700, n);
      results[`type${n}`] = r;
    }
    res.json({ ok: true, results });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: "status-check-failed", error: String(err) });
  }
});

app.post("/pickUpPrint", async (req, res) => {
  try {
    // Accept a simple pickup payload. Required: personalId, officeName, transactionDetails, transactionCode, queueNumber
    const { officeName, transactionDetails, transactionCode, queueNumber } =
      req.body;

    if (!transactionDetails || !transactionCode || !queueNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Build a pickup ticket similar to /print but tailored for pickup
    const header =
      `\n================================\n` +
      `  Jesus Good Shepherd School\n` +
      `         Pick-up Slip\n` +
      `--------- iQueue Ticket --------\n` +
      `Date:${new Date().toLocaleDateString()} Time:${new Date().toLocaleTimeString()}\n`;

    const infoLines = `Please proceed to the:\n ${officeName || ""}\n`;

    // Normalize transactionDetails to an array so clients may send either an
    // array of strings or a single string (joined by newlines or semicolons).
    let txArray = [];
    if (Array.isArray(transactionDetails)) txArray = transactionDetails;
    else if (typeof transactionDetails === "string") {
      txArray = transactionDetails
        .split(/\r?\n|\s*;\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const txLines = `Documents:\n ${txArray.join("\n")}\n`;

    const footer =
      `--------------------------------\n` +
      ` T-Code: ${transactionCode}\n` +
      `--------------------------------\n` +
      `   Thank you for using iQueue!\n` +
      `================================`;

    // ESC/POS alignment and sizing
    const GS_SIZE_2X = Buffer.from([0x1d, 0x21, 0x11]);
    const GS_SIZE_NORMAL = Buffer.from([0x1d, 0x21, 0x00]);
    const ESC_ALIGN_CENTER = Buffer.from([0x1b, 0x61, 0x01]);
    const ESC_ALIGN_LEFT = Buffer.from([0x1b, 0x61, 0x00]);
    const LF = Buffer.from([0x0a]);

    const beforeBuf = Buffer.from(header + infoLines, "utf8");
    const queueBuf = Buffer.from(`${queueNumber}\n`, "utf8");
    const afterBuf = Buffer.from(txLines + footer, "utf8");

    const finalBuf = Buffer.concat([
      beforeBuf,
      // center & enlarge queue number
      ESC_ALIGN_CENTER,
      GS_SIZE_2X,
      queueBuf,
      GS_SIZE_NORMAL,
      LF,
      ESC_ALIGN_LEFT,
      afterBuf,
    ]);

    // Write binary ticket and send to printer
    const tmpFile = "/tmp/pickup_ticket.bin";
    writeFileSync(tmpFile, finalBuf);
    await execAsync(`sudo tee /dev/usb/lp0 < ${tmpFile}`);
    try {
      unlinkSync(tmpFile);
    } catch (e) {}

    res.json({ success: true });
  } catch (err) {
    console.error("❌ pickUpPrint error:", err);
    res.status(500).json({ success: false, message: "Printer error" });
  }
});

app.post("/printInquiryTicket", async (req, res) => {
  try {
    const { officeName, transactionCode, queueNumber } = req.body || {};

    if (!transactionCode || !queueNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: queueNumber or transactionCode",
      });
    }

    // Build a pickup ticket similar to /print but tailored for pickup
    const header =
      `================================\n` +
      `  Jesus Good Shepherd School\n` +
      `        Inquiry Queue Slip\n` +
      `--------- iQueue Ticket --------\n` +
      `Date:${new Date().toLocaleDateString()} Time:${new Date().toLocaleTimeString()}\n`;

    const infoLines = `Please proceed to the:\n ${officeName || ""}\n`;

    const footer =
      `--------------------------------\n` +
      ` T-Code: ${transactionCode}\n` +
      `--------------------------------\n` +
      `   Thank you for using iQueue!\n` +
      `================================`;

    // ESC/POS alignment and sizing
    const GS_SIZE_2X = Buffer.from([0x1d, 0x21, 0x11]);
    const GS_SIZE_NORMAL = Buffer.from([0x1d, 0x21, 0x00]);
    const ESC_ALIGN_CENTER = Buffer.from([0x1b, 0x61, 0x01]);
    const ESC_ALIGN_LEFT = Buffer.from([0x1b, 0x61, 0x00]);
    const LF = Buffer.from([0x0a]);

    const beforeBuf = Buffer.from(header + infoLines, "utf8");
    const queueBuf = Buffer.from(`${queueNumber}\n`, "utf8");
    const afterBuf = Buffer.from(footer, "utf8");

    const finalBuf = Buffer.concat([
      beforeBuf,
      // center & enlarge queue number
      ESC_ALIGN_CENTER,
      GS_SIZE_2X,
      queueBuf,
      GS_SIZE_NORMAL,
      LF,
      ESC_ALIGN_LEFT,
      afterBuf,
    ]);

    // Write binary ticket and send to printer
    const tmpFile = "/tmp/pickup_ticket.bin";
    writeFileSync(tmpFile, finalBuf);
    await execAsync(`sudo tee /dev/usb/lp0 < ${tmpFile}`);
    try {
      unlinkSync(tmpFile);
    } catch (e) {}

    res.json({ success: true });
  } catch (err) {
    console.error("❌ pickUpPrint error:", err);
    res.status(500).json({ success: false, message: "Printer error" });
  }
});

app.post("/print", async (req, res) => {
  try {
    const { queueNumber, transactionCode, transactionArray } = req.body;

    if (!queueNumber || !transactionCode || !transactionArray) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // Build ticket header up to the 'Queue No:' label. We'll print the queue number enlarged
    const header =
      `================================\n` +
      `  Jesus Good Shepherd School\n` +
      `      Transaction Slip\n` +
      `--------- iQueue Ticket --------\n` +
      `Date:${new Date().toLocaleDateString()} Time:${new Date().toLocaleTimeString()}\n` +
      `     \n `; // queueNumber will be printed enlarged

    const afterQueue =
      `\n--------------------------------\n` + `Transaction(s):\n`;

    // Build transaction lines
    let txLines = "";
    for (let i = 0; i < transactionArray.length; i++) {
      const t = transactionArray[i];
      txLines += `${i + 1}. ${t.transactionDetails || ""} x${t.copies}\n`;
      if (t.fee && t.fee > 0) {
        const totalFee = t.fee * t.copies;
        txLines += `  Fee: Php ${totalFee.toFixed(2)}\n`; // Added .toFixed(2) for currency formatting
      }
    }

    const footer =
      `--------------------------------\n` +
      ` T-Code: ${transactionCode}\n` +
      `--------------------------------\n` +
      `   Thank you for using iQueue!\n` +
      `================================`;

    // Build QR payload JSON as requested: {"Code":"..."}
    const qrPayload = JSON.stringify({ Code: transactionCode });
    console.log("QR Code for ticket (console):");
    qrcode.generate(qrPayload, { small: true });

    // ESC/POS: set double width & height for the queue number using GS ! n (0x1D 0x21 n)
    const GS_SIZE_2X = Buffer.from([0x1d, 0x21, 0x11]); // 2x width & 2x height
    const GS_SIZE_NORMAL = Buffer.from([0x1d, 0x21, 0x00]); // reset
    // ESC/POS alignment: ESC a n  (0 left, 1 center, 2 right)
    const ESC_ALIGN_CENTER = Buffer.from([0x1b, 0x61, 0x01]);
    const ESC_ALIGN_LEFT = Buffer.from([0x1b, 0x61, 0x00]);

    const beforeBuf = Buffer.from(header, "utf8");
    const queueBuf = Buffer.from(`${queueNumber}\n`, "utf8");
    const qrBuf = buildEscposQRCode(qrPayload, 6, 0x30); // size=6, error level L
    const afterBuf = Buffer.from(afterQueue + txLines + footer + "\n", "utf8");

    // Center the QR block using ESC a 1, then reset alignment to left
    const LF = Buffer.from([0x0a]);
    const finalBuf = Buffer.concat([
      beforeBuf,
      // Center and print the enlarged queue number
      ESC_ALIGN_CENTER,
      GS_SIZE_2X,
      queueBuf,
      GS_SIZE_NORMAL,
      LF,
      ESC_ALIGN_CENTER,
      qrBuf,
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
