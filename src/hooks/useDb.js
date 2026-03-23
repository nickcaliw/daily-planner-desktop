import { useCallback, useEffect, useRef, useState } from "react";
import { ymd, addDays } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.plannerApi : null;

/**
 * Manages week data backed by SQLite (via Electron IPC).
 * Falls back to localStorage when running in a plain browser.
 */
export function useWeekData(weekStart) {
  const [weekData, setWeekData] = useState({});
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef({});

  // Load the visible week + all data (for streak calculations)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (api) {
        const startStr = ymd(weekStart);
        const endStr = ymd(addDays(weekStart, 6));
        // Also load yesterday/tomorrow for 3-day view
        const now = new Date();
        const threeDayStart = ymd(addDays(now, -1));
        const threeDayEnd = ymd(addDays(now, 1));
        const [range, threeDay, all] = await Promise.all([
          api.getRange(startStr, endStr),
          api.getRange(threeDayStart, threeDayEnd),
          api.getAll(),
        ]);
        if (!cancelled) {
          setWeekData({ ...(range || {}), ...(threeDay || {}) });
          setAllData(all || {});
          setLoading(false);
        }
      } else {
        // Fallback: localStorage
        try {
          const raw = localStorage.getItem("weekly_planner_v2");
          const parsed = raw ? JSON.parse(raw) : {};
          if (!cancelled) {
            setAllData(parsed);
            // Filter to just this week
            const week = {};
            for (let i = 0; i < 7; i++) {
              const key = ymd(addDays(weekStart, i));
              if (parsed[key]) week[key] = parsed[key];
            }
            setWeekData(week);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setWeekData({});
            setAllData({});
            setLoading(false);
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [weekStart]);

  // Save a single day (debounced per date key)
  const saveDay = useCallback((dateStr, entry) => {
    // Update local state immediately
    setWeekData((prev) => ({ ...prev, [dateStr]: entry }));
    setAllData((prev) => ({ ...prev, [dateStr]: entry }));

    // Debounce the actual persist
    if (saveTimers.current[dateStr]) {
      clearTimeout(saveTimers.current[dateStr]);
    }
    saveTimers.current[dateStr] = setTimeout(() => {
      if (api) {
        api.saveDay(dateStr, entry);
      } else {
        // localStorage fallback: merge into full blob
        try {
          const raw = localStorage.getItem("weekly_planner_v2");
          const all = raw ? JSON.parse(raw) : {};
          all[dateStr] = entry;
          localStorage.setItem("weekly_planner_v2", JSON.stringify(all));
        } catch {}
      }
    }, 300);
  }, []);

  return { weekData, allData, loading, saveDay };
}
