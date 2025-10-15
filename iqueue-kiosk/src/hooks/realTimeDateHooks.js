import { useState, useEffect } from "react";

export const useDateTime = (locale = "en-US") => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Date: "May 29, 2025"
  const dateString = now.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  // Time: "8:30 AM"
  const timeString = now.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { now, dateString, timeString };
};
