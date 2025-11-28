import React from "react";
import { FaArrowRight, FaFile } from "react-icons/fa";
import Container from "../components/layout/container";
import IconContainer from "../components/layout/iconContainer";
import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import TransactionButton from "../components/button/transactionButton";
import { useOfficeServiceSelection } from "../hooks/useOfficeServiceSelection";
import ConfirmCancelModal from "../components/modal/ConfirmCancelModal";

const OfficeServiceSelection = () => {
  const {
    offices,
    loading,
    error,
    activeOffice,
    setActiveOffice,
    handleRequestSelect,
    handleNext,
    isDisabled,
    selectedOfficeRequests,
    transactions,
    showCancelModal,
    setShowCancelModal,
    handleConfirmCancel,
    handleUndoTransaction,
  } = useOfficeServiceSelection();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>Loading offices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <SubHeader text="Step 2: Please select your destination offices and requests." />

      <div className="flex gap-2 w-full justify-center">
        {/* Left Side Office List */}
        <div className="text-left flex flex-col gap-2">
          <p className="bg-white p-1 px-3 border rounded-md shadow-sm text-sm font-bold">
            OFFICES:
          </p>
          {offices.map((office) => (
            <button
              key={office.id}
              disabled={office.status === "closed"} // disable when closed
              className={`w-[230px] flex items-center justify-between p-3 rounded shadow-md hover:shadow-lg border transition
                ${
                  office.status === "closed"
                    ? "text-gray-400 cursor-not-allowed"
                    : activeOffice === office.id
                    ? "bg-gray-200"
                    : "bg-white"
                }`}
              onClick={() => {
                if (office.status !== "closed") {
                  setActiveOffice(office.id);
                }
              }}
            >
              <div className="text-left">
                <h2 className="font-semibold text-lg">{office.name}</h2>
                <p
                  className={`text-sm ${
                    office.status === "open" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {office.status}
                </p>
              </div>

              {/* Show arrow only if active and open */}
              {activeOffice === office.id && office.status === "open" && (
                <div className="text-gray-400">
                  <FaArrowRight />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right Side Selection Requests / Services */}
        <div className="text-left">
          <p className="bg-white p-1 px-3 border rounded-md shadow-sm text-sm font-bold mb-2">
            SELECT REQUESTS / SERVICES:
          </p>
          <div className="w-[540px] bg-white p-1 rounded-md">
            <div className="h-[320px] p-2 flex flex-col gap-2 overflow-y-auto">
              {activeOffice ? (
                offices.find((o) => o.id === activeOffice)?.transactions
                  .length > 0 ? (
                  offices
                    .find((o) => o.id === activeOffice)
                    ?.transactions.map((req) => {
                      const selectedOffice = selectedOfficeRequests.find(
                        (o) => o.officeId === activeOffice
                      );
                      const selectedReq = selectedOffice?.requests.find(
                        (r) => r.id === req.id
                      );
                      const currentOffice = offices.find(
                        (o) => o.id === activeOffice
                      );

                      const alreadyAdded = transactions.some(
                        (t) =>
                          t.officeId === currentOffice?.id &&
                          t.transactionDetails === req.name
                      );

                      return (
                        <Container
                          key={req.id}
                          className={`flex items-start gap-2 p-3 rounded-md transition
                            ${
                              selectedReq
                                ? "bg-[#14AD5A] text-white"
                                : "bg-[#F4F5F9] text-gray-800"
                            }`}
                        >
                          <IconContainer className="bg-[#14AD5A] rounded-lg">
                            <FaFile className="text-white text-xl" />
                          </IconContainer>

                          <div className="flex justify-between items-center flex-1">
                            <div>
                              <p className="text-md font-medium">{req.name}</p>
                              {/* Modern change: Change sub-text based on state for immediate feedback */}
                              <p
                                className={`text-sm italic ${
                                  selectedReq ? "text-white" : "text-gray-500"
                                }`}
                              >
                                {selectedReq
                                  ? "Selected for Transaction"
                                  : req.type}
                              </p>
                            </div>

                            {alreadyAdded ? (
                              // State 1: Already added (or pending) - Use 'Remove' with a modern red pill style
                              <button
                                className="bg-white text-red-600 text-md font-semibold px-3 py-2 rounded-md transition hover:bg-red-50 hover:shadow-md"
                                onClick={() =>
                                  handleUndoTransaction(currentOffice, req)
                                }
                              >
                                {/* For an item already in the list, 'Remove' is clearer */}
                                Remove
                              </button>
                            ) : selectedReq ? (
                              // State 2: Currently selected in this office (Green Row) - Use 'Remove' with a modern green pill style
                              <button
                                className="bg-white text-[#14AD5A] text-md font-semibold px-3 py-2 rounded-md transition hover:bg-gray-100 hover:shadow-md"
                                onClick={() =>
                                  handleRequestSelect(currentOffice, req)
                                }
                              >
                                {/* Since it's currently selected, the action is to 'Remove' it from selection */}
                                Remove
                              </button>
                            ) : (
                              // State 3: Available to request - Use 'Request' with a modern gray pill style
                              <button
                                className="bg-gray-500 text-white text-md font-semibold px-3 py-2 rounded-md disabled:opacity-50 transition hover:bg-gray-600"
                                disabled={alreadyAdded}
                                onClick={() =>
                                  handleRequestSelect(
                                    offices.find((o) => o.id === activeOffice),
                                    req
                                  )
                                }
                              >
                                Request
                              </button>
                            )}
                          </div>
                        </Container>
                      );
                    })
                ) : (
                  <p className="text-gray-400 text-center text-sm mt-8">
                    No available requests for this office.
                  </p>
                )
              ) : (
                <p className="text-gray-400 text-center text-lg mt-8">
                  Please select an office on the left <br />
                  to see available requests / Services.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="flex">
        <BackButton
          onClick={() => {
            if (transactions.length > 0) {
              setShowCancelModal(true);
            } else {
              // No transactions, just go back
              window.history.back();
            }
          }}
        />
        <TransactionButton disabled={isDisabled} onClick={handleNext} />
      </div>

      {/* Modal */}
      <ConfirmCancelModal
        show={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};

export default OfficeServiceSelection;
