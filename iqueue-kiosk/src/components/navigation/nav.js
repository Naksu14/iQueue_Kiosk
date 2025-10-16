import React from "react";
import logo from "../../assets/icons/iQueue.png";
import { useDateTime } from "../../hooks/realTimeDateHooks";

const Nav = () => {
  const { dateString, timeString } = useDateTime();

  return (
    <div className="bg-white shadow-md w-full h-12 flex justify-between items-center p-2 px-3">
      {/* Left: Logo */}
      <div>
        <img src={logo} alt="School Logo" className="h-8" />
      </div>

      {/* Right: Time/Date */}
      <div className="text-gray-700 text-right font-semibold tracking-wide text-lg">
        {dateString}
      </div>

      {/* Right: Time/Date */}
      <div className="text-gray-700 text-right font-semibold tracking-wide text-lg">
        {timeString}
      </div>
    </div>
  );
};

export default Nav;
