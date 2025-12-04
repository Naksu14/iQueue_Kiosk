import React, { useEffect, useMemo, useRef } from "react";
import QRCode from "react-qr-code";

/**
 * TicketModal
 * Visual, non-persistent ticket preview for users who prefer
 * to capture a photo instead of printing. Reuses the same
 * payload used for printing and renders a styled ticket card
 * with a QR code and quick Save/Share actions.
 *
 * Props:
 * - isOpen: boolean – controls modal visibility
 * - onClose: function – closes the modal
 * - ticketPayload: object – the same payload used for printing
 *   Example fields often available:
 *     {
 *       schoolName, officeName, queueNumber, transactionCode,
 *       fullName, office, transactionDetailsArr, estimatedWait, ...
 *     }
 * - title: optional string – override modal title
 */
const TicketModal = ({ isOpen, onClose, ticketPayload = {}, title }) => {

  // Derive display fields safely from payload
  const display = useMemo(() => {
    const {
      schoolName,
      officeName,
      queueNumber,
      transactionCode,
      fullName,
      office,
      transactionDetailsArr,
      estimatedWait,
      countWaiting,
    } = ticketPayload || {};

    return {
      header: schoolName || officeName || "Transaction Slip",
      queueNumber: queueNumber || "—",
      transactionCode: transactionCode || "—",
      fullName: fullName,
      office: office || officeName,
      details: Array.isArray(transactionDetailsArr)
        ? transactionDetailsArr
        : [],
      estimatedWait,
      countWaiting,
    };
  }, [ticketPayload]);

  // QR data should be the same payload used for printing
  const qrData = useMemo(() => {
    try {
      return JSON.stringify(ticketPayload || {});
    } catch (_) {
      return String(ticketPayload || "");
    }
  }, [ticketPayload]);

  // Actions removed for VR ticket: users can take a photo of the screen.

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (isOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/95 border border-gray-200 rounded-2xl shadow-2xl w-[360px] max-w-[95vw] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-800">
            {title || "Ticket Preview"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            {display.header}
          </h3>
          <p className="text-xs text-gray-500 mb-3">Transaction Slip</p>

          <div className="flex flex-col items-center">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-2" />
            <div className="text-4xl font-extrabold text-gray-900 tracking-wide">
              {display.queueNumber}
            </div>
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-2 mb-2" />
            <p className="text-xs text-gray-600">
              Transaction Code:{" "}
              <span className="font-semibold text-gray-800">
                {display.transactionCode}
              </span>
            </p>

            {/* Optional fields (pickup details, name, office) */}
            {display.fullName && (
              <p className="text-xs text-gray-600 mt-1">
                Name: <span className="font-medium">{display.fullName}</span>
              </p>
            )}
            {display.office && (
              <p className="text-xs text-gray-600">
                Office: <span className="font-medium">{display.office}</span>
              </p>
            )}
            {display.details && display.details.length > 0 && (
              <div className="mt-2 w-full text-left">
                <p className="text-xs text-gray-600 font-semibold mb-1">
                  Details:
                </p>
                <ul className="list-disc list-inside text-xs text-gray-700">
                  {display.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* QR Code uses the same payload used for printing */}
            <div className="mt-3 bg-white p-2 rounded-md border border-gray-200">
              <QRCode value={qrData} size={160} level="M" />
            </div>

            {/* Footer info */}
            <div className="mt-2 text-[10px] text-gray-500">
              <span>{new Date().toLocaleString()}</span>
              {typeof display.estimatedWait === "number" &&
                display.estimatedWait > 0 && (
                  <span className="ml-2">
                    • Est. Wait:{" "}
                    {Math.round(display.estimatedWait) < 60
                      ? `${Math.round(display.estimatedWait)}s`
                      : `${Math.floor(display.estimatedWait / 60)} min`}
                  </span>
                )}
              {typeof display.countWaiting === "number" &&
                display.countWaiting > 0 && (
                  <span className="ml-2">
                    • {display.countWaiting} in queue
                  </span>
                )}
            </div>
          </div>

        {/* No actions: take a photo of this ticket to use without printing */}
      </div>
    </div>
  );
};

export default TicketModal;
