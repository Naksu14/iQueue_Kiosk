import React from "react";

export default function Container({ children, className = "" }) {
  return <div className={`rounded shadow-sm p-1 ${className}`}>{children}</div>;
}
