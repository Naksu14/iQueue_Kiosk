import express from "express";
import bodyParser from "body-parser";
import { writeFileSync, unlinkSync } from "fs";
import { exec } from "child_process";
import cors from "cors";
import util from "util";

const app = express();
const execAsync = util.promisify(exec); // Allows async/await usage

// CORS configuration
const corsOptions = {
  origin: "http://localhost:3000", // React app origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
  optionsSuccessStatus: 204, // for legacy browsers
};

// Apply CORS middleware globally
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.options("*", cors(corsOptions)); // handle preflight

// Health check endpoint
app.get("/ping", (req, res) => res.json({ ok: true }));

// Print endpoint
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
app.listen(PORT, () => console.log(` Printer server running on port ${PORT}`));
