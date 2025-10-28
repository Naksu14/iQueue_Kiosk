import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";

const app = express();
app.use(bodyParser.json());

app.post("/print", (req, res) => {
  const { queueNumber, officeName } = req.body;

  const message = `
==== iQueue Ticket ====
Office: ${officeName}
Queue No: ${queueNumber}
-----------------------
Please wait to be called.

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

app.listen(4000, () => console.log("🖨️ Printer server running on port 4000"));
