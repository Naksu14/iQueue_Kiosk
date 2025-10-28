// src/components/layout/Header.jsx
import React from "react";

const Header = ({ title, className }) => {
  return (
    <h1 className={`text-3xl font-bold mb-1 ${className}`}>
      {title || "Header"}
    </h1>
  );
};

export default Header;
