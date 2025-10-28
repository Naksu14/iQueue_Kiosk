import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im"; // For animated loading, if available
import Button from "../components/button/button";
import IconContainer from "../components/layout/iconContainer";
import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";

const ScanningPage = () => {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");
  // 'idle', 'waiting', 'success', 'error'
  const [scanStatus, setScanStatus] = useState("idle");

  // Simulate scan process for demo
  const handleScan = () => {
    setScanStatus("waiting");
    // Simulate async scan
    setTimeout(() => {
      // For demo, random status
      const result = Math.random() > 0.5 ? "success" : "error";
      setScanStatus(result);
    }, 1800);
  };

  const handleTryAgain = () => setScanStatus("idle");

  return (
    <div className="flex flex-col items-center justify-center">
      <header className="mb-1 text-center">
        <SubHeader text="Scan QR or Enter Code" className="font-bold" />
        <p className="text-gray-600 text-sm">
          Present your QR code or enter your transaction code <br />
          below if scanning is unavailable.
        </p>
      </header>

      {/* Scan status visualizations */}
      <div className="flex gap-4 w-full justify-center">
        {!showInput && (
          <div className="flex flex-col items-center justify-center rounded-lg py-2">
            {scanStatus === "idle" && (
              <Button
                className="w-44 h-14 flex flex-row items-center justify-center my-6"
                onClick={handleScan}
              >
                <IconContainer>
                  <FaQrcode className="text-2xl" />
                </IconContainer>
                <h2 className="font-semibold text-lg ml-3">Scan now</h2>
              </Button>
            )}

            {scanStatus === "waiting" && (
              <>
                <ImSpinner2 className="animate-spin text-5xl text-gray-400 my-6" />
                <span className="text-gray-600">Waiting for scan...</span>
              </>
            )}

            {scanStatus === "success" && (
              <>
                <FaCheckCircle className="text-5xl text-green-500 my-6" />
                <span className="text-green-600 font-semibold">
                  Scan Successful!
                </span>
              </>
            )}

            {scanStatus === "error" && (
              <>
                <FaTimesCircle className="text-5xl text-red-500 mb-2" />
                <span className="text-red-600 font-normal text-sm text-center mb-2">
                  QR Code not recognized or expired.
                  <br />
                  Please try again or proceed as walk-in.
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
        )}

        {/* Code input mode */}
        {showInput && (
          <form
            className="w-64 flex flex-col gap-3 items-center py-6"
            onSubmit={(e) => {
              e.preventDefault();
              // handle submit
            }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter transaction code"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <Button className="w-full h-12 font-semibold">Submit</Button>
          </form>
        )}
      </div>

      <div>
        {!showInput && scanStatus !== "success" && scanStatus !== "waiting" && (
          <button
            className="text-gray-500 underline underline-offset-1"
            onClick={() => setShowInput(true)}
          >
            Enter transaction code
          </button>
        )}
        {showInput && (
          <button
            className="text-gray-500 underline underline-offset-1"
            onClick={() => setShowInput(false)}
          >
            Back to scan
          </button>
        )}
      </div>
      <BackButton onClick={() => navigate(-1)} />
    </div>
  );
};
export default ScanningPage;
