import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaCreditCard } from "react-icons/fa";
import Button from "../components/button/button";
import BackButton from "../components/button/backButton";
import HelpButton from "../components/button/helpButton";
import IconContainer from "../components/layout/iconContainer";
import Header from "../components/layout/header";
import SubHeader from "../components/layout/subheader";

const OnlineSelectTransaction = () => {
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
      <SubHeader 
        text={
          <>
            Step 1: Please select <span className="text-yellow-500">Online Request</span> Options to Scan your transaction
          </>
        } 
      />

      {/* Card Grid */}
      <div className="grid grid-cols-2 gap-6 mt-3">
        {/* Walk-in Request */}
        <Button
          onClick={() => navigate("/ScanningNewQrPage")}
          className="w-64 h-48 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
          <IconContainer className="p-2 bg-green-600 text-green-600 rounded-full mb-2">
            <FaCreditCard size={26} />
          </IconContainer>
          <h2 className="font-semibold text-base mb-1">New Transaction/Payment</h2>
          <p className="text-gray-600 text-[13px] font-medium">
            Scan your QR for new service request or payment
          </p>
        </Button>

        {/* Walk-in Pick up Request */}
        <Button
          onClick={() => navigate("/ScanningPage")}
          className="w-64 h-48 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
          <IconContainer className="bg-blue-500 text-blue-600 rounded-full mb-2">
            <FaBoxOpen size={26} />
          </IconContainer>
          <h2 className="font-semibold text-base mb-1">Transaction Pick-up</h2>
          <p className="text-gray-600 text-[13px] font-medium">
            Scan your QR to claim your request or document
          </p>
        </Button>
      </div>

      <HelpButton />
      <BackButton onClick={() => navigate(-1)} />
    </div>
  );
};
export default OnlineSelectTransaction;
