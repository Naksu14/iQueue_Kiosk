import React from "react";
import { useNavigate } from "react-router-dom";

import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useKeyboard } from "../context/KeyboardContext";
import { useInquiryInputInfo } from "../hooks/useInquiryInputInfo";

const InQuiryInputInformation = () => {
  const navigate = useNavigate();
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();
  const { formData, handleChange, handleSubmit, isSubmitting, offices } =
    useInquiryInputInfo();

  // Helper to focus and scroll input into view
  const handleFocus = (e) => {
    showKeyboard(e.target, handleChange);

    // Scroll smoothly so the input stays visible above keyboard
    // Adjusted delay for better user experience on a kiosk/touch screen
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  return (
    <div
      id="form-container"
      // Added max-w-lg to constrain the form size and center it nicely on larger screens (kiosk)
      className={`max-w-lg mx-auto flex flex-col items-center justify-center overflow-y-auto h-screen transition-all duration-300 ${
        isVisible ? "py-[60px]" : "pb-0"
      }`}
    >
      <div className="w-full -mt-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full p-6 rounded-md text-left"
        >
          {/* Header */}
          <div className="flex justify-center">
            <SubHeader text="Please provide your contact details" />
          </div>

          {/* Visitor Name */}
          <div className="mb-2">
            <label
              htmlFor="visitorName"
              className="block text-lg font-semibold mb-2"
            >
              Visitor Name <span className="text-red-500">*</span>
            </label>
            <input
              id="visitorName"
              type="text"
              name="visitorName"
              value={formData.visitorName || ""}
              onChange={handleChange}
              onFocus={handleFocus}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-2">
            <label htmlFor="email" className="block text-lg font-semibold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              onFocus={handleFocus}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g. yourname@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="officeId"
              className="block text-md font-semibold mb-2"
            >
              Select Office Destination <span className="text-red-500">*</span>
            </label>
            <select
              id="officeId"
              name="officeId"
              value={formData.officeId || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
              required
            >
              <option value="" disabled>
                Select Office
              </option>
              {(offices || []).map((o) => (
                <option
                  key={o.office_id || o.officeId || o.id}
                  value={o.office_id || o.officeId || o.id}
                  disabled={o.office_status && o.office_status !== "open"}
                >
                  {o.office_name || o.officeName || o.name}
                  {o.office_status && o.office_status !== "open"
                    ? " (Closed)"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={hideKeyboard}
            className={`w-full h-12 text-white text-xl font-bold rounded-xl shadow-lg transition-all active:scale-[.98]
              ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <BackButton onClick={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default InQuiryInputInformation;
