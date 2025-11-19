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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Prevent double-submit while a previous submission is in progress
    if (isSubmitting) {
      console.warn("Submit ignored: already submitting.");
      return;
    }

    setIsSubmitting(true);

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
      console.log(
        "✅ Transactions retrieved for queue creation.",
        transactions
      );

      // Collect unique office names from transactions (filter out falsy)
      const uniqueOfficeNames = [
        ...new Set(transactions.map((t) => t.officeName).filter(Boolean)),
      ];

      // If all transactions are inquiries, route them to their specific office(s).
      // If any transaction is NOT an Inquiry (e.g., Payment), the primary office
      // should be Accounting so the user can pay; include Accounting in involved.
      const allInquiry =
        transactions.length > 0 &&
        transactions.every((t) => t.transactionType === "Inquiry");

      let officeInvolved = [...uniqueOfficeNames];
      let mainOffice;

      if (allInquiry) {
        // All are inquiries — keep their specific office(s)
        mainOffice = officeInvolved.length > 1 ? "Multiple" : officeInvolved[0];
      } else {
        // At least one requires payment or other processing — route to Accounting
        const accountingName = "Accounting Office";
        // Rebuild officeInvolved so Accounting is always first, followed by
        // the other unique offices (excluding Accounting) in their original order.
        const others = uniqueOfficeNames.filter((n) => n !== accountingName);
        officeInvolved = [accountingName, ...others];
        officeInvolved = Array.from(new Set(officeInvolved));
        mainOffice = accountingName;
      }

      // Step 5: Create queue number in backend
      const queuePayload = {
        office: mainOffice,
        officeInvolved,
        queueType: "Walk-in",
        personalInfoId,
      };
      console.log("✅ Queue payload prepared.", queuePayload);

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
    } finally {
      // Allow resubmission after the whole flow completes (success or error)
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isSubmitting,
  };
};
