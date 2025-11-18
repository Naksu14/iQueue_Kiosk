import React, { useState } from "react";

export default function ShutdownModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("password"); // "password" or "select"
  const [password, setPassword] = useState("");

  const openModal = () => {
    setIsOpen(true);
    setStep("password"); // reset step every time you open
    setPassword("");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handlePasswordSubmit = () => {
    if (password.length === 0) {
      alert("Please enter a password");
      return;
    }
    setStep("select");
  };

  const handleAction = async (action) => {
    try {
      const res = await fetch("http://localhost:3001/kiosk-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: action.toLowerCase() }),
      });
      const data = await res.json();
      alert(data.message);
      closeModal();
    } catch (err) {
      alert("Failed to execute command");
      console.error(err);
      closeModal();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <div>
      {/* Button to open modal */}
      <button
        onClick={openModal}
        className="absolute bottom-3 right-3  bg-gray-200/50 text-gray-300  text-xs px-2 py-1 rounded"
      >
        iQueue Control
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md max-h-[90%] overflow-y-auto px-6 py-5 relative">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-3xl"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-xl font-bold text-center">iQueue Control</h2>
              <p className="text-gray-500 text-sm text-center mt-1">
                Enter your password to access
              </p>
            </div>

            {/* Body */}
            {step === "password" && (
              <div className="flex flex-col gap-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Password"
                />
                <button
                  onClick={handlePasswordSubmit}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2"
                >
                  Submit
                </button>
              </div>
            )}

            {step === "select" && (
              <div className="flex flex-col gap-4">
                <p className="text-gray-700 text-center mb-2">Select an action:</p>
                <button
                  onClick={() => handleAction("Shutdown")}
                  className="bg-red-500 hover:bg-red-600 text-white rounded py-2"
                >
                  Shutdown
                </button>
                <button
                  onClick={() => handleAction("Reboot")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white rounded py-2"
                >
                  Reboot
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
