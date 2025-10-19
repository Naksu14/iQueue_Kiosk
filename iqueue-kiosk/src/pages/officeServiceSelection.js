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
          <p className="bg-white p-1 px-3 border rounded-md shadow-sm text-sm font-bold">OFFICES:</p>
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
          <p className="bg-white p-1 px-3 border rounded-md shadow-sm text-sm font-bold mb-2">SELECT REQUESTS / SERVICES:</p>
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
                              <p className="text-sm italic">{req.type}</p>
                            </div>

                            {alreadyAdded ? (
                              <p className="text-xs text-green-600 font-semibold">
                                Added
                              </p>
                            ) : selectedReq ? (
                              <div className="text-xs">Selected</div>
                            ) : (
                              <button
                                className="bg-gray-200 w-15 h-8 text-xs px-2 py-1 rounded-md disabled:opacity-50"
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
        <BackButton onClick={() => setShowCancelModal(true)} />
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
