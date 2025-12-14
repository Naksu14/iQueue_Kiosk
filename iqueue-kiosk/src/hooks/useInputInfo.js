import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUserInfo } from "../services/dbServices/createTransactionService";
import { createQueueNumber } from "../services/dbServices/addQueueNumber";
import { useTransaction } from "../context/walkinTransactionContext";
import { getDirectAccountingSettings } from "../services/dbServices/officeKioskService";
import { getStudentInfoByLRN } from "../services/dbServices/studentListService";

export const useInputInfo = () => {
  const { attachPersonalInfoIdToAllTransactions } = useTransaction();
  const navigate = useNavigate();
  const [directAccountingSettings, setDirectAccountingSettings] =
    useState(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getDirectAccountingSettings();
        setDirectAccountingSettings(settings);
      } catch (error) {
        console.error("Failed to fetch direct accounting settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleFetchStudentInfo = async (lrn) => {
    try {
      const studentInfo = await getStudentInfoByLRN(lrn);
      if (studentInfo) {
        // Map API fields to formData shape
        setFormData((prev) => ({
          ...prev,
          studentLrn:
            studentInfo.lrn || studentInfo.studentLrn || prev.studentLrn,
          firstName:
            studentInfo.first_name || studentInfo.firstName || prev.firstName,
          lastName:
            studentInfo.last_name || studentInfo.lastName || prev.lastName,
          middleName:
            studentInfo.middle_name ||
            studentInfo.middleName ||
            prev.middleName,
          suffixName: studentInfo.suffix || prev.suffixName,
          grade: studentInfo.grade_level || studentInfo.grade || prev.grade,
          section: studentInfo.section || prev.section,
          schoolYear:
            studentInfo.school_year ||
            studentInfo.schoolYear ||
            prev.schoolYear,
          email: studentInfo.email || prev.email,
          // Normalize alumni flag to a strict boolean. Handle true/false, 1/0, and string forms.
          isAlumni:
            studentInfo.is_alumni === true ||
            studentInfo.is_alumni === 1 ||
            studentInfo.is_alumni === "1" ||
            String(studentInfo.is_alumni).toLowerCase() === "true"
              ? true
              : false,
        }));
        return studentInfo;
      }
      // not found
      return null;
    } catch (error) {
      console.error("Failed to fetch student info:", error);
      return null;
    }
  };
  // NOTE: do not auto-call fetch here; callers should invoke when needed.

  const [formData, setFormData] = useState(() => {
    // Load any temporarily saved form data so users who navigate back see their inputs
    try {
      const saved = localStorage.getItem("tempFormData");
      return saved
        ? JSON.parse(saved)
        : {
            isVisitor: false,
            visitorName: "",
            firstName: "",
            lastName: "",
            middleName: "",
            suffixName: "",
            studentLrn: "",
            isAlumni: false,
            grade: "",
            section: "",
            schoolYear: "",
            email: "",
            transactionCode: "",
            verifiedBy: null,
          };
    } catch (e) {
      return {
        isVisitor: false,
        visitorName: "",
        firstName: "",
        lastName: "",
        middleName: "",
        suffixName: "",
        studentLrn: "",
        isAlumni: false,
        grade: "",
        section: "",
        schoolYear: "",
        email: "",
        transactionCode: "",
        verifiedBy: null,
      };
    }
  });

  // Persist temporary form data whenever it changes so users can go back and resume
  // We intentionally persist everything except transient flags if needed.
  useEffect(() => {
    try {
      localStorage.setItem("tempFormData", JSON.stringify(formData));
    } catch (e) {
      // ignore storage errors
    }
  }, [formData]);
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

      // Step 2: Normalize name fields and create personal info
      // Convert names and section to Title Case so DB gets consistent casing
      const toTitleCase = (val) => {
        if (!val && val !== "") return val;
        return val
          .toString()
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase()
          .split(" ")
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
          .join(" ");
      };

      const normalized = {
        ...formData,
        firstName: toTitleCase(formData.firstName || ""),
        lastName: toTitleCase(formData.lastName || ""),
        middleName: toTitleCase(formData.middleName || ""),
        suffixName: toTitleCase(formData.suffixName || ""),
        section: toTitleCase(formData.section || ""),
        visitorName: toTitleCase(formData.visitorName || ""),
      };

      const finalData = { ...normalized, transactionCode };
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

      // Collect unique office names from transactions (filter out falsy)
      const uniqueOfficeNames = [
        ...new Set(transactions.map((t) => t.officeName).filter(Boolean)),
      ];
      // Determine if any transaction requires direct accounting
      // If direct accounting is enabled in settings, default to true
      // so that in case of fetch failure, we err on the side of caution
      // and route to Accounting.
      // should be Accounting so the user can pay; include Accounting in involved.
      const DirectAccounting = directAccountingSettings?.enabled;

      let officeInvolved = [...uniqueOfficeNames];
      let mainOffice;

      if (!DirectAccounting) {
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

      // Step 5: Clear any temporary saved form data on successful submit
      try {
        localStorage.removeItem("tempFormData");
      } catch (e) {}

      // Step 6: Navigate to ticket page
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
    handleFetchStudentInfo,
  };
};
