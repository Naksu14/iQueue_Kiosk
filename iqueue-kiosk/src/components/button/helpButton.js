import React, { useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import HelpGuideModal from "../modal/helpGuideModal";

export default function HelpButton({ className = "" }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        aria-label="Help"
        onClick={() => setShowModal(true)}
        className={`fixed top-14 right-2 w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center text-2xl shadow-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <FaQuestionCircle />
      </button>
      {showModal && <HelpGuideModal onClose={() => setShowModal(false)} />}
    </>
  );
}
