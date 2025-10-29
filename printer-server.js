import express from "express";
import { writeFileSync, unlinkSync } from "fs";
import bodyParser from "body-parser";
import { exec } from "child_process";
import cors from "cors";
import util from "util";
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
// Note: app.use(cors(...)) above already handles CORS globally including preflight.
// Removing app.options("*", ...) because certain versions of path-to-regexp
// can throw when given a bare "*" path (Missing parameter name at index 1).

// Health check endpoint
app.get("/ping", (req, res) => res.json({ ok: true }));

app.post("/print", async (req, res) => {
  try {
    const { queueNumber, officeName } = req.body;

    if (!queueNumber || !officeName) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }
  const message = `
  Jesus Good Shepherd School
      Transaction Slip
========= iQueue Ticket =========
Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}
Office: ${officeName}
Queue No: ${queueNumber}
---------------------------------

`;
// Temporary file for printing
    const tmpFile = "/tmp/ticket.txt";
    writeFileSync(tmpFile, message);

    // Execute print command
    await execAsync(`sudo tee /dev/usb/lp0 < ${tmpFile}`);

    // Cleanup
    unlinkSync(tmpFile);
    console.log(`✅ Printed successfully: Queue ${queueNumber}`);
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