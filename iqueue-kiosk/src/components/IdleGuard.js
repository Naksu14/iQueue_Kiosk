// IdleGuard.js
import React, { useState } from "react";
import useIdle from "../hooks/useIdle";
import { useKeyboard } from "../context/KeyboardContext";
import touchImage from "../assets/newkioskview.png";

const IdleOverlay = ({ show, imageSrc, onResume }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-[#0b1020]/80 backdrop-blur-sm flex items-center justify-center"
      // onPointerDown triggers the onResume action
      onPointerDown={onResume}
    >
      <img
        src={imageSrc}
        alt="Tap to start"
        className="w-screen h-screen object-contain select-none"
        draggable={false}
      />
    </div>
  );
};

export default function IdleGuard() {
  const { hideKeyboard } = useKeyboard();
  const [show, setShow] = useState(false);

  useIdle({
    timeout: 60000,
    considerHiddenAsIdle: true,
    onIdle: () => {
      hideKeyboard();
      setShow(true);
    },
    onActive: () => {
      // Activity resets timer; overlay close is handled by onResume
    },
  });

  // --- MODIFICATION HERE ---
  const resumeWithDelay = () => {
    // A slight delay (e.g., 200ms) prevents the tap that closes
    // the overlay from immediately clicking an element underneath.
    setTimeout(() => {
      setShow(false);
    }, 200);
  };
  // --- END MODIFICATION ---

  return (
    <IdleOverlay
      show={show}
      imageSrc={touchImage}
      // Pass the new function to the overlay
      onResume={resumeWithDelay}
    />
  );
}
