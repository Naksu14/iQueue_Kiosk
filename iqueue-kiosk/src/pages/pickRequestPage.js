import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import Button from "../components/button/button";
import IconContainer from "../components/layout/iconContainer";
import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useKeyboard } from "../context/KeyboardContext";
import { getTransactionByCode } from "../services/dbServices/createTransactionService";
import {
  createQueueNumber,
  updateQueueNoStatus,
  getCountWaiting,
  getAverageServiceTime,
} from "../services/dbServices/addQueueNumber";

const PickRequestPage = () => {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();

  const [code, setCode] = useState("");
  const [scanStatus, setScanStatus] = useState("idle");
  const [transactionReqDetails, setTransactionReqDetails] = useState(null);

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
    // ... (This function remains unchanged as requested)
    if (!transactionReqDetails) return;
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
      throw new Error("Printing failed");
    }
    try {
      setTimeout(() => {
        setTimeout(() => {
          const queueNumberId = localStorage.getItem("queueNumberId");

          navigate("/");

          setTimeout(async () => {
            if (!queueNumberId) {
              console.warn(" No valid queue ID found for status update!");
              return;
            }
            try {
              await updateQueueNoStatus(queueNumberId, "waiting");
              console.log(" Queue status updated successfully!");
            } catch (error) {
              console.error(" Failed to update queue status:", error);
            }
          }, 30000); // 30 seconds delay
        }, 5000); // Wait before navigating home
      }, 3000); // Simulated delay for printing
    } catch (error) {
      console.error("Error creating queue number:", error);
      setScanStatus("error");
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
      console.log(
        "Scanned code from Pi (raw):",
        raw,
        "=> parsed:",
        scannedCode
      );

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

  // --- SUCCESS STATE ---
  if (scanStatus === "success" && transactionReqDetails) {
    // ... (Success state UI remains unchanged)
    const detailsList = Array.isArray(transactionReqDetails)
      ? transactionReqDetails
      : [transactionReqDetails];
    return (
      <div className="flex flex-col items-center">
        <header className="text-center w-full max-w-md">
          <SubHeader text="Your Pick-up Request" className="font-bold" />
        </header>
        <div className="flex-1 p-6 bg-white shadow-md rounded-lg text-left border border-gray-100 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Pick-up Details
            </h2>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          {detailsList.map((item, idx) => (
            <ul
              key={item.id + "-" + item.transactionCode + "-" + idx}
              className="space-y-2 text-gray-700 mb-2"
            >
              <li>
                <span className="font-medium text-gray-800">Student Name:</span>{" "}
                <span className="text-gray-600">{item.fullName}</span>
              </li>
              <li>
                <span className="font-medium text-gray-800">Office:</span>{" "}
                <span className="text-gray-600">{item.officeName}</span>
              </li>
              <li className="flex flex-col">
                <span className="font-medium text-gray-800">
                  Pick Up Document:
                </span>
                <span className="text-gray-600">
                  {item.transactionDetailsArr &&
                  item.transactionDetailsArr.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {item.transactionDetailsArr.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  ) : (
                    "No details"
                  )}
                </span>
              </li>
              <li className="border-t pt-3 mt-3 text-gray-600">
                <span className="font-medium text-gray-800">Instructions:</span>{" "}
                Present your valid ID & Student ID
              </li>
              {/* Estimated Wait */}
              {typeof item.estimatedWait === "number" &&
              item.estimatedWait > 0 ? (
                <li className="flex flex-wrap justify-center items-center gap-2">
                  {item.countWaiting > 0 && (
                    <span className="text-gray-500">
                      {item.countWaiting} Queue,
                    </span>
                  )}
                  <span className="font-medium text-gray-800">
                    Estimated Wait:
                  </span>{" "}
                  <span className="text-orange-500 font-semibold">
                    {(() => {
                      const sec = Math.round(item.estimatedWait);
                      if (sec < 60) return ` ${sec}s`;
                      const min = Math.floor(sec / 60);
                      if (min < 60) return ` ${min} min`;
                      const hr = Math.floor(min / 60);
                      const remMin = min % 60;
                      return `${hr} hr${hr > 1 ? "s" : ""}${
                        remMin > 0 ? ` ${remMin} min` : ""
                      }`;
                    })()}
                  </span>
                </li>
              ) : (
                <li className="text-center">
                  <span className="text-gray-400 font-semibold">
                    No Queue Waiting
                  </span>
                </li>
              )}
            </ul>
          ))}
          <Button
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow hover:shadow-md hover:opacity-90 transition duration-200 flex items-center justify-center gap-2"
            onClick={handlePickupPrint}
            disabled={scanStatus === "waiting"}
          >
            {scanStatus === "waiting" ? (
              <>
                <ImSpinner2 className="animate-spin text-2xl text-white" />
                <span>Printing...</span>
              </>
            ) : (
              "Print Ticket"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // --- IDLE / WAITING / ERROR STATE ---
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <header className="mb-6 text-center">
        <SubHeader
          text="Scan QR or Enter Transaction Code"
          className="font-bold"
        />
        <p className="text-gray-600 text-sm mt-1">
          Present your QR code or enter your transaction code <br />
          below if scanning is unavailable.
        </p>
      </header>

      <div className="flex gap-4 w-full justify-center min-h-[14rem] items-center">
        {/** Conditional rendering for the error state, which now also covers manual input errors. **/}
        {scanStatus === "error" && (
          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg border border-red-200">
            <FaTimesCircle className="text-5xl text-red-500 mb-3" />
            <span className="text-red-600 font-normal text-sm text-center mb-3">
              **QR Code not recognized or invalid.**
              <br />
              May have been completed. Please try again.
            </span>
            <Button
              className="w-full h-10 font-semibold mt-1 bg-red-500 hover:bg-red-600"
              onClick={handleTryAgain}
            >
              Try Again
            </Button>
          </div>
        )}

        {/** Only show QR/Input if not in error state and not in success state **/}
        {scanStatus !== "error" && !showInput && (
          <div className="flex flex-col items-center justify-center rounded-lg py-2">
            {scanStatus === "idle" && (
              <Button
                onClick={triggerScan}
                className="p-8 flex items-center justify-center gap-3 rounded-xl
                  bg-gradient-to-r from-green-500 to-emerald-600
                  hover:opacity-90
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 transform active:scale-95"
              >
                <IconContainer className="bg-white p-2 rounded-full shadow-md">
                  <FaQrcode className="text-2xl text-green-600" />
                </IconContainer>
                <span className="text-white font-semibold text-xl tracking-wide">
                  Scan Now
                </span>
              </Button>
            )}

            {scanStatus === "waiting" && (
              <>
                <ImSpinner2 className="animate-spin text-5xl text-gray-400 my-6" />
                <span className="text-gray-600">Waiting for scan...</span>
              </>
            )}
          </div>
        )}

        {scanStatus !== "error" && showInput && (
          <form
            className={`w-64 flex flex-col gap-3 items-center ${
              isVisible ? "-mt-32" : ""
            }`}
            onSubmit={(e) => {
              e.preventDefault();
              handleManualCodeSubmit();
            }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter transaction code"
              className="w-[300px] text-center border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
              onFocus={(e) => {
                showKeyboard(e.target, (event) => setCode(event.target.value));
                setTimeout(() => {
                  e.target.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 100);
              }}
            />
            <Button
              onClick={() => {
                if (!isValidTransactionCode(code)) return;
                hideKeyboard();
                handleManualCodeSubmit();
              }}
              disabled={
                !isValidTransactionCode(code) || scanStatus === "waiting"
              }
              className={`w-full h-12 mt-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-lg font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all ${
                !isValidTransactionCode(code) || scanStatus === "waiting"
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            >
              Submit Code
            </Button>
          </form>
        )}
      </div>

      <div>
        {/* Only show "Enter transaction code manually" if in IDLE state and not showing error */}
        {!showInput && scanStatus === "idle" && (
          <button
            className="text-gray-500 underline underline-offset-1 hover:text-blue-600 transition duration-150"
            onClick={() => {
              setShowInput(true);
              setScanStatus("idle");
            }}
          >
            Enter transaction code manually
          </button>
        )}
        {/* Only show "Back to QR scan" if showing input field and not in error/waiting/success */}
        {showInput && scanStatus === "idle" && (
          <button
            className="text-gray-500 underline underline-offset-1 hover:text-blue-600 transition duration-150"
            onClick={() => {
              setShowInput(false);
              setCode("");
            }}
          >
            Back to QR scan
          </button>
        )}
      </div>

      {scanStatus !== "waiting" && scanStatus !== "success" && (
        <div className="mt-8">
          <BackButton onClick={() => navigate(-1)} />
        </div>
      )}
    </div>
  );
};

export default PickRequestPage;
