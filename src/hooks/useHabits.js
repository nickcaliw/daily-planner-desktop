import { useCallback, useEffect, useState } from "react";
import { HABITS as DEFAULT_HABITS } from "../lib/constants.js";

const settingsApi = typeof window !== "undefined" ? window.settingsApi : null;
const STORAGE_KEY = "custom_habits";

/**
 * Hook to load/save user-configurable habits.
 * Falls back to the default hardcoded list if none are saved.
 * Returns { habits, setHabits, loading, addHabit, removeHabit, reorderHabits, renameHabit }
 */
export function useHabits() {
  const [habits, setHabitsState] = useState(DEFAULT_HABITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (settingsApi) {
        const raw = await settingsApi.get(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHabitsState(parsed);
            }
          } catch { /* use defaults */ }
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const persist = useCallback((next) => {
    setHabitsState(next);
    if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addHabit = useCallback((name) => {
    if (!name.trim()) return;
    persist(prev => {
      const next = [...prev, name.trim()];
      if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  const removeHabit = useCallback((name) => {
    persist(prev => {
      const next = prev.filter(h => h !== name);
      if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  const renameHabit = useCallback((oldName, newName) => {
    if (!newName.trim()) return;
    persist(prev => {
      const next = prev.map(h => h === oldName ? newName.trim() : h);
      if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  const reorderHabits = useCallback((newOrder) => {
    persist(newOrder);
    if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(newOrder));
  }, [persist]);

  const setHabits = useCallback((newList) => {
    persist(newList);
    if (settingsApi) settingsApi.set(STORAGE_KEY, JSON.stringify(newList));
  }, [persist]);

  return { habits, setHabits, loading, addHabit, removeHabit, renameHabit, reorderHabits };
}
