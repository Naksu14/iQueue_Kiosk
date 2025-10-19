import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

export default function HelpGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-h-[90%] overflow-y-auto px-4 py-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-3xl"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-3">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-center">Help Guide</h2>
            <FaQuestionCircle className="text-blue-500 text-2xl m-1" />
          </div>
          <p className="text-gray-500 text-sm text-center mt-1">
            Please read carefully before proceeding.
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-start">
          {/* Walk-in Request */}
          <div className="bg-blue-50 rounded-lg flex-1 p-1 flex flex-col shadow-sm">
            <h3 className="font-bold text-lg text-center mb-2">
              Walk–in Request
            </h3>
            <p className="text-gray-700 text-sm mb-2 text-center">
              Use this if you don’t have an appointment.
            </p>
            <b className="text-sm mb-1 block text-center">Steps:</b>
            <ol className="list-decimal list-inside text-gray-700 text-sm mb-3 pl-4 w-full text-left">
              <li>Select the office (Registrar, Accounting)</li>
              <li>Select the purpose (TOR, Certificate of grade)</li>
              <li>Choose Request or Pick Up</li>
              <li>Get a printed Transaction Slip</li>
            </ol>
            <p className="text-gray-500 text-center text-sm">
              For students, guests, and anyone who didn’t book online.
            </p>
          </div>

          {/* Scan QR Code */}
          <div className="bg-blue-50 rounded-lg flex-1 p-1 flex flex-col shadow-sm">
            <h3 className="font-bold text-lg text-center mb-2">Scan QR Code</h3>
            <p className="text-gray-700 text-sm mb-2 text-center">
              Already booked online? This is for you.
            </p>
            <b className="text-sm mb-1 block text-center">Steps:</b>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-3 pl-5 w-full text-left">
              <li>Open your iQueue application</li>
              <li>Show your QR Code</li>
              <li>Let the scanner read your code</li>
              <li>Your ticket prints automatically</li>
            </ul>
            <p className="text-gray-500 text-center text-sm">
              Fast lane for online appointments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
