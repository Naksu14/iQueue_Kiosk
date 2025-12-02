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
      }}
      onTouchStartCapture={(e) => {
        e.stopPropagation();
      }}
      onPointerUpCapture={(e) => {
        e.stopPropagation();
        // Fallback: if no click is fired (some touch devices), resume shortly after
        setTimeout(() => {
          if (!resumedRef.current) handleResume();
        }, 200);
      }}
      onTouchEndCapture={(e) => {
        e.stopPropagation();
        setTimeout(() => {
          if (!resumedRef.current) handleResume();
        }, 200);
      }}
      onClickCapture={(e) => {
        e.stopPropagation();
        // Primary path: resume on click so overlay swallows the click first
        handleResume();
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
      onResume={() => setShow(false)}
    />
  );
}
