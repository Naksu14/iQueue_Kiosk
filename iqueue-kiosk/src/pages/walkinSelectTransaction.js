import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMale } from "react-icons/fa";
import Button from "../components/button/button";
import HelpButton from "../components/button/helpButton";
import IconContainer from "../components/layout/iconContainer";
import Header from "../components/layout/header";
import SubHeader from "../components/layout/subheader";

const WalkinSelectTransaction = () => {
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
      <SubHeader text="Step 1: Please select an option to start your transaction." />

      {/* Card Grid */}
      <div className="grid grid-cols-3 gap-6 mt-3">
        {/* Walk-in Request */}
        <Button
            onClick={() => navigate("/OfficeServiceSelection")}
            className="w-48 h-36 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
            <IconContainer className="p-4 bg-green-100 text-green-600 rounded-full mb-2">
            <FaMale size={26} />
            </IconContainer>
            <h2 className="font-semibold text-base mb-1">Request Transaction</h2>
            <p className="text-gray-600 text-[13px] font-medium">
            Make new transaction / service request
            </p>
        </Button>

        {/* Walk-in Pick up Request */}
        <Button
            onClick={() => navigate("/")}
            className="w-48 h-36 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
            <IconContainer className="p-4 bg-blue-100 text-blue-600 rounded-full mb-2">
            <FaMale size={26} />
            </IconContainer>
            <h2 className="font-semibold text-base mb-1">Pick-up Request</h2>
            <p className="text-gray-600 text-[13px] font-medium">
            Claim your request / document
            </p>
        </Button>

        {/* Walk-in Inquiry */}
        <Button
            onClick={() => navigate("/")}
            className="w-48 h-36 flex flex-col items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
            <IconContainer className="p-4 bg-yellow-100 text-yellow-600 rounded-full mb-2">
            <FaMale size={26} />
            </IconContainer>
            <h2 className="font-semibold text-base mb-1">Inquiry</h2>
            <p className="text-gray-600 text-[13px] font-medium">
            Ask about processes or services of school
            </p>
        </Button>
        </div>

      <HelpButton />
    </div>
  );
};
export default WalkinSelectTransaction;
