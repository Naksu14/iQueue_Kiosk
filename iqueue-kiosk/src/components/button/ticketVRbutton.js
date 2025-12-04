import React, { useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import TicketModal from "../modal/ticketModal";

/**
 * TicketVRButton
 * Reusable floating action button that opens the TicketModal
 * using the same payload used for printing tickets.
 *
 * Props:
 * - ticketPayload: object – the data used for printing
 * - title: string – optional modal title
 * - className: string – optional extra classes for button container
 */
const TicketVRButton = ({
  ticketPayload,
  title = "Ticket Preview",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg 
					bg-gradient-to-r from-indigo-500 to-purple-600 text-white 
					flex items-center justify-center hover:opacity-90 active:scale-95 ${className}`}
        aria-label="Show Ticket"
      >
        <FaTicketAlt className="text-2xl" />
      </button>

      {/* Modal */}
      <TicketModal
        isOpen={open}
        onClose={() => setOpen(false)}
        ticketPayload={ticketPayload}
        title={title}
      />
    </>
  );
};

export default TicketVRButton;
