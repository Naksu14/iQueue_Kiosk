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

    try {
      //console.log("Submitting transactions:", transactions);

      // Send transactions to backend
      const res = await createUserTransaction(transactions);

      //  Get queueNumberId from backend or localStorage (fallback)
      const queueNumberId =
        res?.queueNumberId || localStorage.getItem("queueNumberId");

      if (!queueNumberId) {
        console.warn(" queueNumberId missing! Saving fallback...");
      }

      // Save again just to be sure (prevents null issues later)
      localStorage.setItem("queueNumberId", queueNumberId);

      console.log(" Transactions created successfully:", res);
      // 🔽 Print locally via Raspberry Pi
      const queueNumber = localStorage.getItem("queueNumber") || "0000";
      const officeName = queueNumberId?.office || "office ";

      // 🔽 Call printer server (configurable via REACT_APP_PRINTER_SERVER)
      const response = await fetch(`${PRINTER_SERVER}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueNumber, officeName }),
      });

      if (!response.ok) {
        // This block catches non-2xx HTTP responses (e.g., 500, 400) from the server.
        const text = await response.text();
        console.error("Print server responded with error:", text);
        throw new Error("Printing failed"); // ⬅️ This triggers the "error" status.
      }

      // Simulate ticket printing delay
      setTimeout(() => {
        setPrintStatus("success");

        setTimeout(() => {
          //  Backup before clearing localStorage
          const safeQueueId = queueNumberId;
          //console.log("Safe Queue ID before clear:", safeQueueId);

          clearTransactions();
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
              //console.log(" Queue status updated successfully!");
            } catch (error) {
              console.error("❌ Failed to update queue status:", error);
            }
          }, 20 * 1000);
        }, 5000);
      }, 3000);
    } catch (err) {
      console.error("❌ Failed to create transactions:", err);
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
