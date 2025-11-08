import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import SubHeader from "../components/layout/subheader";
import Button from "../components/button/button";
import { useQueueTicket } from "../hooks/useQueueTicket";

const QueueTicketPage = () => {
  const { printStatus, handlePrint, handleTryAgain } = useQueueTicket();
  const [ticketData, setTicketData] = useState({
    schoolName: "Jesus Good Shepherd School",
    queueNumber: "",
    transactionCode: "",
  });

  useEffect(() => {
    // Load from localStorage or fallback data
    const queueNumber = localStorage.getItem("queueNumber") || "RW000";
    const transactionCode = localStorage.getItem("transactionCode") || "—";

    setTicketData((prev) => ({
      ...prev,
      queueNumber,
      transactionCode,
    }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <header className="text-center">
        <div className="flex gap-2 justify-center">
          <SubHeader
            text="Your Queueing Ticket"
            className="font-bold uppercase"
          />
        </div>
        <p className="text-gray-600 text-sm">
          Present your ticket in transaction office
        </p>
      </header>

      {/* PRINT STATUS DISPLAY */}
      <div className="flex gap-4 w-full justify-center items-center">
        <div className="flex flex-col items-center justify-center rounded-lg py-2 w-64 ">
          {printStatus === "idle" && (
            <>
              {/* 🧾 TICKET PREVIEW */}
              <div className="bg-gray-50 shadow-md border rounded-md p-4 mt-1 w-[320px] text-center">
                 <h2 className="text-lg font-semibold">{ticketData.schoolName}</h2>
                <p className="text-sm text-gray-700 font-medium mb-2">Transaction Slip</p>

                <hr className="border-dashed border-gray-300 mb-3" />

                <h1 className="text-4xl font-bold my-3 text-gray-800">
                  {ticketData.queueNumber}
                </h1>
                <hr className="border-dashed border-gray-300 mt-3 mb-2" />
                <p className="text-xs text-gray-700 font-medium mt-1">
                  Transaction Code: {ticketData.transactionCode}
                </p>
              </div>
              <Button
                className="w-full h-14 flex flex-row rounded-lg items-center justify-center my-2"
                onClick={handlePrint}
              >
                <h2 className="font-semibold text-2xl">PRINT</h2>
              </Button>
            </>
          )}

          {printStatus === "waiting" && (
            <>
              <ImSpinner2 className="animate-spin text-7xl text-gray-400 my-6" />
              <span className="text-gray-600 text-xl">Printing ticket...</span>
            </>
          )}

          {printStatus === "success" && (
            <>
              <FaCheckCircle className="text-7xl text-green-500 my-6" />
              <span className="text-green-600 text-xl font-semibold">
                Printed Successfully!
              </span>
            </>
          )}

          {printStatus === "error" && (
            <>
              <FaTimesCircle className="text-7xl text-red-500 mb-2" />
              <span className="text-red-600 font-normal text-xl text-center mb-2">
                Ticket printing failed.
                <br />
                Please try again.
              </span>
              <Button
                className="w-full h-10 text-xl font-semibold mt-2"
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
