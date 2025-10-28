import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";

const app = express();
<<<<<<< HEAD
=======
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
>>>>>>> c478d949cd7d1f94c8af9bf6bfd731a3d23ef12e
app.use(bodyParser.json());

app.post("/print", (req, res) => {
  const { queueNumber, officeName } = req.body;

  const message = `
  Jesus Good Shepherd School
      Transaction Slip
========= iQueue Ticket =========
Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}
Office: ${officeName}
Queue No: ${queueNumber}
---------------------------------

`;

  exec(`echo "${message}" | sudo tee /dev/usb/lp0`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Print error:", err);
      return res.status(500).json({ success: false });
    }
    console.log("✅ Printed successfully");
    res.json({ success: true });
  });
});

<<<<<<< HEAD
app.listen(4000, () => console.log("🖨️ Printer server running on port 4000"));
=======
// Start server
const PORT = 4000;
app.listen(PORT, () => console.log(` Printer server running on port ${PORT}`));
>>>>>>> c478d949cd7d1f94c8af9bf6bfd731a3d23ef12e
