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
      className={`fixed bottom-5 left-[165px] -translate-x-1/2 z-50 
    flex items-center justify-center px-4 h-12
    rounded-full text-md font-semibold tracking-wide shadow-lg 
    transition-all duration-300 ease-in-out
    ${
      disabled
        ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none opacity-0"
        : "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 hover:shadow-xl active:scale-95"
    } 
    ${className}`}
    >
      <span className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        Your Transaction
      </span>
    </button>
  );
}
