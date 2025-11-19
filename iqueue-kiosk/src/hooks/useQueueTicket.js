import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserTransaction } from "../services/dbServices/createTransactionService";
import { useTransaction } from "../context/walkinTransactionContext";
import { updateQueueNoStatus } from "../services/dbServices/addQueueNumber";
import { getOfficeById } from "../services/dbServices/officeKioskService";
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
      const transactionArray = await createUserTransaction(transactions);
      // console.log(" Transactions created:", res);

      //  Get queueNumberId from backend or localStorage (fallback)
      const queueNumberId =
        transactionArray?.queueNumberId ||
        localStorage.getItem("queueNumberId");

      // Save again just to be sure (prevents null issues later)
      localStorage.setItem("queueNumberId", queueNumberId);

      // Print locally via Raspberry Pi
      const transactionCode = localStorage.getItem("transactionCode");
      const queueNumber = localStorage.getItem("queueNumber");
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();

      // Assuming `res` contains an array of transactions  ============================================== Console log ticket details
      console.log("\n===============================================");
      console.log("           Jesus Good Shepherd School");
      console.log("              Transaction Slip");
      console.log("------------------------------------------------");
      console.log(`Date: ${date}             Time: ${time}`);
      console.log("");
      console.log(`               Queue No: ${queueNumber}`);
      console.log("------------------------------------------------");
      console.log("Transaction:");

      if (Array.isArray(transactionArray) && transactionArray.length > 0) {
        for (let i = 0; i < transactionArray.length; i++) {
          const t = transactionArray[i];
          const office = await getOfficeById(t.office.office_id);
          console.log(`${office.office_name}`);
          console.log(`   ${t.transactionDetails}`);
          if (t.fee) console.log(`   Fee: Php ${t.fee * t.copies}`);
          console.log(""); // spacing between transactions
        }
      }

      console.log("------------------------------------------------");
      console.log(`Transaction Code: ${transactionCode}`);
      console.log("------------------------------------------------");
      console.log("      Thank you for using iQueue!");
      console.log("===============================================\n");

      const payload = {
        queueNumber,
        transactionCode,
        transactionArray,
      };

      //  Call printer server (configurable via REACT_APP_PRINTER_SERVER) ============================================== actual print call
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
              console.log(" Queue status updated successfully!");
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

  const handleTryAgain = () => setPrintStatus("idle");

  return {
    printStatus,
    handlePrint,
    handleTryAgain,
  };
};
