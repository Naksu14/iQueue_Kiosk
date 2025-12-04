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
    <div className="flex flex-col items-center justify-center ">
      <header className="text-center">
        <div className="flex gap-2 justify-center">
          <SubHeader
            text="Your Queueing Ticket"
            className="font-bold uppercase"
          />
        </div>
        <p className="text-gray-600 text-sm w-[500px] mx-auto">
          Present your ticket in transaction office, Your number is delayed by 2 minutes to allow time for you to arrive at the transaction office.
        </p>
      </header>

      {/* PRINT STATUS DISPLAY */}
      <div className="flex gap-4 w-full justify-center items-center">
        <div className="flex flex-col items-center justify-center rounded-lg py-2 w-64 ">
          {printStatus === "idle" && (
           <>
            <div className="bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-2xl p-4 mt-3 w-[320px] text-center transition-all hover:shadow-2xl hover:scale-[1.02] duration-300">
              <h2 className="text-md font-bold text-gray-800 mb-1 tracking-tight">
                {ticketData.schoolName}
              </h2>
              <p className="text-sm text-gray-500 font-medium mb-4">
                Transaction Slip
              </p>

              <div className="relative flex flex-col items-center">
                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-3"></div>

                <h1 className="text-5xl font-extrabold text-gray-900 tracking-wide">
                  {ticketData.queueNumber}
                </h1>

                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-3 mb-2"></div>

                <p className="text-xs text-gray-600 font-medium mt-2">
                  Transaction Code:{" "}
                  <span className="font-semibold text-gray-800">
                    {ticketData.transactionCode}
                  </span>
                </p>
              </div>
            </div>

            {/* 🖨️ Print Button */}
            <button
              onClick={handlePrint}
              className="w-full h-14 flex items-center justify-center mt-5 rounded-full
                bg-gradient-to-r from-blue-500 to-green-500
                hover:from-blue-600 hover:to-green-600
                active:scale-95 transition-all duration-300 
                shadow-md hover:shadow-lg group"
            >
              <span className="text-white font-semibold text-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 group-hover:rotate-6 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4 0H10v4h4v-4z"
                  />
                </svg>
                Print Ticket
              </span>
            </button>
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
                className="w-full py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 
                        hover:from-red-600 hover:to-pink-600 text-white font-semibold text-lg 
                        shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                onClick={handleTryAgain}
              >
                Try Again
              </Button>
            </>
          )}

          {printStatus === "no-paper" && (
            <>
              <FaTimesCircle className="text-7xl text-yellow-500 mb-2" />
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                Printer Out of Paper
              </h2>
              <p className="text-gray-600 text-sm text-center mb-4 w-[260px]">
                We apologize! The ticket printer is currently out of paper. Please contact a staff member for assistance.
              </p>
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 
                        hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-lg 
                        shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                  onClick={handleTryAgain}
                >
                  Retry
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueTicketPage;
