import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useInputInfo } from "../hooks/useInputInfo";
import { useKeyboard } from "../context/KeyboardContext";

const InputInformation = () => {
  const navigate = useNavigate();
  const { formData, handleChange, handleSubmit, isSubmitting } = useInputInfo();
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();

  const [showVisitorModal, setShowVisitorModal] = useState(false);

  const handleVisitorCheckboxChange = (e) => {
    const checked = e.target.checked;
    handleChange({ target: { name: "isVisitor", value: checked } });
    if (checked) {
      setShowVisitorModal(true);
    } else {
      // clear visitor name when unchecked
      handleChange({ target: { name: "visitorName", value: "" } });
      setShowVisitorModal(false);
    }
  };

  const handleSaveVisitorName = () => {
    setShowVisitorModal(false);
    hideKeyboard();
  };

  const handleCancelVisitor = () => {
    // uncheck visitor and clear name
    handleChange({ target: { name: "isVisitor", value: false } });
    handleChange({ target: { name: "visitorName", value: "" } });
    setShowVisitorModal(false);
    hideKeyboard();
  };

  const visitorNameVal = (formData.visitorName || "").toString();
  const isVisitorNameValid = visitorNameVal.trim().length > 0;

  // Helper to focus and scroll input into view
  const handleFocus = (e) => {
    showKeyboard(e.target, handleChange);

    // Scroll smoothly so the input stays visible above keyboard
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div
      id="form-container"
      className={`flex flex-col items-center justify-center overflow-y-auto h-screen transition-all duration-300 ${
        isVisible ? "py-60" : "pb-0"
      }`}
    >
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full p-6 rounded-md shadow-lg text-left"
        >
          <div className="flex justify-center -mt-2">
            <SubHeader text="Step 4: Help us identify and process your request faster" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block font-semibold mb-1">
                ID number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="studentLrn"
                value={formData.studentLrn}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "").slice(0, 20);
                  handleChange({ target: { name: "studentLrn", value } });
                }}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="LRN | Student number"
                maxLength={12}
                required
              />
            </div>

            <div className="w-full flex col-span-2 gap-6">
              {/* Alumni Checkbox */}
              <div className="flex flex-col">
                <label className="font-semibold mr-3">Alumni</label>
                <div className="flex items-center h-14">
                  <input
                    type="checkbox"
                    name="isAlumni"
                    checked={formData.isAlumni}
                    onChange={handleChange}
                    className="w-5 h-5 accent-green-600"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Check if yes
                  </span>
                </div>
              </div>
              {/* Alumni Checkbox */}
              <div className="flex flex-col">
                <label className="font-semibold mr-3">Visitor</label>
                <div className="flex items-center h-14">
                  <input
                    type="checkbox"
                    name="isVisitor"
                    checked={formData.isVisitor}
                    onChange={handleVisitorCheckboxChange}
                    className="w-5 h-5 accent-green-600"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Check if yes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <div>
              <label className="block font-semibold mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="Last name"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="Middle name (if applicable)"
              />
            </div>
          </div>

          {/* Grade / Section / School Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <label className="block font-semibold mb-1">
                Grade Level<span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-3 bg-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 custom-scroll-select"
                style={{ maxHeight: "220px", overflowY: "auto" }}
                required
              >
                <option value="" disabled>
                  Select grade level
                </option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="Section"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                School Year<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="schoolYear"
                value={formData.schoolYear}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, "").slice(0, 8);
                  if (value.length > 4) {
                    value = value.slice(0, 4) + " - " + value.slice(4);
                  }
                  handleChange({ target: { name: "schoolYear", value } });
                }}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="School Year 0000 - 0000"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="e.g. juan@example.com"
                required
              />
              <span className="text-gray-500 text-sm">
                This email will be used for notifications.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-[45%] h-12 mt-2 sm:mt-0 text-white text-lg font-semibold rounded-lg shadow-md active:scale-95 transition-all
                ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:shadow-lg"
                }`}
              onClick={hideKeyboard}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
          </div>
        </form>
      </div>

      <BackButton onClick={() => navigate(-1)} />
      {showVisitorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 "
          style={{ paddingBottom: isVisible ? 240 : "" }}
        >
          <div className="bg-white rounded-lg w-[90%] max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Visitor Name</h3>
            <p className="text-sm text-gray-600 mb-3">
              Please enter the visitor's name.
            </p>
            <input
              type="text"
              name="visitorName"
              value={formData.visitorName || ""}
              onChange={handleChange}
              onFocus={handleFocus}
              className="w-full border rounded-md px-4 py-3 bg-gray-100 mb-2"
              placeholder="Visitor full name"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelVisitor}
                className="px-4 py-2 rounded-md bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVisitorName}
                disabled={!isVisitorNameValid}
                aria-disabled={!isVisitorNameValid}
                className={`px-4 py-2 rounded-md ${
                  isVisitorNameValid
                    ? "bg-blue-600 text-white"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputInformation;
