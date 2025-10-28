import express from "express";
import bodyParser from "body-parser";
import { writeFileSync, unlinkSync } from "fs";
import { exec } from "child_process";
import cors from "cors";

const app = express();

// ✅ CORS configuration
const corsOptions = {
  origin: "http://localhost:3000", // React app origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
  optionsSuccessStatus: 204 // for legacy browsers
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Parse JSON requests
app.use(bodyParser.json());

// Handle OPTIONS preflight requests explicitly
app.options("*", cors(corsOptions));

// Print endpoint
app.post("/print", (req, res) => {
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

  // Use a temporary file for reliable printing
  const tmpFile = "/tmp/ticket.txt";
  writeFileSync(tmpFile, message);

  exec(`sudo tee /dev/usb/lp0 < ${tmpFile}`, (err, stdout, stderr) => {
    unlinkSync(tmpFile); // cleanup

    if (err) {
      console.error("❌ Print error:", err);
      return res.status(500).json({ success: false, message: "Printer error" });
    }

    console.log(`✅ Printed successfully: Queue ${queueNumber}`);
    res.json({ success: true });
  });
});

// Start server
app.listen(4000, () => console.log("🖨️ Printer server running on port 4000"));
