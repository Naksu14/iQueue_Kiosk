import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactionByCode } from "../services/dbServices/createTransactionService";
import {
  createQueueNumber,
  updateQueueNoStatus,
  getCountWaiting,
  getAverageServiceTime,
} from "../services/dbServices/addQueueNumber";

export const usePickupHooks = () => {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);

  const [code, setCode] = useState("");
  const [scanStatus, setScanStatus] = useState("idle");
  const [transactionReqDetails, setTransactionReqDetails] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const PRINTER_SERVER =
    process.env.REACT_APP_PRINTER_SERVER || "http://localhost:4000";

  // Scanner server (node process on the Pi that reads the USB scanner stdin)
  const SCANNER_SERVER =
    process.env.REACT_APP_SCANNER_SERVER || "http://localhost:4001";

  // Helper: parse the raw scanned payload. Many QR scanners output plain text,
  // but some systems embed JSON like '{"Code":"ABC-123"}'. This helper will
  // attempt to normalize those formats and return the extracted code string.
  const parseScannedCode = (raw) => {
    if (!raw) return "";
    let s = String(raw).trim();

    // Remove surrounding quotes if the scanner appended them
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1).trim();
    }

    // Try JSON parse if it looks like JSON
    if (
      (s.startsWith("{") && s.endsWith("}")) ||
      (s.startsWith("[") && s.endsWith("]"))
    ) {
      try {
        const obj = JSON.parse(s);
        // Common keys that might carry the code
        const candidates = [
          obj.Code,
          obj.code,
          obj.transactionCode,
          obj.transaction_code,
          obj.qr,
          obj.value,
        ];
        for (const c of candidates) {
          if (typeof c === "string" && c.trim()) return c.trim();
        }
        // If top-level object has only one string value, return it
        const vals = Object.values(obj).filter(
          (v) => typeof v === "string" && v.trim()
        );
        if (vals.length === 1) return vals[0].trim();
      } catch (err) {
        // fallthrough to return raw string
        console.warn("Unable to JSON-parse scanned payload:", err.message);
      }
    }

    // Otherwise return the trimmed raw string
    return s;
  };

  const handlePickupPrint = async () => {
    // Prevent duplicate printing while a print is already in progress
    if (isPrinting) {
      console.warn("Print ignored: already printing.");
      return;
    }
    setIsPrinting(true);

    if (!transactionReqDetails) {
      setIsPrinting(false);
      return;
    }

    // Check printer status before printing pickup slip
    try {
      const statusRes = await fetch(`${PRINTER_SERVER}/printerStatus`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (
          statusJson &&
          statusJson.ok === true &&
          statusJson.hasPaper === false
        ) {
          console.warn("Printer reports no paper — aborting pickup print.");
          setIsPrinting(false);
          // Optionally set a user-visible error state; here we set scanStatus to reflect the failure
          setScanStatus("printer-no-paper");
          return;
        }
      }
    } catch (err) {
      console.warn("Printer status check failed, proceeding to print:", err);
    }
    const queuePayload = {
      office: transactionReqDetails.officeName,
      officeInvolved: [transactionReqDetails.officeName],
      personalInfoId: transactionReqDetails.id,
      queueType: "Walk-in",
      pickUp: true,
    };
    try {
      const queueNumberId = await createQueueNumber(queuePayload);
      localStorage.setItem("queueNumberId", queueNumberId.id);
      localStorage.setItem("queueNumber", queueNumberId.queueNumber);
    } catch (error) {
      console.error(" Error creating queue number:", error);
      // allow future prints and abort if we couldn't create a queue number
      setIsPrinting(false);
      return;
    }

    const queueNumber = localStorage.getItem("queueNumber");

    const printPayload = {
      officeName: transactionReqDetails.officeName,
      transactionDetails: Array.isArray(
        transactionReqDetails.transactionDetailsArr
      )
        ? transactionReqDetails.transactionDetailsArr.join("; ")
        : transactionReqDetails.transactionDetailsArr || "",
      transactionCode: transactionReqDetails.transactionCode,
      queueNumber: queueNumber,
    };

    const response = await fetch(`${PRINTER_SERVER}/pickUpPrint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(printPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Print server responded with error:", text);
      // allow future prints
      setIsPrinting(false);
      throw new Error("Printing failed");
    }
    // Keep isPrinting=true until we navigate away (prevents duplicate clicks/spam).
    // We await the simulated delays so the UI can't trigger another print immediately.
    try {
      // wait simulated print delay
      await new Promise((res) => setTimeout(res, 1003));

      const queueNumberId = localStorage.getItem("queueNumberId");

      // additional delay before navigation
      await new Promise((res) => setTimeout(res, 3000));

      navigate("/");

      // schedule background status update after 30s (do not block user)
      setTimeout(async () => {
        if (!queueNumberId) {
          console.warn(" No valid queue ID found for status update!");
          return;
        }
        try {
          await updateQueueNoStatus(queueNumberId, "waiting");
        } catch (error) {
          console.error(" Failed to update queue status:", error);
        }
      }, 30000);
    } catch (error) {
      console.error("Error during post-print flow:", error);
      setScanStatus("error");
    } finally {
      // small cooldown to prevent accidental re-clicks after navigation
      setTimeout(() => setIsPrinting(false), 1000);
    }
  };

  // const handleScan = async () => {
  //   // ... (This function remains unchanged)
  //   if (scanStatus !== "idle") return;
  //   setScanStatus("waiting");

  //   try {
  //     const transactionData = await getTransactionByCode("demo"); // Replace with actual scanned code
  //     const transactions = transactionData.transactions;

  //     if (!transactions || transactions.length === 0) {
  //       setScanStatus("error");
  //       setTransactionReqDetails(null);
  //       return;
  //     }

  //     // Use the first one only for personal info & office
  //     const first = transactions[0];

  //     const detailsObj = {
  //       id: first.personalInfo.id,
  //       transactionCode: first.personalInfo.transactionCode,
  //       fullName:
  //         first.personalInfo.fullName ||
  //         `${first.personalInfo.firstName} ${first.personalInfo.lastName}`,
  //       officeId: first.office.office_id,
  //       officeName: first.office.office_name,
  //       // Get all transaction details
  //       transactionDetailsArr: transactions.map((t) => t.transactionDetails),
  //     };

  //     console.log("✅ Combined transaction details:", detailsObj);
  //     setTransactionReqDetails(detailsObj);
  //     setScanStatus("success");
  //   } catch (error) {
  //     console.error("❌ Error during scan:", error);
  //     setScanStatus("error");
  //   }
  // };

  // Trigger a hardware scan via the Pi scanner server.
  // POST /api/trigger-scan will wait until the next barcode is read and return it.
  const triggerScan = async () => {
    if (scanStatus !== "idle") return;
    setScanStatus("waiting");

    try {
      // Enforce a 10s client-side timeout to match server behavior and UI expectations
      const controller = new AbortController();
      const timeoutMs = 10000; // 10 seconds
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${SCANNER_SERVER}/api/trigger-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("Scanner server error:", res.status, body);
        // fallback: enable local capture (browser input) if server unavailable
        console.warn("Falling back to local input capture");
        setCaptureMode(true);
        setScanStatus("waiting");
        return;
      }

      const data = await res.json();
      if (!data || !data.qrCode) {
        console.error("Invalid scanner response:", data);
        setScanStatus("error");
        return;
      }

      const raw = data.qrCode || data.code || data.value || "";
      const scannedCode = parseScannedCode(raw);
      // console.log(
      //   "Scanned code from Pi (raw):",
      //   raw,
      //   "=> parsed:",
      //   scannedCode
      // );

      // Reuse existing flow: fetch transaction by code and populate UI
      const transactionData = await getTransactionByCode(scannedCode);
      const transactions = transactionData.transactions;
      if (!transactions || transactions.length === 0) {
        console.warn("No transactions found for scanned code:", scannedCode);
        setScanStatus("error");
        return;
      }

      // Filter transactions that have last step stepNumber === 3 (same validation as manual submit)
      const filteredTransactions = transactions.filter((transaction) => {
        const walkin = transaction.personalInfo.type;
        if (walkin === "online") return false;
        const steps = transaction.steps;
        if (!steps || steps.length === 0) return false;
        const lastStep = steps[steps.length - 1];
        return lastStep.stepNumber === 3;
      });

      if (filteredTransactions.length === 0) {
        console.warn(
          "No transactions found with stepNumber 3 for scanned code:",
          scannedCode
        );
        setScanStatus("error");
        return;
      }

      const first = filteredTransactions[0];

      const detailsObj = {
        id: first.personalInfo.id,
        transactionCode: first.personalInfo.transactionCode,
        fullName:
          first.personalInfo.fullName ||
          `${first.personalInfo.firstName} ${first.personalInfo.lastName}`,
        officeId: first.office.office_id,
        officeName: first.office.office_name,
        transactionDetailsArr: filteredTransactions.map(
          (t) => t.transactionDetails
        ),
      };

      setTransactionReqDetails(detailsObj);
      setScanStatus("success");
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Trigger-scan timed out after 30s");
        // stop waiting and show error; enable local capture fallback if desired
        setCaptureMode(true);
        setScanStatus("error");
        return;
      }
      console.error("Failed to trigger scan or process result:", err);
      // fallback to local input capture
      console.warn(
        "Trigger-scan failed, falling back to local input capture:",
        err.message || err
      );
      setCaptureMode(true);
      setScanStatus("waiting");
    }
  };

  // Local capture fallback: when scanner acts as keyboard (HID), capture typed input
  const captureRef = useRef(null);
  const [captureMode, setCaptureMode] = useState(false);

  useEffect(() => {
    if (captureMode && captureRef.current) {
      captureRef.current.focus();
    }
  }, [captureMode]);

  // const handleScannedCode = async (raw) => {
  //   const scannedCode = parseScannedCode(raw);
  //   if (!scannedCode) {
  //     setScanStatus("error");
  //     return;
  //   }
  //   try {
  //     const transactionData = await getTransactionByCode(scannedCode);
  //     const transactions = transactionData.transactions;
  //     if (!transactions || transactions.length === 0) {
  //       console.warn("No transactions found for scanned code:", scannedCode);
  //       setScanStatus("error");
  //       setCaptureMode(false);
  //       return;
  //     }

  //     const first = transactions[0];
  //     const detailsObj = {
  //       id: first.personalInfo.id,
  //       transactionCode: first.personalInfo.transactionCode,
  //       fullName:
  //         first.personalInfo.fullName ||
  //         `${first.personalInfo.firstName} ${first.personalInfo.lastName}`,
  //       officeId: first.office.office_id,
  //       officeName: first.office.office_name,
  //       transactionDetailsArr: transactions.map((t) => t.transactionDetails),
  //     };
  //     setTransactionReqDetails(detailsObj);
  //     setScanStatus("success");
  //     setCaptureMode(false);
  //   } catch (err) {
  //     console.error("Error processing scanned code:", err);
  //     setScanStatus("error");
  //     setCaptureMode(false);
  //   }
  // };

  const handleManualCodeSubmit = async () => {
    if (!code) return;
    setScanStatus("waiting");
    try {
      const transactionData = await getTransactionByCode(code);
      const transactions = transactionData.transactions;

      if (!transactions || transactions.length === 0)
        throw new Error("No transactions found");

      // Filter transactions that have stepNumber === 3
      const filteredTransactions = transactions.filter((transaction) => {
        const walkin = transaction.personalInfo.type;
        if (walkin === "online") return false;
        const steps = transaction.steps;
        if (!steps || steps.length === 0) return false; // no steps
        const lastStep = steps[steps.length - 1]; // get the last step
        return lastStep.stepNumber === 3;
      });

      // If no transaction has stepNumber 3, stop and show error
      if (filteredTransactions.length === 0) {
        console.warn("⚠️ No transactions found with stepNumber 3");
        // **Set status to error to trigger the shared error UI**
        setScanStatus("error");
        return;
      }

      // Continue with the filtered data only
      const first = filteredTransactions[0];

      const detailsObj = {
        id: first.personalInfo.id,
        transactionCode: first.personalInfo.transactionCode,
        fullName:
          first.personalInfo.fullName ||
          `${first.personalInfo.firstName} ${first.personalInfo.lastName}`,
        officeId: first.office.office_id,
        officeName: first.office.office_name,
        transactionDetailsArr: filteredTransactions.map(
          (t) => t.transactionDetails
        ),
      };
      setTransactionReqDetails(detailsObj);

      setScanStatus("success");
    } catch (error) {
      // **Set status to error to trigger the shared error UI**
      setScanStatus("error");
    }
  };

  // Validation for manual code input
  const isValidTransactionCode = (str) => {
    if (!str) return false;
    return String(str).trim().length === 17 || String(str).trim().length === 19;
  };

  useEffect(() => {
    // ... (This effect remains unchanged)
    if (scanStatus === "success" && transactionReqDetails) {
      const fetchQueueMetrics = async () => {
        const countWaiting = await getCountWaiting(
          transactionReqDetails.officeName
        );
        const avgServiceTime = await getAverageServiceTime(
          transactionReqDetails.officeId
        );
        const estimatedWait = countWaiting * avgServiceTime;

        setTransactionReqDetails((prev) => ({
          ...prev,
          countWaiting,
          estimatedWait,
        }));
      };
      fetchQueueMetrics();
    }
  }, [scanStatus, transactionReqDetails]);

  const handleTryAgain = () => {
    setScanStatus("idle");
    setTransactionReqDetails(null);
    // Hide the input field if we were previously showing an error
    setShowInput(false);
  };
  return {
    navigate,
    scanStatus,
    setScanStatus,
    transactionReqDetails,
    triggerScan,
    handlePickupPrint,
    isPrinting,
    code,
    setCode,
    isValidTransactionCode,
    handleManualCodeSubmit,
    handleTryAgain,
    showInput,
    setShowInput,
  };
};
