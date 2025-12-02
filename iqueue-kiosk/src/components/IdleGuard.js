import React, { useState, useRef } from "react";
import useIdle from "../hooks/useIdle";
import { useKeyboard } from "../context/KeyboardContext";
import touchImage from "../assets/TouchFinal.png";

const IdleOverlay = ({ show, imageSrc, onResume }) => {
  const resumedRef = useRef(false);
  if (!show) return null;
  const handleResume = () => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    onResume();
  };
  return (
    <div
      className="fixed inset-0 z-[1000] bg-[#0b1020]/80 backdrop-blur-sm flex items-center justify-center touch-none"
      onPointerDownCapture={(e) => {
        e.stopPropagation();
        handleResume();
      }}
      onTouchStartCapture={(e) => {
        e.stopPropagation();
        handleResume();
      }}
      onClickCapture={(e) => {
        e.stopPropagation();
      }}
    >
      <img
        src={imageSrc}
        alt="Tap to start"
        className="w-screen h-screen object-contain select-none pointer-events-none"
        draggable={false}
      />
    </div>
  );
};

export default function IdleGuard() {
  // Hook must be called unconditionally (inside provider in App.js)
  const { hideKeyboard } = useKeyboard();
  const [show, setShow] = useState(false);

  useIdle({
    timeout: 60000, // 1 minute of inactivity
    considerHiddenAsIdle: true,
    onIdle: () => {
      hideKeyboard();
      setShow(true);
    },
    onActive: () => {
      // Activity resets timer; overlay close is handled by onResume
    },
  });

  return (
    <IdleOverlay
      show={show}
      imageSrc={touchImage}
      onResume={() => {
        // Defer unmounting to the next tick to avoid click-through
        setTimeout(() => setShow(false), 0);
      }}
    />
  );
}
