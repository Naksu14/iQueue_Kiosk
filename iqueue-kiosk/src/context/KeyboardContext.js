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

    const capitalizeFirstLetter = (str) => {
      if (!str) return "";
      // Ensure first character is uppercase and the rest are lowercase
      // Works with diacritics like ñ/Ñ as JS string case methods are Unicode-aware
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Handle "Enter" key: just close the keyboard
    if (key === "Enter") {
      hideKeyboard();
      return;
    }

    // Field-specific validation and formatting
    if (inputName === "studentLrn") {
      // enforce digits only and max length 12
      value = (value || "").toString().replace(/\D/g, "");
      if (key === "Clear") {
        value = "";
        cursorPos = 0;
      } else if (key === "Backspace") {
        if (value.length > 0) {
          value = value.slice(0, value.length - 1);
          cursorPos = value.length;
        }
      } else if (/[0-9]/.test(key)) {
        if (value.length < 12) {
          value = value + key;
          cursorPos = value.length;
        } else {
          // ignore when at max length
          return;
        }
      } else {
        // ignore non-digit keys for studentLrn
        return;
      }
    } else if (inputName === "grade") {
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
    } else if (
      inputName === "firstName" ||
      inputName === "lastName" ||
      inputName === "middleName"
    ) {
      if (key === "Clear") {
        value = "";
      } else if (key === "Backspace") {
        if (cursorPos > 0) {
          value = value.slice(0, cursorPos - 1);
          cursorPos -= 1;
        }
      } else if (!/[0-9]/.test(key)) {
        value = value + key;
        value = capitalizeFirstLetter(value); // <-- capitalize first letter
        cursorPos = value.length;
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
        value = (value + key).replace(/\s/g, "");
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
        target: { name: inputName, value },
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

  // Expose current target input value to consumers (e.g., keyboard UI)
  const getTargetValue = () => {
    if (!targetInput || !targetInput.input) return "";
    return targetInput.input.value || "";
  };

  return (
    <KeyboardContext.Provider
      value={{
        isVisible,
        showKeyboard,
        hideKeyboard,
        handleKeyPress,
        getTargetValue,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => useContext(KeyboardContext);
