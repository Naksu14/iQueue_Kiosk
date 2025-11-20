import React from "react";

export default function IconContainer({ children, className = "" }) {
  return (
    <div
      className={` w-10 h-10 rounded-full flex items-center justify-center text-white text-xl ${className}`}
    >
      {children}
    </div>
  );
}
