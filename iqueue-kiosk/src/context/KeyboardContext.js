import React, { createContext, useState, useContext } from "react";

const KeyboardContext = createContext();

export const KeyboardProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetInput, setTargetInput] = useState(null);

  const showKeyboard = (input, changeHandler) => {
    setTargetInput({ input, changeHandler });
    setIsVisible(true);
  };

  const hideKeyboard = () => {
    setIsVisible(false);
    setTimeout(() => setTargetInput(null), 150);
  };

  const handleKeyPress = (key) => {
    if (!targetInput || !targetInput.input) return;

    const inputEl = targetInput.input;
    const changeHandler = targetInput.changeHandler;
    let value = inputEl.value;
    let cursorPos = value.length;
    const inputType = inputEl.type;
    const inputName = inputEl.name;

    // Handle "Enter" key: just close the keyboard
    if (key === "Enter") {
      hideKeyboard();
      return;
    }

    // Field-specific validation and formatting
    if (inputName === "grade") {
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        if (cursorPos > 0) {
          value = value.slice(0, cursorPos - 1);
          cursorPos -= 1;
        }
      } else if (/[0-9]/.test(key)) {
        if (value.length < 2) {
          value = value + key;
          cursorPos += 1;
        }
      } else {
        return; // Ignore invalid for number
      }
    } else if (inputName === "schoolYear") {
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        value = value.replace(/[^\d]/g, "");
        if (value.length > 0) {
          value = value.slice(0, value.length - 1);
        }
      } else if (/[0-9]/.test(key)) {
        value = value.replace(/[^\d]/g, "");
        if (value.length < 8) {
          value = value + key;
        }
      } else {
        return; // Only accept digits
      }
      // Format as "YYYY - YYYY" if needed
      value = value.replace(/[^\d]/g, "").slice(0, 8);
      if (value.length > 4) {
        value = value.slice(0, 4) + " - " + value.slice(4);
      }
      cursorPos = value.length;
    } else if (inputName === "fullName") {
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        if (cursorPos > 0) {
          value = value.slice(0, cursorPos - 1);
          cursorPos -= 1;
        }
      } else if (!/[0-9]/.test(key)) {
        value = value + key;
        cursorPos += key.length;
      } else {
        return; // Ignore digits for name
      }
    } else if (inputName === "email") {
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        if (cursorPos > 0) {
          value = value.slice(0, cursorPos - 1);
          cursorPos -= 1;
        }
      } else {
        value = (value + key).replace(/\s/g, "").toLowerCase();
        cursorPos = value.length;
      }
    } else {
      // Other text-like fields
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        if (cursorPos > 0) {
          value = value.slice(0, cursorPos - 1);
          cursorPos -= 1;
        }
      } else {
        value = value + key;
        cursorPos += key.length;
      }
    }

    if (changeHandler) {
      changeHandler({
        target: { name: inputName, value }
      });
    }

    // Only set selection range for text/email/password/search fields
    if (
      inputType === "text" ||
      inputType === "email" ||
      inputType === "password" ||
      inputType === "search"
    ) {
      try {
        inputEl.setSelectionRange(cursorPos, cursorPos);
      } catch (e) {
        // Ignore errors (e.g., for number fields)
      }
    }
  };

  return (
    <KeyboardContext.Provider
      value={{ isVisible, showKeyboard, hideKeyboard, handleKeyPress }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => useContext(KeyboardContext);
