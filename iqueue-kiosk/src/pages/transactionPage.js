import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaFile } from "react-icons/fa";
import Container from "../components/layout/container";
import IconContainer from "../components/layout/iconContainer";
import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useTransaction } from "../context/walkinTransactionContext";
import ConfirmCancelModal from "../components/modal/ConfirmCancelModal";

const TransactionDetails = () => {
  const navigate = useNavigate();
  const {
    transactions,
    removeTransaction,
    updateCopies,
    total,
    showCancelModal,
    setShowCancelModal,
    handleConfirmCancel,
  } = useTransaction();

  return (
    <div className="flex flex-col items-center justify-center">
      <SubHeader text="Transaction Details" />

      <div className="flex flex-col items-center w-full px-2">
        <div className="bg-white w-full max-w-[650px] rounded-xl p-3 shadow-sm">
          {transactions.length > 0 ? (
            transactions.map((t, i) => (
              <Container
                key={i}
                className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all mb-2"
              >
                {/* Left section - File Icon + Info */}
                <div className="flex items-center gap-3">
                  <IconContainer className="bg-[#E6F4EA]/100 p-2 rounded-lg">
                    <FaFile className="text-[#14AD5A] text-xl" />
                  </IconContainer>

                  <div className="flex flex-col leading-tight">
                    <p className="flex justify-start text-gray-800 text-sm font-semibold truncate max-w-[320px]">
                      {t.transactionDetails}
                    </p>
                    {/* <p className="text-gray-500 text-xs">{t.officeName}</p> */}

                    <p
                      className={`flex justify-start text-xs ${
                        t.transactionType === "Payment"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    >
                      {t.transactionType}

                      {t.fee > 0 && (
                        <span className="text-red-500 text-xs ml-2">
                          ₱ {t.fee.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right section - Controls */}
                <div className="flex items-center gap-2">
                  {t.transactionType !== "Payment" && (
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                      <button
                        className="bg-gray-300 active:bg-gray-400 text-lg w-8 h-8 rounded-md"
                        onClick={() => updateCopies(i, t.copies + 1)}
                      >
                        +
                      </button>
                      <span className="text-sm px-1 font-semibold text-gray-700">
                        {t.copies}
                      </span>
                      <button
                        className="bg-gray-300 active:bg-gray-400 text-lg w-8 h-8 rounded-md"
                        onClick={() => updateCopies(i, t.copies - 1)}
                      >
                        -
                      </button>
                    </div>
                  )}

                  <button
                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-2 rounded-md"
                    onClick={() => removeTransaction(i)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </Container>
            ))
          ) : (
            <p className="text-center text-gray-400 py-6 text-sm">
              No transactions selected yet.
            </p>
          )}
        </div>

        {/*  Footer Section */}
        {transactions.length > 0 && (
          <div className="flex flex-col items-center w-full max-w-[650px] mt-4 space-y-3">
            <p className="text-gray-800 font-semibold text-base">
              Total:{" "}
              <span className="text-red-600 font-bold">
                ₱ {total.toLocaleString()}
              </span>
            </p>

            <div className="flex gap-3 justify-center w-full">
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-gray-300 hover:bg-green-700 active:bg-green-800 text-gray-600 text-sm font-semibold px-5 py-4 rounded-xl shadow-md w-[40%]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigate("/InputInformation");
                }}
                className="bg-green-500 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-4 rounded-xl shadow-md w-[40%]"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      <BackButton onClick={() => navigate(-1)} />

      {/* Modal */}
      <ConfirmCancelModal
        show={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};

export default TransactionDetails;
