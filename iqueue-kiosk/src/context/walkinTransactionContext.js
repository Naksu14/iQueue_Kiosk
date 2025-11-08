import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [transactions, setTransactions] = useState(() => {
    //  Load from localStorage on first render
    const stored = localStorage.getItem("transactions");
    return stored ? JSON.parse(stored) : [];
  });

  // total of transaction request
  const total = transactions.reduce((sum, t) => sum + t.fee * t.copies, 0);

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Add a new transaction
  // - actionType === "Pick Up" ? 0 : 1 || 0 --- actionType === "Pick Up" ? 0 : request.amount || 0
  const addTransaction = (office, request, actionType) => {
    const newTransaction = {
      officeId: office.id,
      officeName: office.name,
      transactionType: actionType,
      transactionDetails: request.name,
      copies: 1,
      fee: request.amount > 0 ? request.amount : "0",
      paymentStatus: request.amount > 0 ? "Unpaid" : null,
      status: "pending",
      estimatedDays: null,
      auditBy: null,
      steps: [
        {
          stepNumber: 1,
          stepName: "pending",
          instruction: "Wait",
          auditBy: null,
        },
      ],
    };

    setTransactions((prev) => {
      const updated = [...prev, newTransaction];
      localStorage.setItem("transactions", JSON.stringify(updated));
      return updated;
    });
  };

  const attachPersonalInfoIdToAllTransactions = (personalInfoId) => {
    setTransactions((prev) => {
      if (prev.length === 0) return prev;

      const updated = prev.map((t) => ({
        ...t,
        personalInfoId: personalInfoId,
      }));

      localStorage.setItem("transactions", JSON.stringify(updated));
      return updated;
    });
  };

  //  Remove a transaction
  const removeTransaction = (index) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  //  Update copies
  const updateCopies = (index, newCopies) => {
    setTransactions((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, copies: Math.max(newCopies, 1) } : t
      )
    );
  };

  //  Export as JSON
  const saveAsJson = () => {
    const jsonData = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.json";
    link.click();
  };

  //  Clear storage if needed
  const clearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem("transactions");
  };

  const handleConfirmCancel = () => {
    clearTransactions();
    setShowCancelModal(false);
    navigate("/");
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        removeTransaction,
        updateCopies,
        total,
        saveAsJson,
        attachPersonalInfoIdToAllTransactions,
        clearTransactions,
        showCancelModal,
        setShowCancelModal,
        handleConfirmCancel,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);
