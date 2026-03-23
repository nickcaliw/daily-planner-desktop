import { useEffect, useState } from "react";
import { ymd } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.plannerApi : null;

/**
 * Loads all planner entries for a given month (plus overflow days visible in the grid).
 * Returns { data, loading, setData }.
 */
export function useMonthData(year, month) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const start = new Date(year, month - 1, -6);
      const end = new Date(year, month, 7);
      const startStr = ymd(start);
      const endStr = ymd(end);

      if (api) {
        const range = await api.getRange(startStr, endStr);
        if (!cancelled) {
          setData(range || {});
          setLoading(false);
        }
      } else {
        try {
          const raw = localStorage.getItem("weekly_planner_v2");
          const all = raw ? JSON.parse(raw) : {};
          const filtered = {};
          for (const [k, v] of Object.entries(all)) {
            if (k >= startStr && k <= endStr) filtered[k] = v;
          }
          if (!cancelled) {
            setData(filtered);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setData({});
            setLoading(false);
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, month]);

  return { data, loading, setData };
}
