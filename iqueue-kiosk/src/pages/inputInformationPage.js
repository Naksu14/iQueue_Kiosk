import React from "react";
import { useNavigate } from "react-router-dom";

import SubHeader from "../components/layout/subheader";
import BackButton from "../components/button/backButton";
import { useInputInfo } from "../hooks/useInputInfo";

const InputInformation = () => {
  const navigate = useNavigate();
  const { formData, handleChange, handleSubmit } = useInputInfo();

  return (
    <div className="flex flex-col items-center justify-center">
      <SubHeader text="Step 4: Help us identify and process your request faster" />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-3 rounded-md shadow-lg text-left"
      >
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
            className="w-full border rounded-md px-4 py-3 bg-gray-100"
            placeholder="e.g. Juan Carlos Jr Rizal"
            required
          />
        </div>

        {/* Alumni Checkbox */}
        <div className="flex items-center mb-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
              className="w-full border rounded-md px-4 py-3 bg-gray-100"
              placeholder="e.g. 12"
              required
            />

          </div>

          <div>
            <label className="block font-semibold mb-1">
              Section<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full border rounded-md px-4 py-3 bg-gray-100"
              placeholder="e.g. Shepherd"
              required
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
                  .replace(/[^\d]/g, "") // remove non-numeric characters
                  .slice(0, 8); // limit to 8 digits (e.g., 20252026)

                // auto-insert " - " after 4 digits
                if (value.length > 4) {
                  value = value.slice(0, 4) + " - " + value.slice(4);
                }

                handleChange({ target: { name: "schoolYear", value } });
              }}
              className="w-full border rounded-md px-4 py-3 bg-gray-100"
              placeholder="e.g. 2025 - 2026"
              required
            />

          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 bg-gray-100"
            placeholder="e.g. juan@example.com"
            required
          />
          <span className="text-gray-500 text-sm">
            This email will be used for notifications.
          </span>
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md px-4 py-4 text-xl w-[50%] hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Submit
          </button>
        </div>
      </form>

      <BackButton onClick={() => navigate(-1)} />
    </div>
  );
};

export default InputInformation;
