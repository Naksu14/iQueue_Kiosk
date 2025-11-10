// 📅 src/utils/formatDate.js
export const formatDate = (isoDate, options = {}) => {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  // Get formatted parts (no "at")
  const parts = new Intl.DateTimeFormat("en-PH", defaultOptions).formatToParts(date);

  const month = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;
  const year = parts.find(p => p.type === "year")?.value;
  const hour = parts.find(p => p.type === "hour")?.value;
  const minute = parts.find(p => p.type === "minute")?.value;
  const dayPeriod = parts.find(p => p.type === "dayPeriod")?.value?.toUpperCase() || " |";

  return `${month} ${day}, ${year} | ${hour}:${minute} ${dayPeriod}`.trim();
};


// 🗓️ Only the date (e.g., October 18, 2025)
export const formatShortDate = (isoDate) =>
  formatDate(isoDate, { hour: undefined, minute: undefined });

// ⏰ Only the time (e.g., 1:27 PM)
export const formatTime = (isoDate) =>
  formatDate(isoDate, {
    year: undefined,
    month: undefined,
    day: undefined,
  });
