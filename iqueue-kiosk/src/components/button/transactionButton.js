import React from "react";

export default function TransactionButton({
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`fixed bottom-4 left-16 h-12 rounded-full flex items-center justify-center text-sm shadow-lg mx-1 p-2 transition-colors
        ${
          disabled
            ? "bg-gray-300 cursor-not-allowed text-gray-600"
            : "bg-blue-500 text-white hover:bg-blue-700"
        } 
        ${className}`}
    >
      Your Transaction
    </button>
  );
}
