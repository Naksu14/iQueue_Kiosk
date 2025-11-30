import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactionByCode } from "../services/dbServices/createTransactionService";
import {
  createQueueNumber,
  updateQueueNoStatus,
  getCountWaiting,
  getAverageServiceTime,
} from "../services/dbServices/addQueueNumber";
import { useTransaction } from "../context/walkinTransactionContext";

export const useNewOnlineScanningHooks = () => {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);

  const [code, setCode] = useState("");
  const [scanStatus, setScanStatus] = useState("idle");
  const [transactionReqDetails, setTransactionReqDetails] = useState(null);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [printStatus, setPrintStatus] = useState("idle");
  const isPrinting = printStatus === "waiting" || printStatus === "printing";
  // transaction context (used as fallback when printing)
  const { transactions, clearTransactions } = useTransaction();

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

  const handleDisplayQueueInMobile = async () => {
    // Prevent duplicate printing while a print is already in progress
    if (isDisplaying) {
      console.warn("Print ignored: already printing.");
      return;
    }
    setIsDisplaying(true);

    if (!transactionReqDetails) {
      setIsDisplaying(false);
      return;
    }

    // Decide which office should receive the queue number.
    // If all transactions are Inquiry -> route to their specific office(s).
    // If any transaction requires payment/pending -> route to Accounting.
    const txObjects = transactionReqDetails.transactionObjects || [];
    const uniqueOfficeNames = [
      ...new Set(
        txObjects.map(
          (t) =>
            (t.office && t.office.office_name) ||
            transactionReqDetails.officeName
        )
      ).values(),
    ].filter(Boolean);

    const allInquiry =
      txObjects.length > 0 &&
      txObjects.every((t) => t.transactionType === "Inquiry");

    let officeInvolved = [...uniqueOfficeNames];
    let mainOffice;

    if (allInquiry) {
      mainOffice =
        officeInvolved.length > 1
          ? "Multiple"
          : officeInvolved[0] || transactionReqDetails.officeName;
    } else {
      const accountingName = "Accounting Office";
      const others = uniqueOfficeNames.filter((n) => n !== accountingName);
      officeInvolved = [accountingName, ...others];
      officeInvolved = Array.from(new Set(officeInvolved));
      mainOffice = accountingName;
    }

    const queuePayload = {
      office: mainOffice,
      officeInvolved,
      personalInfoId: transactionReqDetails.id,
      queueType: "Online",
      pickUp: false,
    };
    try {
      const queueNumberId = await createQueueNumber(queuePayload);
      localStorage.setItem("queueNumberId", queueNumberId.id);
      localStorage.setItem("queueNumber", queueNumberId.queueNumber);
    } catch (error) {
      console.error(" Error creating queue number:", error);
      // allow future prints and abort if we couldn't create a queue number
      setIsDisplaying(false);
      return;
    }

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
      setTimeout(() => setIsDisplaying(false), 1000);
    }
  };

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

      const transactionData = await getTransactionByCode(scannedCode);
      const transactions = transactionData.transactions;
      if (!transactions || transactions.length === 0) {
        console.warn("No transactions found for scanned code:", scannedCode);
        setScanStatus("error");
        return;
      }

      const filteredTransactions = transactions.filter((transaction) => {
        const online = transaction.personalInfo.type;
        if (online === "walkin") return false;
        const paymentStatus = transaction.paymentStatus;
        const status = transaction.status;
        if (paymentStatus !== "Unpaid" && status === "pending") return false;
        if (status !== "pending") return false;
        return true;
      });

      if (filteredTransactions.length === 0) {
        console.warn(
          "No transactions found with stepNumber 1 for scanned code:",
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
        // include the full filtered transactions so downstream logic can
        // decide routing (Accounting vs specific office)
        transactionObjects: filteredTransactions,
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

  const handleManualCodeSubmit = async () => {
    if (!code) return;
    setScanStatus("waiting");
    try {
      const transactionData = await getTransactionByCode(code);
      console.log("Transaction data retrieved:", transactionData);
      const transactions = transactionData.transactions;

      if (!transactions || transactions.length === 0)
        throw new Error("No transactions found");

      // Filter transactions that have stepNumber === 3
      const filteredTransactions = transactions.filter((transaction) => {
        const online = transaction.personalInfo.type;
        if (online === "walkin") return false;
        const paymentStatus = transaction.paymentStatus;
        const status = transaction.status;
        if (paymentStatus !== "Unpaid" && status === "pending") return false;
        if (status !== "pending") return false;
        return true;
      });

      // If no transaction has stepNumber 1, stop and show error
      if (filteredTransactions.length === 0) {
        console.warn("⚠️ No transactions found with stepNumber 1");
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
        transactionObjects: filteredTransactions,
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
        try {
          // Decide which office we should get metrics for.
          // If all transactions are Inquiry -> use the transaction's office.
          // Otherwise the queue will go to Accounting, so use Accounting for wait count.
          const txObjects = transactionReqDetails.transactionObjects || [];
          const allInquiry =
            txObjects.length > 0 &&
            txObjects.every((t) => t.transactionType === "Inquiry");

          const accountingName = "Accounting Office";
          const metricsOfficeName = allInquiry
            ? transactionReqDetails.officeName
            : accountingName;

          const countWaiting = await getCountWaiting(metricsOfficeName);

          // Try to resolve an officeId appropriate for the selected metrics office.
          let metricsOfficeId = null;
          if (allInquiry) {
            metricsOfficeId = transactionReqDetails.officeId;
          } else {
            // try to find an accounting office id from transaction objects
            const acctTx = txObjects.find(
              (t) => t.office && t.office.office_name === accountingName
            );
            metricsOfficeId = acctTx
              ? acctTx.office.office_id
              : transactionReqDetails.officeId;
          }

          const avgServiceTime = await getAverageServiceTime(metricsOfficeId);
          const estimatedWait = countWaiting * (avgServiceTime || 0);

          setTransactionReqDetails((prev) => ({
            ...prev,
            countWaiting,
            estimatedWait,
          }));
        } catch (err) {
          console.error("Failed to fetch queue metrics:", err);
        }
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

  const handlePrint = async () => {
    // Prefer scanned transaction objects when available, otherwise use global transactions
    const txToPrint =
      transactionReqDetails &&
      transactionReqDetails.transactionObjects &&
      transactionReqDetails.transactionObjects.length > 0
        ? transactionReqDetails.transactionObjects
        : transactions;

    if (!txToPrint || txToPrint.length === 0) {
      console.warn(" No transactions to print.");
      return;
    }

    setPrintStatus("waiting");

    // Check printer paper status before attempting to print
    try {
      const statusRes = await fetch(`${PRINTER_SERVER}/printerStatus`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (
          statusJson &&
          statusJson.ok === true &&
          statusJson.hasPaper === false
        ) {
          // No paper: set UI state and abort printing
          setPrintStatus("no-paper");
          return;
        }
      }
    } catch (e) {
      // If status check fails, fall through and attempt to print (or you may choose to abort)
      console.warn("Printer status check failed, proceeding to print:", e);
    }

    try {
      const queueNumberId = localStorage.getItem("queueNumberId");

      // Save again just to be sure (prevents null issues later)
      localStorage.setItem("queueNumberId", queueNumberId);

      // Print locally via Raspberry Pi
      const transactionCode = localStorage.getItem("transactionCode");
      const queueNumber = localStorage.getItem("queueNumber");

      const payload = {
        queueNumber,
        transactionCode,
        txToPrint,
      };

      const response = await fetch(`${PRINTER_SERVER}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // This block catches non-2xx HTTP responses (e.g., 500, 400) from the server.
        const text = await response.text();
        console.error("Print server responded with error:", text);
        setPrintStatus("error");
        throw new Error("Printing failed"); // ⬅ This triggers the "error" status.
      }

      // Simulate ticket printing delay
      setTimeout(() => {
        setPrintStatus("success");

        setTimeout(() => {
          //  Backup before clearing localStorage
          const safeQueueId = queueNumberId;
          //console.log("Safe Queue ID before clear:", safeQueueId);

          // Clear transactions from context if we used them
          try {
            clearTransactions();
          } catch (e) {}
          localStorage.clear(); // reset only after saving ID

          navigate("/");

          //  Schedule automatic status update after 20 seconds
          setTimeout(async () => {
            if (!safeQueueId) {
              console.warn(" No valid queue ID found for status update!");
              return;
            }

            //console.log(" Updating queue status → waiting:", safeQueueId);
            try {
              await updateQueueNoStatus(safeQueueId, "waiting");
            } catch (error) {
              console.error(" Failed to update queue status:", error);
            }
          }, 30000); // 30 seconds delay
        }, 5000); // Wait before navigating home
      }, 3000); // Simulated delay for printing
    } catch (err) {
      console.error(" Failed to create transactions:", err);
      setPrintStatus("error");
    }
  };

  const handleTryAgainPrint = () => setPrintStatus("idle");
  return {
    navigate,
    scanStatus,
    setScanStatus,
    transactionReqDetails,
    triggerScan,
    handleDisplayQueueInMobile,
    isDisplaying,
    code,
    setCode,
    isValidTransactionCode,
    handleManualCodeSubmit,
    handleTryAgain,
    showInput,
    setShowInput,
    // Printing helpers used by scanning pages
    handlePrint,
    isPrinting,
    handleTryAgainPrint,
    printStatus,
  };
};
