// src/components/VirtualKeyboard.jsx
import React, { useState, useRef } from "react";
import { useKeyboard } from "../../context/KeyboardContext";

const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const SYMBOL_KEYS = ["-", ".", "@"];
const TOP_LETTER_KEYS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const MIDDLE_LETTER_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const BOTTOM_LETTER_KEYS = ["Z", "X", "C", "V", "B", "N", "M"];

// Long press alternatives (extendable)
const ALT_KEYS = {
  N: ["Ñ"], // Uppercase alternative; lowercase handled in rendering
};
const LONG_PRESS_THRESHOLD = 500; // ms

export default function VirtualKeyboard() {
  const { isVisible, handleKeyPress, hideKeyboard, getTargetValue } =
    useKeyboard(); // <-- added getTargetValue
  const [showNum, setShowNum] = useState(false);
  const [isUppercase, setIsUppercase] = useState(true);
  const [altForKey, setAltForKey] = useState(null); // which key's alt popup is open
  const longPressTimerRef = useRef(null);
  const pressedKeyRef = useRef(null);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressedKeyRef.current = null;
  };

  const handlePressStart = (key) => {
    pressedKeyRef.current = key;
    // If key has alternates set a timer
    if (ALT_KEYS[key]) {
      longPressTimerRef.current = setTimeout(() => {
        setAltForKey(key);
        longPressTimerRef.current = null; // timer done
      }, LONG_PRESS_THRESHOLD);
    }
  };

  const handlePressEnd = (key) => {
    // If popup open, do nothing (selection occurs via popup buttons)
    if (altForKey === key) {
      clearLongPress();
      return;
    }
    // If it was a short press (timer still active) send the base key
    if (pressedKeyRef.current === key && longPressTimerRef.current) {
      handleKeyPress(isUppercase ? key.toUpperCase() : key.toLowerCase());
    }
    clearLongPress();
  };

  const selectAlternate = (baseKey, altChar) => {
    const displayAlt = isUppercase
      ? altChar.toUpperCase()
      : altChar.toLowerCase();
    handleKeyPress(displayAlt);
    setAltForKey(null);
    clearLongPress();
  };

  const closeAltPopup = () => setAltForKey(null);

  if (!isVisible) return null;

  const keyStyle =
    "bg-[#1E293B] text-white rounded-xl  w-[55px] h-[50px] text-lg font-semibold flex items-center justify-center active:scale-95 transition-all hover:bg-[#334155] shadow-md";

  const renderKeys = (keys) =>
    keys.map((key) => {
      const displayKey = isUppercase ? key.toUpperCase() : key.toLowerCase();
      const hasAlt = ALT_KEYS[key];
      if (!hasAlt) {
        return (
          <button
            key={key}
            onClick={() => {
              const preLen =
                typeof getTargetValue === "function"
                  ? getTargetValue().length
                  : null;
              handleKeyPress(displayKey);
              // If this is the first character typed, switch to lowercase display
              if (preLen === 0) setIsUppercase(false);
            }}
            className={keyStyle}
          >
            {displayKey}
          </button>
        );
      }
      // Key with alternates (long press for popup)
      return (
        <div key={key} className="relative">
          <button
            onMouseDown={() => handlePressStart(key)}
            onMouseUp={() => handlePressEnd(key)}
            onMouseLeave={() => handlePressEnd(key)}
            onTouchStart={() => handlePressStart(key)}
            onTouchEnd={() => handlePressEnd(key)}
            onContextMenu={(e) => e.preventDefault()}
            className={keyStyle}
          >
            {displayKey}
          </button>
          {altForKey === key && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-2 bg-[#1E293B] px-3 py-2 rounded-xl shadow-xl border border-gray-600 z-50">
              {hasAlt.map((alt) => (
                <button
                  key={alt}
                  onClick={() => {
                    const preLen =
                      typeof getTargetValue === "function"
                        ? getTargetValue().length
                        : null;
                    selectAlternate(key, alt);
                    if (preLen === 0) setIsUppercase(false);
                  }}
                  className="bg-[#334155] text-white rounded-md min-w-[45px] h-[45px] text-lg font-semibold flex items-center justify-center active:scale-95"
                >
                  {isUppercase ? alt.toUpperCase() : alt.toLowerCase()}
                </button>
              ))}
              <button
                onClick={closeAltPopup}
                className="bg-red-600 text-white rounded-md w-[45px] h-[45px] text-sm font-semibold active:scale-95"
              >
                ×
              </button>
            </div>
          )}
        </div>
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
          <div className="flex justify-center gap-2 mb-1">
            {renderKeys(TOP_LETTER_KEYS)} {/* Hide Keyboard Button */}
          </div>
          <div className="flex justify-center gap-2 mb-1">
            {renderKeys(MIDDLE_LETTER_KEYS)}
          </div>
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
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={keyStyle}
              >
                {key}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Number Keyboard */
        <div className="flex justify-center flex-wrap max-w-[850px] gap-2 mb-2">
          {[...NUMBER_KEYS].map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={keyStyle}
            >
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
          onClick={() => {
            const preLen =
              typeof getTargetValue === "function"
                ? getTargetValue().length
                : null;
            handleKeyPress("Backspace");
            if (preLen !== null && preLen <= 1) setIsUppercase(true);
          }}
          className="bg-red-600 text-white rounded-lg w-[70px] h-[50px] text-lg font-semibold active:scale-95"
        >
          ⌫
        </button>

        <button
          onClick={() => {
            handleKeyPress("Clear");
            setIsUppercase(true);
          }}
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
