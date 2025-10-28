import express from "express";
import bodyParser from "body-parser";
import ThermalPrinter from "node-thermal-printer";

const app = express();
app.use(bodyParser.json());

let printer = new ThermalPrinter.printer({
  type: ThermalPrinter.types.EPSON,
  interface: "/dev/ttyUSB0",
  options: { timeout: 5000 },
});

app.post("/print", async (req, res) => {
  const { queueNumber, officeName } = req.body;

  try {
    printer.alignCenter();
    printer.println("==== iQueue Ticket ====");
    printer.println(`Office: ${officeName}`);
    printer.println(`Queue No: ${queueNumber}`);
    printer.drawLine();
    printer.println("Please wait to be called.");
    printer.cut();

    await printer.execute();
    console.log("✅ Printed successfully");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Print error:", err);
    res.status(500).json({ success: false });
  }
});

app.listen(4000, () => console.log("🖨️ Printer server running on port 4000"));
