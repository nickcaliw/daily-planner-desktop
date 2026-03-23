import { HABITS } from "./constants.js";
import { ymd, addDays, parseYMD } from "./dates.js";

export function defaultHabits() {
  const obj = {};
  HABITS.forEach((h) => (obj[h] = false));
  return obj;
}

export function progressFor(day) {
  const habits = day?.habits || {};
  const total = HABITS.length;
  let done = 0;
  for (const h of HABITS) if (habits[h]) done++;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

export function currentStreakEndingOn(allData, dateStr, habitName) {
  let streak = 0;
  let cursor = parseYMD(dateStr);
  while (true) {
    const key = ymd(cursor);
    const entry = allData?.[key];
    if (!entry?.habits?.[habitName]) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreakForHabit(allData, habitName) {
  const keys = Object.keys(allData || {}).sort();
  let best = 0;
  let run = 0;
  for (const k of keys) {
    if (allData?.[k]?.habits?.[habitName]) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}
