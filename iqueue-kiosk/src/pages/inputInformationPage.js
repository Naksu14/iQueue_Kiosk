import React from "react";
import { useNavigate } from "react-router-dom";

import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useInputInfo } from "../hooks/useInputInfo";
import { useKeyboard } from "../context/KeyboardContext";

const InputInformation = () => {
  const navigate = useNavigate();
  const { formData, handleChange, handleSubmit } = useInputInfo();
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();

  // Helper to focus and scroll input into view
  const handleFocus = (e) => {
    showKeyboard(e.target, handleChange);

    // Scroll smoothly so the input stays visible above keyboard
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  return (
    <div
      id="form-container"
      className={`flex flex-col items-center justify-center overflow-y-auto h-screen transition-all duration-300 ${
        isVisible ? "pb-60" : "pb-0"
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

          {/* Full Name */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">
              Full Name of Student <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onFocus={handleFocus}
              className="w-full border rounded-md px-4 py-3 bg-gray-100"
              placeholder="e.g. Juan Carlos Jr Rizal"
              required
            />
          </div>

          {/* Alumni Checkbox */}
          <div className="flex items-center mb-3">
            <label className="font-semibold mr-3">Alumni</label>
            <input
              type="checkbox"
              name="isAlumni"
              checked={formData.isAlumni}
              onChange={handleChange}
              className="w-5 h-5 accent-green-600"
            />
            <span className="ml-2 text-sm text-gray-600">Check if yes</span>
          </div>

          {/* Grade / Section / School Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block font-semibold mb-1">
                Grade Level<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="grade"
                value={formData.grade}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 2); // limit to 2 digits
                  handleChange({ target: { name: "grade", value } });
                }}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="e.g. 12"
                required
              />
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
                placeholder="e.g. Shepherd"
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
                  let value = e.target.value
                    .replace(/[^\d]/g, "")
                    .slice(0, 8);
                  if (value.length > 4) {
                    value = value.slice(0, 4) + " - " + value.slice(4);
                  }
                  handleChange({ target: { name: "schoolYear", value } });
                }}
                onFocus={handleFocus}
                className="w-full border rounded-md px-4 py-3 bg-gray-100"
                placeholder="e.g. 0000 - 0000"
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
              className="bg-blue-600 text-white rounded-md px-4 py-4 text-xl w-[50%] hover:bg-blue-700 active:scale-95 transition-transform"
              onClick={hideKeyboard}
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      <BackButton onClick={() => navigate(-1)} />
    </div>
  );
};

export default InputInformation;
