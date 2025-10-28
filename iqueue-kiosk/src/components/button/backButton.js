import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function BackButton({ onClick, className = "" }) {
  return (
    <>
      <button
        onClick={onClick}
        className={`fixed bottom-4 left-4 w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center text-2xl shadow-lg hover:bg-gray-700 transition-colors ${className}`}
      >
        <FaArrowLeft />
      </button>
    </>
  );
}
