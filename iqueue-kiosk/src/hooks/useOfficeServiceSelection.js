import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeOffices } from "../hooks/useRealTimeOffices";
import { useTransaction } from "../context/walkinTransactionContext";

export const useOfficeServiceSelection = () => {
  const navigate = useNavigate();
  const { offices, loading, error } = useRealtimeOffices(5000);
  const {
    addTransaction,
    transactions,
    showCancelModal,
    setShowCancelModal,
    handleConfirmCancel,
  } = useTransaction();

  const [selectedOfficeRequests, setSelectedOfficeRequests] = useState([]);
  const [activeOffice, setActiveOffice] = useState(null);

  // Toggle a request under an office
  const handleRequestSelect = (office, req) => {
    const actionType = req.type;

    setSelectedOfficeRequests((prev) => {
      const officeEntry = prev.find((o) => o.officeId === office.id);

      if (officeEntry) {
        const existingReq = officeEntry.requests.find((r) => r.id === req.id);

        let updatedRequests;
        if (existingReq) {
          updatedRequests = officeEntry.requests.filter((r) => r.id !== req.id);
        } else {
          updatedRequests = [
            ...officeEntry.requests,
            { id: req.id, action: actionType },
          ];
        }

        if (updatedRequests.length === 0) {
          return prev.filter((o) => o.officeId !== office.id);
        }

        return prev.map((o) =>
          o.officeId === office.id ? { ...o, requests: updatedRequests } : o
        );
      } else {
        return [
          ...prev,
          {
            officeId: office.id,
            requests: [{ id: req.id, action: actionType }],
          },
        ];
      }
    });
  };

  // Add selected offices/requests to transaction context
  const handleNext = () => {
    if (selectedOfficeRequests.length === 0 && transactions.length === 0)
      return;

    selectedOfficeRequests.forEach((officeData) => {
      const currentOffice = offices.find((o) => o.id === officeData.officeId);
      if (!currentOffice) return;

      officeData.requests.forEach((reqSel) => {
        const request = currentOffice.transactions.find(
          (r) => r.id === reqSel.id
        );
        if (!request) return;

        const alreadyExists = transactions.some(
          (t) =>
            t.transactionDetails === request.name &&
            t.transactionType === reqSel.action
        );

        if (!alreadyExists) {
          addTransaction(currentOffice, request, reqSel.action);
        }
      });
    });

    navigate("/TransactionPage");
  };

  const isDisabled =
    selectedOfficeRequests.length === 0 && transactions.length === 0;

  return {
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
  };
};
