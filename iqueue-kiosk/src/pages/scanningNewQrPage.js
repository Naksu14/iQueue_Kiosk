import React from "react";
import { FaQrcode, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import Button from "../components/button/button";
import IconContainer from "../components/layout/iconContainer";
import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import {useNewOnlineScanningHooks} from "../hooks/useNewOnlineScanningHooks";
import { useKeyboard } from "../context/KeyboardContext";

const ScanningNewQrPage = () => {
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();
  const {
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
  } = useNewOnlineScanningHooks();

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
              Transaction Details
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
                  Pick-Up Document:
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
            onClick={handleDisplayQueueInMobile}
            disabled={isDisplaying}
          >
            {isDisplaying ? (
              <>
                <ImSpinner2 className="animate-spin text-2xl text-white" />
                <span>Getting Queue Number...</span>
              </>
            ) : (
              "Get Queue Number"
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
          text="Scan QR for New/Payment Transaction"
          className="font-bold"
        />
        <p className="text-gray-700 text-md  mt-1">
          Present your QR code to proceed with a New Service Request or Payment. 
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

export default ScanningNewQrPage;
