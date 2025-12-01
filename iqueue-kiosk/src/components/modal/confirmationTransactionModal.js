import React from "react";

const ConfirmationTransactionModal = ({
  show,
  onCancel,
  onConfirm,
  formData = {},
  transactions = [],
  isSubmitting = false,
}) => {
  if (!show) return null;

  // Function to safely construct the full name
  const getFullName = () => {
    return [
      formData.firstName,
      formData.middleName,
      formData.lastName,
      formData.suffixName,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const fullName = getFullName();

  // Helper component for a single data field
  const DataField = ({ label, value }) => (
    <p className="flex justify-between items-start py-1">
      <span className="font-medium text-gray-600 pr-2">{label}:</span>
      <span className="text-gray-800 font-semibold text-right flex-1 break-words">
        {value || "-"}
      </span>
    </p>
  );

  return (
    // Backdrop and Centering
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      {/* Modal Container: Adjusted max-w to md/lg for the two-column layout 
        on a 7-inch screen (especially in landscape mode). 
      */}
      <div className="bg-white rounded-md shadow-2xl w-full overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Confirm Request Details
          </h2>
        </div>

        {/* Content Area - Uses Flexbox for two-column layout */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* TWO-COLUMN CONTAINER: 
              - flex and space-x-6 enables the side-by-side layout.
              - flex-col on smaller screens (sm:flex-row) makes it stack vertically if space is tight.
            */}
          <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-6">
            {/* LEFT COLUMN: Personal Information */}
            <div className="flex-1 min-w-0 border-r pr-6">
              <h3 className="text-base font-bold text-left text-green-600 mb-2 border-b-2 border-green-100 pb-1">
                Personal Information
              </h3>
              <div className="text-md space-y-1">
                <DataField label="Name" value={fullName} />
                <DataField label="LRN / ID" value={formData.studentLrn} />
                <DataField
                  label="Grade / Section"
                  value={`${formData.grade || "-"} ${
                    formData.section ? `/ ${formData.section}` : ""
                  }`}
                />
                <DataField label="School Year" value={formData.schoolYear} />
                <DataField label="Email" value={formData.email} />
                {formData.isVisitor && (
                  <DataField label="Visitor" value={formData.visitorName} />
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Transactions */}
            <div className="flex-1 ">
              <h3 className="text-base font-bold text-left text-green-600 mb-2 border-b-2 border-green-100 pb-1">
                Transactions
              </h3>
              <div className="space-y-3">
                {transactions && transactions.length > 0 ? (
                  transactions.map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 pr-3 text-left">
                        {/* Transaction Name */}
                        <p className="font-semibold text-md text-gray-800 leading-tight">
                          {t.transactionDetails ||
                            t.name ||
                            "Untitled Document"}
                        </p>
                        {/* Type (e.g., Request Document) */}
                        <p className={`text-sm leading-none`}>
                          {t.transactionType || "Request Document"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {/* Fee */}
                        {t.fee > 0 && (
                          <p className="text-sm font-semibold text-red-500 mt-1">
                            ₱ {t.fee.toLocaleString()}
                          </p>
                        )}
                        {/* Copies */}
                        {typeof t.copies === "number" && t.copies > 1 && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            Copies: {t.copies}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No documents or services selected.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Action Buttons */}
        <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50">
          {/* Warning Message (Left side) */}
          <div className="text-left max-w-sm">
            <span className="text-sm font-bold text-gray-700 block">
            IMPORTANT:
            </span>
            <span className="text-sm text-red-600 block">
              Make sure your personal info and email address are correct to
              receive updates on your request.
            </span>
          </div>

          {/* Action Buttons (Right side) */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              // Increased padding/text size slightly for better touch target on small screens
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-150 ease-in-out"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              // Changed py-3 to py-2.5 for consistency and text-md to text-sm
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition duration-150 ease-in-out ${
                isSubmitting
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Confirm & Proceed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationTransactionModal;
