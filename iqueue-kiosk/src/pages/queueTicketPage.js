import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTicketAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import SubHeader from "../components/layout/subheader";
import Button from "../components/button/button";
import { createUserTransaction } from "../services/dbServices/createTransactionService";
import { useTransaction } from "../context/walkinTransactionContext";

const QueueTicketPage = () => {
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
      console.log(" Submitting transactions:", transactions);

      //  Send transactions to backend
      const res = await createUserTransaction(transactions);

      console.log(" Transactions created successfully:", res);

      // Simulate ticket printing delay
      setTimeout(() => {
        setPrintStatus("success");

        setTimeout(() => {
          clearTransactions();
          localStorage.clear();
          navigate("/");
        }, 5000);
      }, 3000);
    } catch (err) {
      console.error("❌ Failed to create transactions:", err);
      setPrintStatus("error");
    }
  };

  const handleTryAgain = () => setPrintStatus("idle");

  return (
    <div className="flex flex-col items-center justify-center">
      <header className="mb-1 text-center">
        <div className="flex gap-2 justify-center">
          <div className="text-gray-500 text-3xl">
            <FaTicketAlt />
          </div>
          <SubHeader text="Your Queueing Ticket" className="font-bold" />
        </div>
        <p className="text-gray-600 text-sm">
          Present your ticket in transaction office
        </p>
      </header>

      <div className="flex gap-4 w-full justify-center items-center">
        <div className="flex flex-col items-center justify-center rounded-lg py-2 w-44">
          {printStatus === "idle" && (
            <Button
              className="w-full h-14 flex flex-row items-center justify-center my-6"
              onClick={handlePrint}
            >
              <h2 className="font-semibold text-lg ml-3">Print</h2>
            </Button>
          )}
          {printStatus === "waiting" && (
            <>
              <ImSpinner2 className="animate-spin text-5xl text-gray-400 my-6" />
              <span className="text-gray-600">Printing ticket...</span>
            </>
          )}
          {printStatus === "success" && (
            <>
              <FaCheckCircle className="text-5xl text-green-500 my-6" />
              <span className="text-green-600 font-semibold">
                Printed Successfully!
              </span>
            </>
          )}
          {printStatus === "error" && (
            <>
              <FaTimesCircle className="text-5xl text-red-500 mb-2" />
              <span className="text-red-600 font-normal text-sm text-center mb-2">
                Ticket printing failed.
                <br />
                Please try again.
              </span>
              <Button
                className="w-full h-10 font-semibold mt-1"
                onClick={handleTryAgain}
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueTicketPage;
