import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserTransaction } from "../services/dbServices/createTransactionService";
import { useTransaction } from "../context/walkinTransactionContext";
import { updateQueueNoStatus } from "../services/dbServices/addQueueNumber";

export const useQueueTicket = () => {
  const navigate = useNavigate();
  const [printStatus, setPrintStatus] = useState("idle");
  const { transactions, clearTransactions } = useTransaction();

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
      //console.log(" Transactions created successfully:", res);

      //  Get queueNumberId from backend or localStorage (fallback)
      const queueNumberId =
        res?.queueNumberId || localStorage.getItem("queueNumberId");

      if (!queueNumberId) {
        console.warn(" queueNumberId missing! Saving fallback...");
      }

      // Save again just to be sure (prevents null issues later)
      localStorage.setItem("queueNumberId", queueNumberId);

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
