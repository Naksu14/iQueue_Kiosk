import React from "react";

const ConfirmCancelModal = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[320px] text-center">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Cancel Transaction?
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Your current transaction will be removed.  
          Do you want to continue?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md w-24 hover:bg-gray-400 active:scale-95"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 text-white text-sm px-4 py-2 rounded-md w-24 hover:bg-red-600 active:scale-95"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCancelModal;
