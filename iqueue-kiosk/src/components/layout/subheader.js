// src/components/layout/Header.jsx
import React from "react";

const SubHeader = ({ text, className }) => {
  return (
    <h1 className={`text-lg font-medium mb-2 ${className}`}>
      {text || "SubHeader"}
    </h1>
  );
};

export default SubHeader;
