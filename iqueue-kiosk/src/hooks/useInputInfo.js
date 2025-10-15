import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserInfo } from "../services/dbServices/createTransactionService";
import { createQueueNumber } from "../services/dbServices/addQueueNumber";
import { useTransaction } from "../context/walkinTransactionContext";

export const useInputInfo = () => {
  const { attachPersonalInfoIdToAllTransactions } = useTransaction();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    isAlumni: false,
    grade: "",
    section: "",
    schoolYear: "",
    email: "",
    transactionCode: "",
    verifiedBy: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Generate transaction code
  const generateTransactionCode = () => {
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    if (transactions.length === 0) return `NONE-${date}`;

    const uniqueOffices = [...new Set(transactions.map((t) => t.officeId))];

    if (uniqueOffices.length === 1) {
      const office = transactions[0].officeId;
      const officePrefix = office === 1 ? "REG" : office === 3 ? "ACC" : "GEN";
      return `${officePrefix}-${date}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else {
      return `MULTI-${date}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }
  };

  // Determine office (for queue number generation)
  const getOfficeType = () => {
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const uniqueOffices = [...new Set(transactions.map((t) => t.officeId))];

    if (uniqueOffices.length > 1) return "Multiple";
    if (uniqueOffices[0] === 1) return "Registrar";
    if (uniqueOffices[0] === 3) return "Accounting";
    return "General";
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Generate transaction code
      const transactionCode = generateTransactionCode();

      // Step 2: Create personal info
      const finalData = { ...formData, transactionCode };
      const res = await createUserInfo(finalData);

      const personalInfoId = res.id;
      localStorage.setItem("personalInfoId", personalInfoId);
      localStorage.setItem("transactionCode", transactionCode);

      // Step 3: Attach personal info to transactions
      attachPersonalInfoIdToAllTransactions(personalInfoId);

      // Step 4: Create queue number in backend
      const office = getOfficeType();
      const queuePayload = {
        office,
        source: "Walk-in",
        personalInfoId,
      };

      const queueRes = await createQueueNumber(queuePayload);
      localStorage.setItem("queueNumber", queueRes.queueCode);

      console.log(" Queue Number Created:", queueRes.queueCode);

      // Step 5: Navigate to ticket page
      navigate("/QueueTicketPage");
    } catch (error) {
      console.error(" Failed to save info:", error);
      alert("Failed to save user information. Please try again.");
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
  };
};
