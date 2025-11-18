import React, { useState } from "react";
import { useKeyboard } from "../../context/KeyboardContext";
import { useRef, useEffect } from "react";
export default function ShutdownModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("password"); // "password" or "select"
  const [password, setPassword] = useState("");
  const { showKeyboard, isVisible, hideKeyboard } = useKeyboard();

  // Helper to focus and scroll input into view
  const passwordRef = useRef(null);
  const handleChange = (e) => setPassword(e.target.value);
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
  const openModal = () => {
    setIsOpen(true);
    setStep("password"); // reset step every time you open
    setPassword("");
    // focus the password input shortly after opening so the keyboard can attach
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 50);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handlePasswordSubmit = () => {
    if (password.length === 0) {
      alert("Please enter a password");
      return;
    }

    // Validate password with the kiosk-control server before showing actions
    (async () => {
      try {
        // Trim whitespace and build server URL relative to current host so it works
        // when the frontend is served from the Pi's IP instead of localhost.
        const trimmed = (password || "").trim();
        const host = window?.location?.hostname || 'localhost';
        const base = `http://${host}:3001`;

        const res = await fetch(`${base}/kiosk-validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: trimmed }),
        });
        if (!res.ok) {
          // invalid password or server error — close modal as requested
          const body = await res.json().catch(() => ({}));
          alert(body.message || 'Invalid password');
          closeModal();
          return;
        }
        // password valid — store trimmed password and proceed to selection step
        setPassword(trimmed);
        setStep("select");
        // hide keyboard when moving to select step
        hideKeyboard();
      } catch (err) {
        console.error('Validation error', err);
        alert('Failed to validate password');
        hideKeyboard();
        closeModal();
      }
    })();
  };

  const handleAction = async (action) => {
    try {
      const host = window?.location?.hostname || 'localhost';
      const base = `http://${host}:3001`;

      const res = await fetch(`${base}/kiosk-control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: action.toLowerCase() }),
      });
      const data = await res.json();
      alert(data.message);
      hideKeyboard();
      closeModal();
    } catch (err) {
      alert("Failed to execute command");
      console.error(err);
      hideKeyboard();
      closeModal();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  useEffect(() => {
    // if modal closes, ensure keyboard is hidden
    if (!isOpen) hideKeyboard();
  }, [isOpen]);

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
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40`}
          style={{ paddingBottom: isVisible ? 240 : 0 }}
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md overflow-y-auto px-6 py-5 relative"
            style={{ maxHeight: isVisible ? '' : '90vh' }}
          >
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
              <h2 className="text-xl font-bold text-center">Authorize Access to Kiosk Control</h2>
              
            </div>

            {/* Body */}
            {step === "password" && (
              <div className="flex flex-col gap-4">
                <p className="text-gray-500 text-sm text-center mt-1">
                  Enter password to access
                </p>
                <input
                  type="password"
                  name="password"
                  ref={passwordRef}
                  value={password}
                  onChange={handleChange}
                  onFocus={(e) => handleFocus(e)}
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
