import { useEffect, useState, useRef } from "react";
import { getAllOfficeFullData } from "../services/dbServices/officeKioskService";

export function useRealtimeOffices(refreshInterval = 5000) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstLoad = useRef(true); // track first fetch only

  useEffect(() => {
    let intervalId;

    const fetchData = async () => {
      try {
        if (firstLoad.current) setLoading(true); // only show loading spinner once
        const data = await getAllOfficeFullData();
        setOffices((prev) => {
          // update only if data changed to prevent useless re-renders
          const jsonPrev = JSON.stringify(prev);
          const jsonNew = JSON.stringify(data);
          return jsonPrev !== jsonNew ? data : prev;
        });
      } catch (err) {
        console.error("Error fetching offices:", err);
        setError("Failed to fetch office data.");
      } finally {
        if (firstLoad.current) {
          setLoading(false);
          firstLoad.current = false;
        }
      }
    };

    fetchData(); // initial load
    intervalId = setInterval(fetchData, refreshInterval); // auto-refresh

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return { offices, loading, error };
}
