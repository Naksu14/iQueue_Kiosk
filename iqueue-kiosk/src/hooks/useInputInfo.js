import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserInfo } from "../services/dbServices/createTransactionService";
import { createQueueNumber } from "../services/dbServices/addQueueNumber";
import { useTransaction } from "../context/walkinTransactionContext";

export const useInputInfo = () => {
  const { attachPersonalInfoIdToAllTransactions } = useTransaction();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    studentLrn: "",
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
    const transactions = JSON.parse(
      localStorage.getItem("transactions") || "[]"
    );
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    // Get unique office names
    const uniqueOfficeNames = [
      ...new Set(transactions.map((t) => t.officeName || "General")),
    ];

    // Determine prefix
    const prefix =
      uniqueOfficeNames.length === 1
        ? uniqueOfficeNames[0].substring(0, 3).toUpperCase() // single office
        : "MULTI"; // multi-office

    return `${prefix}-${date}-${Math.floor(Math.random() * 9000 + 1000)}`;
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

      // Step 4: Determine office type and involved offices
      const transactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
      );
      const uniqueOfficeNames = [
        ...new Set(transactions.map((t) => t.officeName || "General")),
      ];

      // Main office for the 'office' field (first office)
      const mainOffice =
        uniqueOfficeNames.length > 1 ? "Multiple" : uniqueOfficeNames[0];

      // officeInvolved should always be an array
      const officeInvolved = uniqueOfficeNames;

      // Step 5: Create queue number in backend
      const queuePayload = {
        office: mainOffice,
        officeInvolved,
        queueType: "Walk-in",
        personalInfoId,
      };

      //console.log("Queue Payload:", queuePayload);

      const queueRes = await createQueueNumber(queuePayload);
      localStorage.setItem("queueNumber", queueRes.queueNumber);
      localStorage.setItem("queueNumberId", queueRes.id);

      // console.log(
      //   " Queue Number Created:",
      //   queueRes.queueNumber,
      //   "ID:",
      //   queueRes.id
      // );

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
