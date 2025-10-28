// src/components/VirtualKeyboard.jsx
import React, { useState } from "react";
import { useKeyboard } from "../../context/KeyboardContext";

const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const SYMBOL_KEYS = ["-", ".", "@"];
const TOP_LETTER_KEYS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const MIDDLE_LETTER_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const BOTTOM_LETTER_KEYS = ["Z", "X", "C", "V", "B", "N", "M"];

export default function VirtualKeyboard() {
  const { isVisible, handleKeyPress, hideKeyboard } = useKeyboard(); // <-- added hideKeyboard
  const [showNum, setShowNum] = useState(false);
  const [isUppercase, setIsUppercase] = useState(true);

  if (!isVisible) return null;

  const keyStyle =
    "bg-[#1E293B] text-white rounded-xl  w-[55px] h-[50px] text-lg font-semibold flex items-center justify-center active:scale-95 transition-all hover:bg-[#334155] shadow-md";

  const renderKeys = (keys) =>
    keys.map((key) => {
      const displayKey = isUppercase ? key.toUpperCase() : key.toLowerCase();
      return (
        <button
          key={key}
          onClick={() => handleKeyPress(displayKey)}
          className={keyStyle}
        >
          {displayKey}
        </button>
      );
    });

  return (
    <div
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-[#0F172A] border-t border-gray-700 shadow-lg z-50 rounded-t-2xl py-4 px-6 flex flex-col items-center"
      style={{
        width: "100%",
        maxWidth: "1000px",
      }}
    >
      {/* Letter Keyboard */}
      {!showNum ? (
        <>
          <div className="flex justify-center gap-2 mb-1">{renderKeys(TOP_LETTER_KEYS)} {/* Hide Keyboard Button */}
        </div>
          <div className="flex justify-center gap-2 mb-1">{renderKeys(MIDDLE_LETTER_KEYS)}</div>
          <div className="flex justify-center items-center gap-2 mb-1">
            <button
              onClick={() => setIsUppercase((prev) => !prev)}
              className={`${
                isUppercase ? "bg-yellow-600" : "bg-[#334155]"
              } w-[70px] h-[55px] rounded-xl text-xl font-bold flex items-center justify-center active:scale-95`}
            >
              ⇧
            </button>
            {renderKeys(BOTTOM_LETTER_KEYS)}
            {SYMBOL_KEYS.map((key) => (
              <button key={key} onClick={() => handleKeyPress(key)} className={keyStyle}>
                {key}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Number Keyboard */
        <div className="flex justify-center flex-wrap max-w-[850px] gap-2 mb-2">
          {[...NUMBER_KEYS].map((key) => (
            <button key={key} onClick={() => handleKeyPress(key)} className={keyStyle}>
              {key}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex justify-center items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowNum((prev) => !prev)}
          className="bg-[#334155] text-white rounded-lg w-[100px] h-[50px] text-sm font-semibold active:scale-95"
        >
          {showNum ? "ABC" : "123"}
        </button>

        <button
          onClick={() => handleKeyPress(" ")}
          className="bg-[#1E293B] text-white rounded-lg w-[300px] h-[50px] text-base font-semibold active:scale-95"
        >
          Space
        </button>

        <button
          onClick={() => handleKeyPress("Backspace")}
          className="bg-red-600 text-white rounded-lg w-[70px] h-[50px] text-lg font-semibold active:scale-95"
        >
          ⌫
        </button>

        <button
          onClick={() => handleKeyPress("Clear")}
          className="bg-yellow-600 text-white rounded-lg w-[90px] h-[50px] text-base font-semibold active:scale-95"
        >
          Clear
        </button>

        {/* <button
          onClick={() => handleKeyPress("Enter")}
          className="bg-green-600 text-white rounded-lg w-[90px] h-[50px] text-base font-semibold active:scale-95"
        >
          Enter
        </button> */}
        <button
          onClick={hideKeyboard}
          className="bg-gray-600 text-white rounded-lg p-3 h-[50px] text-base font-semibold active:scale-95"
        >
          Hide
        </button>

       
      </div>
    </div>
  );
}
