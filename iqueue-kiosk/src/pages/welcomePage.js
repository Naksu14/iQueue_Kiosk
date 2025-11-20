import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMale, FaQrcode } from "react-icons/fa";
import ShutdownModal from "../components/modal/shutDownModal";
import Button from "../components/button/button";
import HelpButton from "../components/button/helpButton";
import IconContainer from "../components/layout/iconContainer";
import Header from "../components/layout/header";
import SubHeader from "../components/layout/subheader";

const WelcomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Header */}
      <header className="mb-3 text-center">
        <Header title="Welcome!" />
        <p className="text-gray-600 text-xs tracking-wide">
          Pastorelle - Jesus Good Shepherd School iQueue Kiosk
        </p>
      </header>

      {/* Step Label */}
      <SubHeader text="Please select an option to start your transaction." />

      {/* Card Grid */}
      <div className="grid grid-cols-2 gap-6 mt-3">
        {/* Walk-in Request */}
        <Button
          onClick={() => navigate("/WalkinSelectTransaction")}
          className="w-64 h-48 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
          <IconContainer className=" bg-green-600 text-green-600 rounded-full mb-2">
            <FaMale size={26} />
          </IconContainer>
          <h2 className="font-semibold text-base mb-1">Walk-in Request</h2>
          <p className="text-gray-500 text-xs">Go to Office Selection</p>
        </Button>

        {/* Online Appointment */}
        <Button
          onClick={() => navigate("/OnlineSelectTransaction")}
          className="w-64 h-48 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
          <IconContainer className=" p-3 bg-yellow-500 text-blue-600 rounded-full mb-2">
            <FaQrcode size={26} />
          </IconContainer>
          <h2 className="font-semibold text-base mb-1">Online Request</h2>
          <p className="text-gray-500 text-xs">Use Kiosk's QR Scanner</p>
        </Button>
      </div>
      <HelpButton />
      <div>
        <ShutdownModal />
      </div>
    </div>
  );
};
export default WelcomePage;
