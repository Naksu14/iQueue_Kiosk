import React from "react";

export default function Button({
  children,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={` bg-white rounded shadow-md hover:shadow-lg transition-shadow p-1 ${className}`}
    >
      {children}
    </button>
  );
}
