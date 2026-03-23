import { useEffect, useMemo, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";
import { HABITS } from "../lib/constants.js";

const plannerApi = typeof window !== "undefined" ? window.plannerApi : null;
const workoutApi = typeof window !== "undefined" ? window.workoutApi : null;
const journalApi = typeof window !== "undefined" ? window.journalApi : null;
const goalsApi = typeof window !== "undefined" ? window.goalsApi : null;
const focusApi = typeof window !== "undefined" ? window.focusApi : null;
const sleepApi = typeof window !== "undefined" ? window.sleepApi : null;
const waterApi = typeof window !== "undefined" ? window.waterApi : null;
const meditationApi = typeof window !== "undefined" ? window.meditationApi : null;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportPage() {
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState("week"); // "week" | "month"
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const [monthYear, setMonthYear] = useState(() => today.getFullYear());
  const [monthNum, setMonthNum] = useState(() => today.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (mode === "week") {
      const s = ymd(weekStart);
      const e = ymd(addDays(weekStart, 6));
      return { start: s, end: e };
    }
    const s = `${monthYear}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(monthYear, monthNum, 0).getDate();
    const e = `${monthYear}-${String(monthNum).padStart(2, "0")}-${lastDay}`;
    return { start: s, end: e };
  }, [mode, weekStart, monthYear, monthNum]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { start, end } = range;
      const results = {};

      if (plannerApi) {
        results.entries = await plannerApi.getRange(start, end) || {};
      }
      if (workoutApi) {
        results.workouts = await workoutApi.getRange(start, end) || {};
      }
      if (journalApi) {
        results.journals = await journalApi.list() || [];
      }
      if (goalsApi) {
        results.goals = await goalsApi.list() || [];
      }
      if (focusApi) {
        results.focus = await focusApi.getRange(start, end) || [];
      }
      if (sleepApi) {
        results.sleep = await sleepApi.range(start, end) || [];
      }
      if (waterApi) {
        results.water = await waterApi.range(start, end) || [];
      }
      if (meditationApi) {
        results.meditation = await meditationApi.range(start, end) || [];
      }

      setData(results);
      setLoading(false);
    }
    load();
  }, [range]);

  // Compute stats
  const stats = useMemo(() => {
    if (!data) return null;
    const entries = data.entries || {};
    const entryKeys = Object.keys(entries);
    const daysLogged = entryKeys.length;

    // Habits
    let habitTotal = 0, habitDone = 0;
    for (const key of entryKeys) {
      const e = entries[key];
      if (e?.habits) {
        for (const h of HABITS) {
          habitTotal++;
          if (e.habits[h]) habitDone++;
        }
      }
    }
    const habitPct = habitTotal ? Math.round((habitDone / habitTotal) * 100) : 0;

    // Rating
    let ratingSum = 0, ratingCount = 0;
    for (const key of entryKeys) {
      const r = entries[key]?.rating;
      if (r && r > 0) { ratingSum += r; ratingCount++; }
    }
    const avgRating = ratingCount ? (ratingSum / ratingCount).toFixed(1) : "—";

    // Nutrition
    let nutCount = 0;
    let nutTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const key of entryKeys) {
      const n = entries[key]?.nutrition;
      if (n && (n.calories || n.protein || n.carbs || n.fat)) {
        nutCount++;
        nutTotals.calories += Number(n.calories) || 0;
        nutTotals.protein += Number(n.protein) || 0;
        nutTotals.carbs += Number(n.carbs) || 0;
        nutTotals.fat += Number(n.fat) || 0;
      }
    }
    const nutAvg = nutCount ? {
      calories: Math.round(nutTotals.calories / nutCount),
      protein: Math.round(nutTotals.protein / nutCount),
      carbs: Math.round(nutTotals.carbs / nutCount),
      fat: Math.round(nutTotals.fat / nutCount),
    } : null;

    // Workouts
    const workouts = data.workouts || {};
    const workoutDays = Object.keys(workouts).filter(k => workouts[k]?.completed).length;
    const totalWorkouts = Object.keys(workouts).length;

    // Journal
    const journals = (data.journals || []).filter(j => j.date >= range.start && j.date <= range.end);
    const journalDays = journals.length;

    // Focus
    const focusSessions = data.focus || [];
    const totalFocusMin = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const focusHours = (totalFocusMin / 60).toFixed(1);

    // Sleep
    const sleepLogs = data.sleep || [];
    let sleepTotal = 0;
    for (const s of sleepLogs) {
      sleepTotal += s.hours || 0;
    }
    const avgSleep = sleepLogs.length ? (sleepTotal / sleepLogs.length).toFixed(1) : "—";

    // Water
    const waterLogs = data.water || [];
    let waterTotal = 0, waterGoalMet = 0;
    for (const w of waterLogs) {
      waterTotal += w.glasses || 0;
      if ((w.glasses || 0) >= (w.goal || 8)) waterGoalMet++;
    }

    // Meditation
    const medLogs = data.meditation || [];
    const medMinutes = medLogs.reduce((sum, m) => sum + (m.minutes || 0), 0);
    const medSessions = medLogs.length;

    // Goals
    const goals = data.goals || [];
    const activeGoals = goals.filter(g => g.status !== "completed").length;
    const completedGoals = goals.filter(g => g.status === "completed").length;

    return {
      daysLogged, habitPct, habitDone, habitTotal,
      avgRating, nutAvg, nutCount,
      workoutDays, totalWorkouts,
      journalDays,
      focusSessions: focusSessions.length, focusHours,
      avgSleep, sleepDays: sleepLogs.length,
      waterTotal, waterGoalMet, waterDays: waterLogs.length,
      medMinutes, medSessions,
      activeGoals, completedGoals,
    };
  }, [data, range]);

  const goPrev = () => {
    if (mode === "week") setWeekStart(d => addDays(d, -7));
    else {
      if (monthNum === 1) { setMonthYear(y => y - 1); setMonthNum(12); }
      else setMonthNum(m => m - 1);
    }
  };
  const goNext = () => {
    if (mode === "week") setWeekStart(d => addDays(d, 7));
    else {
      if (monthNum === 12) { setMonthYear(y => y + 1); setMonthNum(1); }
      else setMonthNum(m => m + 1);
    }
  };
  const goCurrent = () => {
    if (mode === "week") setWeekStart(startOfWeekMonday(today));
    else { setMonthYear(today.getFullYear()); setMonthNum(today.getMonth() + 1); }
  };

  const rangeLabel = mode === "week"
    ? `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — ${addDays(weekStart, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : `${MONTH_NAMES[monthNum - 1]} ${monthYear}`;

  return (
    <div className="reportPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Report</h1>
          <div className="weekBadge">{mode === "week" ? "Weekly" : "Monthly"}</div>
        </div>
        <div className="nav">
          <div className="hbViewToggle">
            <button className={`btn ${mode === "week" ? "btnPrimary" : ""}`} onClick={() => setMode("week")}>Week</button>
            <button className={`btn ${mode === "month" ? "btnPrimary" : ""}`} onClick={() => setMode("month")}>Month</button>
          </div>
          <button className="btn" onClick={goPrev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="range">{rangeLabel}</div>
          <button className="btn" onClick={goNext}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          <button className="btn btnPrimary" onClick={goCurrent}>Current</button>
        </div>
      </div>

      {loading || !stats ? (
        <div className="loadingMsg">Generating report…</div>
      ) : (
        <div className="reportContent">
          {/* Overview Cards */}
          <div className="reportGrid">
            <div className="reportCard">
              <div className="reportCardIcon">📅</div>
              <div className="reportCardValue">{stats.daysLogged}</div>
              <div className="reportCardLabel">Days Logged</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">✅</div>
              <div className="reportCardValue">{stats.habitPct}%</div>
              <div className="reportCardLabel">Habit Completion</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">⭐</div>
              <div className="reportCardValue">{stats.avgRating}</div>
              <div className="reportCardLabel">Avg Day Rating</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">💪</div>
              <div className="reportCardValue">{stats.workoutDays}</div>
              <div className="reportCardLabel">Workouts Done</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">🎯</div>
              <div className="reportCardValue">{stats.focusHours}h</div>
              <div className="reportCardLabel">Focus Time</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">😴</div>
              <div className="reportCardValue">{stats.avgSleep}h</div>
              <div className="reportCardLabel">Avg Sleep</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">💧</div>
              <div className="reportCardValue">{stats.waterGoalMet}/{stats.waterDays}</div>
              <div className="reportCardLabel">Water Goals Met</div>
            </div>
            <div className="reportCard">
              <div className="reportCardIcon">🧘</div>
              <div className="reportCardValue">{stats.medMinutes}m</div>
              <div className="reportCardLabel">Meditation</div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="reportSections">
            {/* Habits */}
            <div className="reportSection">
              <div className="reportSectionTitle">Habits</div>
              <div className="reportSectionBody">
                <div className="reportProgressRow">
                  <div className="progressBar" style={{ height: 12 }}>
                    <div className="progressFill" style={{ width: `${stats.habitPct}%` }} />
                  </div>
                  <div className="reportProgressLabel">{stats.habitDone}/{stats.habitTotal} individual habits completed</div>
                </div>
              </div>
            </div>

            {/* Nutrition */}
            {stats.nutAvg && (
              <div className="reportSection">
                <div className="reportSectionTitle">Nutrition (Daily Avg over {stats.nutCount} days)</div>
                <div className="reportNutritionGrid">
                  <div className="reportNutItem">
                    <div className="reportNutValue">{stats.nutAvg.calories}</div>
                    <div className="reportNutLabel">Calories</div>
                  </div>
                  <div className="reportNutItem">
                    <div className="reportNutValue">{stats.nutAvg.protein}g</div>
                    <div className="reportNutLabel">Protein</div>
                  </div>
                  <div className="reportNutItem">
                    <div className="reportNutValue">{stats.nutAvg.carbs}g</div>
                    <div className="reportNutLabel">Carbs</div>
                  </div>
                  <div className="reportNutItem">
                    <div className="reportNutValue">{stats.nutAvg.fat}g</div>
                    <div className="reportNutLabel">Fat</div>
                  </div>
                </div>
              </div>
            )}

            {/* Journal & Goals */}
            <div className="reportSection">
              <div className="reportSectionTitle">Activity</div>
              <div className="reportActivityGrid">
                <div className="reportActivityItem">
                  <span className="reportActivityValue">{stats.journalDays}</span> journal entries
                </div>
                <div className="reportActivityItem">
                  <span className="reportActivityValue">{stats.focusSessions}</span> focus sessions
                </div>
                <div className="reportActivityItem">
                  <span className="reportActivityValue">{stats.medSessions}</span> meditation sessions
                </div>
                <div className="reportActivityItem">
                  <span className="reportActivityValue">{stats.activeGoals}</span> active goals
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
