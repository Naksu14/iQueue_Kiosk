import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserTransaction } from "../services/dbServices/createTransactionService";
import { useTransaction } from "../context/walkinTransactionContext";
import { updateQueueNoStatus } from "../services/dbServices/addQueueNumber";
export const useQueueTicket = () => {
  const navigate = useNavigate();
  const [printStatus, setPrintStatus] = useState("idle");
  const { transactions, clearTransactions } = useTransaction();
  // Printer server base URL can be configured at build time via
  // REACT_APP_PRINTER_SERVER (e.g. http://192.168.1.10:4000). ito yung network ip ng raspberry pi
  // Falls back to localhost for development on the same machine.
  const PRINTER_SERVER =
    process.env.REACT_APP_PRINTER_SERVER || "http://localhost:4000";

  const handlePrint = async () => {
    if (!transactions || transactions.length === 0) {
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
      // Attempt printing first; only create DB transaction on success

      // Print locally via Raspberry Pi
      const transactionCode = localStorage.getItem("transactionCode");
      const queueNumber = localStorage.getItem("queueNumber");

      const payload = {
        queueNumber,
        transactionCode,
        // For printing purposes, use the in-memory transactions.
        // We will persist to DB only after a successful print.
        transactionArray: transactions,
      };

      // const response = await fetch(`${PRINTER_SERVER}/print`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      // if (!response.ok) {
      //   // This block catches non-2xx HTTP responses (e.g., 500, 400) from the server.
      //   const text = await response.text();
      //   console.error("Print server responded with error:", text);
      //   setPrintStatus("error");
      //   throw new Error("Printing failed"); // ⬅ This triggers the "error" status.
      // }

      // Simulate ticket printing delay
      setTimeout(() => {
        setPrintStatus("success");

        setTimeout(() => {
          (async () => {
            // Persist transactions only after a successful print
            try {
              const transactionArray = await createUserTransaction(
                transactions
              );

              const queueNumberId =
                transactionArray?.queueNumberId ||
                localStorage.getItem("queueNumberId");

              if (queueNumberId) {
                localStorage.setItem("queueNumberId", queueNumberId);
              }

              // Backup before clearing localStorage
              const safeQueueId = queueNumberId;

              clearTransactions();
              localStorage.clear();

              navigate("/");

              // Schedule automatic status update after 30 seconds
              setTimeout(async () => {
                if (!safeQueueId) {
                  console.warn(" No valid queue ID found for status update!");
                  return;
                }
                try {
                  await updateQueueNoStatus(safeQueueId, "waiting");
                } catch (error) {
                  console.error(" Failed to update queue status:", error);
                }
              }, 30000);
            } catch (err) {
              // If DB persistence fails after a successful print, keep UI success
              console.error(" Failed to create transactions post-print:", err);
            }
          })();
        }, 5000); // Wait before navigating home
      }, 3000); // Simulated delay for printing
    } catch (err) {
      console.error(" Printing failed:", err);
      setPrintStatus("error");
    }
  };

  const handleTryAgain = () => setPrintStatus("idle");

  return {
    printStatus,
    handlePrint,
    handleTryAgain,
  };
};
