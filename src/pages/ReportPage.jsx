import { useEffect, useMemo, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";
import { HABITS } from "../lib/constants.js";
import { useHabits } from "../hooks/useHabits.js";

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
  const { habits: HABITS_LIST } = useHabits();
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState("week"); // "week" | "month" | "90d"
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
    if (mode === "90d") {
      const s = ymd(addDays(today, -89));
      const e = ymd(today);
      return { start: s, end: e };
    }
    const s = `${monthYear}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(monthYear, monthNum, 0).getDate();
    const e = `${monthYear}-${String(monthNum).padStart(2, "0")}-${lastDay}`;
    return { start: s, end: e };
  }, [mode, weekStart, monthYear, monthNum, today]);

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

  // Build list of all days in range for trend charts
  const rangeDays = useMemo(() => {
    if (!range.start || !range.end) return [];
    const days = [];
    const startDate = new Date(range.start + "T00:00:00");
    const endDate = new Date(range.end + "T00:00:00");
    let cur = new Date(startDate);
    while (cur <= endDate) {
      days.push(ymd(cur));
      cur = addDays(cur, 1);
    }
    return days;
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
        for (const h of HABITS_LIST) {
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
  }, [HABITS_LIST, data, range]);

  // Compute trend chart data
  const trendData = useMemo(() => {
    if (!data || !rangeDays.length) return null;
    const entries = data.entries || {};
    const sleepLogs = data.sleep || [];
    const sleepByDate = {};
    for (const s of sleepLogs) sleepByDate[s.date] = s.hours || 0;

    // Habit completion % per day
    const habitBars = rangeDays.map(d => {
      const e = entries[d];
      if (!e?.habits) return { date: d, pct: 0 };
      let total = 0, done = 0;
      for (const h of HABITS_LIST) {
        total++;
        if (e.habits[h]) done++;
      }
      return { date: d, pct: total ? Math.round((done / total) * 100) : 0 };
    });

    // Weight per day (from entries bodyStats or weight field)
    const weightPoints = rangeDays.map(d => {
      const e = entries[d];
      const w = e?.weight || e?.bodyStats?.weight || null;
      return { date: d, value: w ? Number(w) : null };
    }).filter(p => p.value !== null);

    // Daily rating per day
    const ratingBars = rangeDays.map(d => {
      const e = entries[d];
      return { date: d, value: e?.rating || 0 };
    });

    // Sleep duration per day
    const sleepBars = rangeDays.map(d => ({
      date: d,
      value: sleepByDate[d] || 0,
    }));

    return { habitBars, weightPoints, ratingBars, sleepBars };
  }, [data, rangeDays, HABITS_LIST]);

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
    : mode === "90d"
    ? `${addDays(today, -89).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — ${today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : `${MONTH_NAMES[monthNum - 1]} ${monthYear}`;

  return (
    <div className="reportPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Report</h1>
          <div className="weekBadge">{mode === "week" ? "Weekly" : mode === "month" ? "Monthly" : "90 Days"}</div>
        </div>
        <div className="nav">
          <div className="hbViewToggle">
            <button className={`btn ${mode === "week" ? "btnPrimary" : ""}`} onClick={() => setMode("week")}>Week</button>
            <button className={`btn ${mode === "month" ? "btnPrimary" : ""}`} onClick={() => setMode("month")}>Month</button>
            <button className={`btn ${mode === "90d" ? "btnPrimary" : ""}`} onClick={() => setMode("90d")}>90d</button>
          </div>
          {mode !== "90d" && (
            <button className="btn" onClick={goPrev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          <div className="range">{rangeLabel}</div>
          {mode !== "90d" && (
            <>
              <button className="btn" onClick={goNext}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
              <button className="btn btnPrimary" onClick={goCurrent}>Current</button>
            </>
          )}
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

          {/* Trend Charts */}
          {trendData && (
            <div className="reportTrends">
              <h2 className="reportTrendsTitle">Trends</h2>

              {/* Habit Completion */}
              <div className="rptChart">
                <div className="rptChartTitle">Habit Completion</div>
                <div className="rptChartBars">
                  {trendData.habitBars.map(d => {
                    const color = d.pct < 50 ? "#e74c3c" : d.pct < 80 ? "#f0ad4e" : "#27ae60";
                    const shortDate = d.date.slice(5);
                    return (
                      <div key={d.date} className="rptChartBar" style={{ height: `${d.pct}%`, backgroundColor: color }} title={`${d.date}: ${d.pct}%`}>
                        <span className="rptChartBarLabel">{shortDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weight */}
              {trendData.weightPoints.length > 1 && (
                <div className="rptChart">
                  <div className="rptChartTitle">Weight</div>
                  <div className="rptLineChart">
                    {(() => {
                      const pts = trendData.weightPoints;
                      const vals = pts.map(p => p.value);
                      const min = Math.min(...vals);
                      const max = Math.max(...vals);
                      const spread = max - min || 1;
                      return pts.map((p, i) => {
                        const pct = ((p.value - min) / spread) * 80 + 10; // 10-90% range
                        const left = pts.length > 1 ? (i / (pts.length - 1)) * 100 : 50;
                        return (
                          <div key={p.date} className="rptLineDot" style={{ bottom: `${pct}%`, left: `${left}%` }} title={`${p.date}: ${p.value} lbs`}>
                            {i < pts.length - 1 && (() => {
                              const nextPct = ((pts[i + 1].value - min) / spread) * 80 + 10;
                              const nextLeft = ((i + 1) / (pts.length - 1)) * 100;
                              const dx = nextLeft - left;
                              const dy = nextPct - pct;
                              const len = Math.sqrt(dx * dx + dy * dy);
                              const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
                              return <div className="rptLineSeg" style={{ width: `${len}%`, transform: `rotate(${angle}deg)`, transformOrigin: "0 50%" }} />;
                            })()}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Daily Rating */}
              <div className="rptChart">
                <div className="rptChartTitle">Daily Rating</div>
                <div className="rptChartBars">
                  {trendData.ratingBars.map(d => {
                    const pct = (d.value / 5) * 100;
                    const color = d.value <= 2 ? "#e74c3c" : d.value <= 3 ? "#f0ad4e" : "#5B7CF5";
                    const shortDate = d.date.slice(5);
                    return (
                      <div key={d.date} className="rptChartBar" style={{ height: `${pct}%`, backgroundColor: d.value ? color : "transparent" }} title={`${d.date}: ${d.value}/5`}>
                        <span className="rptChartBarLabel">{shortDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Duration */}
              <div className="rptChart">
                <div className="rptChartTitle">Sleep Duration</div>
                <div className="rptChartBars">
                  {trendData.sleepBars.map(d => {
                    const pct = Math.min((d.value / 10) * 100, 100);
                    const color = d.value < 6 ? "#e74c3c" : d.value < 7 ? "#f0ad4e" : "#27ae60";
                    const shortDate = d.date.slice(5);
                    return (
                      <div key={d.date} className="rptChartBar" style={{ height: `${pct}%`, backgroundColor: d.value ? color : "transparent" }} title={`${d.date}: ${d.value}h`}>
                        <span className="rptChartBarLabel">{shortDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .reportTrends {
          margin-top: 24px;
        }
        .reportTrendsTitle {
          font-size: 18px;
          font-weight: 700;
          color: #3a3226;
          margin-bottom: 16px;
        }
        .rptChart {
          background: #fbf7f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #ece6d9;
        }
        .rptChartTitle {
          font-size: 14px;
          font-weight: 600;
          color: #6b5e50;
          margin-bottom: 12px;
        }
        .rptChartBars {
          display: flex;
          align-items: flex-end;
          gap: 1px;
          height: 160px;
          padding-bottom: 18px;
          position: relative;
        }
        .rptChartBar {
          flex: 1 1 0;
          min-width: 3px;
          max-width: 20px;
          border-radius: 3px 3px 0 0;
          position: relative;
          transition: opacity 0.15s;
          cursor: pointer;
        }
        .rptChartBar:hover {
          opacity: 0.8;
        }
        .rptChartBarLabel {
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 7px;
          color: #9b8e7e;
          white-space: nowrap;
          display: none;
        }
        .rptChartBar:hover .rptChartBarLabel {
          display: block;
        }
        .rptLineChart {
          height: 160px;
          position: relative;
          margin: 0 8px;
        }
        .rptLineDot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #5B7CF5;
          border-radius: 50%;
          transform: translate(-50%, 50%);
          z-index: 2;
          cursor: pointer;
        }
        .rptLineDot:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          background: #3a3226;
          color: #fff;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 10;
        }
        .rptLineSeg {
          position: absolute;
          height: 2px;
          background: #5B7CF5;
          top: 50%;
          left: 50%;
          transform-origin: 0 50%;
          z-index: 1;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
