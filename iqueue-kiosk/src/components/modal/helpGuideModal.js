import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

export default function HelpGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-[92%] max-w-[980px] max-h-[92%] overflow-y-auto px-5 py-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-3xl"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold">Help Guide</h2>
            <FaQuestionCircle className="text-blue-500 text-2xl ml-2" />
          </div>
          <p className="text-gray-500 text-base mt-2">
            Quick steps to use the kiosk for Walk-in and Online processes.
          </p>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* Walk-in Process */}
          <section className="bg-green-50 rounded-xl p-5 shadow border border-green-100">
            <h3 className="font-bold text-xl mb-3 text-green-700">
              Walk‑in Process
            </h3>
            <ol className="list-decimal list-inside text-gray-800 text-base space-y-2 text-left">
              <li>
                Tap <span className="font-semibold">Request Transaction</span>.
              </li>
              <li>
                Select your <span className="font-semibold">Office</span> (e.g.,
                Accounting or Registrar).
              </li>
              <li>
                Select the{" "}
                <span className="font-semibold">Service to Request</span> (e.g.,
                TOR, Certificate of Grades).
              </li>
              <li>
                Enter your <span className="font-semibold">details</span> and
                tap <span className="font-semibold">Submit</span>.
              </li>
              <li>
                Print your <span className="font-semibold">Queue Ticket</span>.
              </li>
              <li>Wait for your number on the display; proceed when called.</li>
            </ol>
            <p className="text-sm text-gray-600 mt-3">
              For new requests, proceed to{" "}
              <span className="font-semibold">Accounting</span> first for
              payment.
            </p>

            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-green-700 text-base mb-2">
                For Pick‑up Documents
              </h4>
              <ol className="list-decimal list-inside text-gray-800 text-base space-y-2 text-left">
                <li>
                  Tap <span className="font-semibold">Pick‑up Request</span>.
                </li>
                <li>Scan your ticket’s QR code.</li>
                <li>
                  Print your <span className="font-semibold">Queue Ticket</span>
                  .
                </li>
                <li>Wait for your number on the display screen.</li>
                <li>Receive your documents.</li>
              </ol>
            </div>
          </section>

          {/* Online Process */}
          <section className="bg-yellow-50 rounded-xl p-5 shadow border border-yellow-100">
            <h3 className="font-bold text-xl mb-3 text-yellow-700">
              Online Process
            </h3>
            <ol className="list-decimal list-inside text-gray-800 text-base space-y-2 text-left">
              <li>
                Tap <span className="font-semibold">Online Request</span>.
              </li>
              <li>
                Scan your <span className="font-semibold">QR code</span> from
                the iQueue app.
              </li>
              <li>
                Wait for your{" "}
                <span className="font-semibold">queue number</span> to appear in
                the app.
              </li>
              <li>
                Proceed to the{" "}
                <span className="font-semibold">assigned office</span>.
              </li>
              <li>Wait for your number on the display; proceed when called.</li>
            </ol>
            <p className="text-sm text-gray-600 mt-3">
              For new requests, proceed to{" "}
              <span className="font-semibold">Accounting</span> first for
              payment.
            </p>

            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-yellow-700 text-base mb-2">
                For Pick‑up Documents
              </h4>
              <ol className="list-decimal list-inside text-gray-800 text-base space-y-2 text-left">
                <li>
                  Tap <span className="font-semibold">Online Request</span>.
                </li>
                <li>Scan your QR code for pick‑up.</li>
                <li>Wait for your queue number in the app.</li>
                <li>Wait for your number on the display screen.</li>
                <li>Receive your documents.</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
