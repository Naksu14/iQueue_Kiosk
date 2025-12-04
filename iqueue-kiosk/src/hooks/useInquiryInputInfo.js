import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUserInfo } from "../services/dbServices/createTransactionService";
import { getAllOffices } from "../services/dbServices/officeKioskService";
import { createQueueNumber } from "../services/dbServices/addQueueNumber";
import { updateQueueNoStatus } from "../services/dbServices/addQueueNumber";

export const useInquiryInputInfo = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [printStatus, setPrintStatus] = useState("idle");

  const PRINTER_SERVER =
    process.env.REACT_APP_PRINTER_SERVER || "http://localhost:4000";

  const handlePrint = async () => {
    setPrintStatus("waiting");

    // Check printer paper status before attempting to print
    try {
      const statusRes = await fetch(`${PRINTER_SERVER}/printerStatus`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (
          statusJson &&
          statusJson.ok === true &&
          statusJson.hasPaper === false
        ) {
          // No paper: set UI state and abort printing
          setPrintStatus("no-paper");
          return;
        }
      }
    } catch (e) {
      // If status check fails, fall through and attempt to print (or you may choose to abort)
      console.warn("Printer status check failed, proceeding to print:", e);
    }

    try {
      //  Get queueNumberId from backend or localStorage (fallback)
      const queueNumberId = localStorage.getItem("queueNumberId");

      // Save again just to be sure (prevents null issues later)
      localStorage.setItem("queueNumberId", queueNumberId);

      // Print locally via Raspberry Pi
      const transactionCode = localStorage.getItem("transactionCode");
      const queueNumber = localStorage.getItem("queueNumber");

      let officeName = "Inquiry";
      try {
        const storedOffice = localStorage.getItem("queueOfficeName");
        if (storedOffice) {
          officeName = storedOffice;
        } else if (formData?.officeId && offices && offices.length > 0) {
          const selected = offices.find(
            (o) =>
              o.office_id?.toString() === formData.officeId?.toString() ||
              o.officeId?.toString() === formData.officeId?.toString() ||
              o.id?.toString() === formData.officeId?.toString()
          );
          if (selected)
            officeName = 
              selected.office_name ||
              selected.officeName ||
              selected.name ||
              officeName;
        }
      } catch (e) {
        // fallback to "Inquiry"
      }

      const payload = {
        officeName,
        queueNumber,
        transactionCode,
      };

      const response = await fetch(`${PRINTER_SERVER}/printInquiryTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // This block catches non-2xx HTTP responses (e.g., 500, 400) from the server.
        const text = await response.text();
        console.error("Print server responded with error:", text);
        setPrintStatus("error");
        throw new Error("Printing failed"); // ⬅ This triggers the "error" status.
      }

      // Simulate ticket printing delay
      setTimeout(() => {
        setPrintStatus("success");

        setTimeout(() => {
          //  Backup before clearing localStorage
          const safeQueueId = queueNumberId;

          localStorage.clear(); // reset only after saving ID

          navigate("/");

          //  Schedule automatic status update after 20 seconds
          setTimeout(async () => {
            if (!safeQueueId) {
              console.warn(" No valid queue ID found for status update!");
              return;
            }

            //console.log(" Updating queue status → waiting:", safeQueueId);
            try {
              await updateQueueNoStatus(safeQueueId, "waiting");
            } catch (error) {
              console.error(" Failed to update queue status:", error);
            }
          }, 30000); // 30 seconds delay
        }, 5000); // Wait before navigating home
      }, 3000); // Simulated delay for printing
    } catch (err) {
      console.error(" Failed to create transactions:", err);
      setPrintStatus("error");
    }
  };

  const handleTryAgain = () => setPrintStatus("idle");

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const data = await getAllOffices();
        setOffices(data);
      } catch (error) {
        console.error("Error fetching offices:", error);
      }
    };

    fetchOffices();
  }, []);

  const [formData, setFormData] = useState({
    visitorName: "",
    email: "",
    officeId: "", // selected office id
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
  // Generate transaction code
  const generateTransactionCode = () => {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    // Determine prefix based on selected office (formData.officeId)
    let prefix = "MULTI";
    try {
      if (formData?.officeId && offices && offices.length > 0) {
        const selected = offices.find(
          (o) =>
            o.office_id?.toString() === formData.officeId?.toString() ||
            o.officeId?.toString() === formData.officeId?.toString() ||
            o.id?.toString() === formData.officeId?.toString()
        );
        const officeName = selected
          ? selected.office_name || selected.officeName || selected.name || ""
          : "";
        if (officeName) {
          prefix = officeName.substring(0, 3).toUpperCase();
        }
      }
    } catch (e) {
      // fallback to MULTI
      prefix = "MULTI";
    }

    return `${prefix}-${date}-${Math.floor(Math.random() * 9000 + 1000)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      localStorage.setItem("transactionCode", generateTransactionCode());
      const payload = {
        visitorName: toTitleCase(formData.visitorName || ""),
        email: (formData.email || "").toString().trim().toLowerCase(),
        isVisitor: true,
        transactionCode: generateTransactionCode(),
      };

      const res = await createUserInfo(payload);
      const personalInfoId = res?.id;

      // create queue number for the selected office (if provided)
      let officeName = "Inquiry";
      if (formData.officeId && offices && offices.length > 0) {
        const selected = offices.find(
          (o) =>
            o.office_id?.toString() === formData.officeId?.toString() ||
            o.officeId?.toString() === formData.officeId?.toString()
        );
        if (selected)
          officeName =
            selected.office_name || selected.officeName || officeName;
      }

      const queuePayload = {
        office: officeName,
        officeInvolved: [officeName],
        queueType: "Walk-in",
        personalInfoId,
        isInquiry: true,
      };

      const queueRes = await createQueueNumber(queuePayload);
      try {
        localStorage.setItem("queueNumber", queueRes.queueNumber);
        localStorage.setItem("queueNumberId", queueRes.id);
      } catch (e) {}

      // navigate to ticket page
      navigate("/InquiryQueueTicketPage");
    } catch (err) {
      console.error("Failed to submit inquiry info:", err);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    offices,
    printStatus,
    handlePrint,
    handleTryAgain,
  };
};
