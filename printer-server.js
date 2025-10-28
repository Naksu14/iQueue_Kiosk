import express from "express";
import bodyParser from "body-parser";
import { SerialPort } from "serialport";

const app = express();
app.use(bodyParser.json());

// ✅ adjust baudRate to match your VOZY P50 (usually 9600)
const printer = new SerialPort({ path: "/dev/ttyUSB0", baudRate: 9600 });

// 🖨️ POST /print endpoint — called by your React hook
app.post("/print", async (req, res) => {
  const { queueNumber, officeName } = req.body;

  if (!queueNumber) {
    console.error("Missing queue number");
    return res.status(400).json({ success: false, message: "Missing queue number" });
  }

  // Format printed message
  const message = `
======================
   iQueue Kiosk Ticket
======================
Office: ${officeName || "Registrar"}
Queue No: ${queueNumber}
----------------------
   Please wait to be called.
======================
`;

  try {
    printer.write(message + "\n\n\n", (err) => {
      if (err) {
        console.error("❌ Print error:", err);
        return res.status(500).json({ success: false });
      }
      console.log("✅ Printed ticket:", message);
      res.json({ success: true });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.listen(4000, () => console.log("🖨️ Printer server running on port 4000"));
