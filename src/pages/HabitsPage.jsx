import { useMemo, useState } from "react";
import { HABITS } from "../lib/constants.js";
import { ymd, addDays, startOfWeekMonday } from "../lib/dates.js";
import { bestStreakForHabit, currentStreakEndingOn } from "../lib/habits.js";
import { useWeekData } from "../hooks/useDb.js";

function buildHeatmapWeeks(allData, today) {
  // Build 52 weeks of data ending on today's week
  const weeks = [];
  const endWeek = startOfWeekMonday(today);
  for (let w = 51; w >= 0; w--) {
    const ws = addDays(endWeek, -7 * w);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(ws, d);
      const key = ymd(date);
      const entry = allData?.[key];
      let done = 0;
      if (entry?.habits) {
        for (const h of HABITS) if (entry.habits[h]) done++;
      }
      const pct = HABITS.length ? Math.round((done / HABITS.length) * 100) : 0;
      const isFuture = date > today;
      days.push({ key, pct, isFuture, date });
    }
    weeks.push(days);
  }
  return weeks;
}

function heatColor(pct, isFuture) {
  if (isFuture) return "var(--border)";
  if (pct === 0) return "var(--bg)";
  if (pct < 25) return "#c6e48b";
  if (pct < 50) return "#7bc96f";
  if (pct < 75) return "#239a3b";
  return "#196127";
}

export default function HabitsPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);
  const [view, setView] = useState("matrix"); // "matrix" | "heatmap" | "monthly"
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const { weekData, allData, loading, saveDay } = useWeekData(weekStart);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const goPrev = () => setWeekStart((d) => addDays(d, -7));
  const goNext = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(today));

  // Weekly stats per habit
  const habitStats = useMemo(() => {
    return HABITS.map((h) => {
      let weekDone = 0;
      for (const d of weekDates) {
        const key = ymd(d);
        if (weekData[key]?.habits?.[h]) weekDone++;
      }
      const streak = currentStreakEndingOn(allData, todayStr, h);
      const best = bestStreakForHabit(allData, h);
      return { name: h, weekDone, streak, best };
    });
  }, [weekData, allData, weekDates, todayStr]);

  // Overall weekly completion
  const overallStats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const d of weekDates) {
      const key = ymd(d);
      const entry = weekData[key];
      for (const h of HABITS) {
        total++;
        if (entry?.habits?.[h]) done++;
      }
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [weekData, weekDates]);

  // Per-day completion
  const dayStats = useMemo(() => {
    return weekDates.map((d) => {
      const key = ymd(d);
      const entry = weekData[key];
      let done = 0;
      for (const h of HABITS) if (entry?.habits?.[h]) done++;
      return { date: d, dateStr: key, done, pct: Math.round((done / HABITS.length) * 100) };
    });
  }, [weekData, weekDates]);

  const toggleHabit = (dateStr, habit) => {
    const entry = weekData[dateStr] || {
      date: dateStr, tab: "planner", grateful: "", feel: "", goal: "",
      agenda: {}, top3: ["", "", ""], notes: "",
      wins: ["", "", ""], rating: 3, habits: {},
      nutrition: { calories: "", protein: "", carbs: "", fat: "" },
    };
    const habits = { ...(entry.habits || {}) };
    habits[habit] = !habits[habit];
    saveDay(dateStr, { ...entry, habits });
  };

  const weekRange = (() => {
    const mon = weekStart;
    const sun = addDays(weekStart, 6);
    const l = mon.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const r = sun.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${l} — ${r}`;
  })();

  // Heatmap data (52 weeks)
  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(allData, today), [allData, today]);

  // Streak milestones
  const streakMilestones = useMemo(() => {
    const milestones = [];
    for (const h of HABITS) {
      const streak = currentStreakEndingOn(allData, todayStr, h);
      const best = bestStreakForHabit(allData, h);
      if (streak >= 7) milestones.push({ habit: h, streak, best, type: "active" });
    }
    milestones.sort((a, b) => b.streak - a.streak);
    return milestones;
  }, [allData, todayStr]);

  // --- MONTHLY CHART ---
  const monthDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const startPad = firstDow === 0 ? 6 : firstDow - 1;

    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = ymd(date);
      const entry = allData?.[key];
      let done = 0;
      if (entry?.habits) {
        for (const h of HABITS) if (entry.habits[h]) done++;
      }
      const pct = HABITS.length ? Math.round((done / HABITS.length) * 100) : 0;
      const isFuture = date > today;
      days.push({
        key, day: d, done, pct,
        metGoal: pct === 100 && HABITS.length > 0,
        hasData: done > 0,
        isFuture,
        isToday: key === todayStr,
      });
    }
    return days;
  }, [monthDate, allData, today, todayStr]);

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const canNextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1) <= today;

  const monthStats = useMemo(() => {
    const valid = monthDays.filter(d => d && !d.isFuture);
    const tracked = valid.filter(d => d.hasData);
    const perfect = valid.filter(d => d.metGoal);
    const avgPct = tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + d.pct, 0) / tracked.length) : 0;
    return { tracked: tracked.length, perfect: perfect.length, avgPct };
  }, [monthDays]);

  // Overall streak (all habits 100% day)
  const overallStreak = useMemo(() => {
    let streak = 0;
    let cursor = today;
    while (true) {
      const key = ymd(cursor);
      const entry = allData?.[key];
      let allDone = true;
      for (const h of HABITS) {
        if (!entry?.habits?.[h]) { allDone = false; break; }
      }
      if (!allDone) break;
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [allData, today]);

  // Total days with any habits logged
  const totalActiveDays = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(allData || {})) {
      const entry = allData[key];
      if (entry?.habits) {
        for (const h of HABITS) {
          if (entry.habits[h]) { count++; break; }
        }
      }
    }
    return count;
  }, [allData]);

  return (
    <div className="habitsPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Habits</h1>
          <div className="weekBadge">{overallStats.pct}% this week</div>
        </div>
        <div className="nav">
          <div className="hbViewToggle">
            <button className={`btn ${view === "matrix" ? "btnPrimary" : ""}`} onClick={() => setView("matrix")}>Matrix</button>
            <button className={`btn ${view === "monthly" ? "btnPrimary" : ""}`} onClick={() => setView("monthly")}>Monthly</button>
            <button className={`btn ${view === "heatmap" ? "btnPrimary" : ""}`} onClick={() => setView("heatmap")}>Streaks</button>
          </div>
          {view === "matrix" && (
            <>
              <button className="btn" onClick={goPrev} aria-label="Previous week">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="range">{weekRange}</div>
              <button className="btn" onClick={goNext} aria-label="Next week">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
              <button className="btn btnPrimary" onClick={goToday}>Today</button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading...</div>
      ) : view === "monthly" ? (
        <div className="habitsContent" style={{ maxWidth: 640 }}>
          <div className="waterMonthChart">
            <div className="waterChartHeader">
              <button className="waterChartNavBtn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))} type="button">&lsaquo;</button>
              <div className="waterWeekTitle">{monthLabel}</div>
              <button className="waterChartNavBtn" onClick={() => canNextMonth && setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))} disabled={!canNextMonth} type="button">&rsaquo;</button>
            </div>

            <div className="waterMonthStats">
              <div className="waterMonthStat">
                <div className="waterMonthStatNum">{monthStats.tracked}</div>
                <div className="waterMonthStatLabel">Active days</div>
              </div>
              <div className="waterMonthStat">
                <div className="waterMonthStatNum waterMonthStatGoal">{monthStats.perfect}</div>
                <div className="waterMonthStatLabel">Perfect days</div>
              </div>
              <div className="waterMonthStat">
                <div className="waterMonthStatNum">{monthStats.avgPct}%</div>
                <div className="waterMonthStatLabel">Avg completion</div>
              </div>
            </div>

            <div className="waterMonthGrid">
              <div className="waterMonthDow">Mon</div>
              <div className="waterMonthDow">Tue</div>
              <div className="waterMonthDow">Wed</div>
              <div className="waterMonthDow">Thu</div>
              <div className="waterMonthDow">Fri</div>
              <div className="waterMonthDow">Sat</div>
              <div className="waterMonthDow">Sun</div>
              {monthDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="waterMonthCell waterMonthCellEmpty" />;
                return (
                  <div
                    key={day.key}
                    className={[
                      "waterMonthCell",
                      day.isFuture ? "waterMonthCellFuture" : "",
                      day.isToday ? "waterMonthCellToday" : "",
                      day.metGoal ? "waterMonthCellGoal" : "",
                      day.hasData && !day.metGoal ? "waterMonthCellPartial" : "",
                      !day.hasData && !day.isFuture ? "waterMonthCellMissed" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <div className="waterMonthCellDay">{day.day}</div>
                    {!day.isFuture && day.hasData && (
                      <div className="waterMonthCellGlasses">{day.pct}%</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="waterChartLegend">
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> 100% complete</span>
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Partial</span>
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendMissed" /> No data</span>
            </div>
          </div>
        </div>
      ) : view === "heatmap" ? (
        <div className="habitsContent">
          {/* Streak Stats Cards */}
          <div className="hbStreakCards">
            <div className="hbStreakCard">
              <div className="hbStreakCardValue">{overallStreak}</div>
              <div className="hbStreakCardLabel">Perfect Day Streak</div>
            </div>
            <div className="hbStreakCard">
              <div className="hbStreakCardValue">{totalActiveDays}</div>
              <div className="hbStreakCardLabel">Total Active Days</div>
            </div>
            <div className="hbStreakCard">
              <div className="hbStreakCardValue">{overallStats.pct}%</div>
              <div className="hbStreakCardLabel">This Week</div>
            </div>
          </div>

          {/* GitHub-style Heatmap */}
          <div className="hbHeatmapSection">
            <div className="hbHeatmapTitle">Contribution Heatmap — Last 52 Weeks</div>
            <div className="hbHeatmap">
              <div className="hbHeatmapDayLabels">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
              <div className="hbHeatmapGrid">
                {heatmapWeeks.map((week, wi) => (
                  <div className="hbHeatmapCol" key={wi}>
                    {week.map((day) => (
                      <div
                        key={day.key}
                        className="hbHeatmapCell"
                        style={{ backgroundColor: heatColor(day.pct, day.isFuture) }}
                        title={`${day.key}: ${day.pct}%`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="hbHeatmapLegend">
              <span>Less</span>
              <div className="hbHeatmapCell" style={{ backgroundColor: "var(--bg)" }} />
              <div className="hbHeatmapCell" style={{ backgroundColor: "#c6e48b" }} />
              <div className="hbHeatmapCell" style={{ backgroundColor: "#7bc96f" }} />
              <div className="hbHeatmapCell" style={{ backgroundColor: "#239a3b" }} />
              <div className="hbHeatmapCell" style={{ backgroundColor: "#196127" }} />
              <span>More</span>
            </div>
          </div>

          {/* Active Streak Milestones */}
          {streakMilestones.length > 0 && (
            <div className="hbMilestones">
              <div className="hbMilestonesTitle">Active Streaks (7+ days)</div>
              {streakMilestones.map((m) => (
                <div className="hbMilestoneRow" key={m.habit}>
                  <div className="hbMilestoneName">{m.habit}</div>
                  <div className="hbMilestoneStreak">🔥 {m.streak} days</div>
                  <div className="hbMilestoneBest">Best: {m.best}</div>
                  <div className="hbMilestoneBar">
                    <div className="progressBar">
                      <div className="progressFill" style={{ width: `${Math.min(100, (m.streak / Math.max(m.best, 30)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per-habit streak list */}
          <div className="hbStreakList">
            <div className="hbStreakListTitle">All Habits</div>
            {HABITS.map((h) => {
              const streak = currentStreakEndingOn(allData, todayStr, h);
              const best = bestStreakForHabit(allData, h);
              return (
                <div className="hbStreakListRow" key={h}>
                  <div className="hbStreakListName">{h}</div>
                  <div className="hbStreakListBadges">
                    <span className="hbStreakBadge">🔥 {streak}</span>
                    <span className="hbBestBadge">🏆 {best}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="habitsContent">
          {/* Daily completion bar chart */}
          <div className="hbDayBars">
            {dayStats.map((ds) => (
              <div className="hbDayBar" key={ds.dateStr}>
                <div className="hbBarTrack">
                  <div
                    className="hbBarFill"
                    style={{ height: `${ds.pct}%` }}
                  />
                </div>
                <div className="hbBarLabel">
                  {ds.date.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="hbBarPct">{ds.pct}%</div>
              </div>
            ))}
          </div>

          {/* Habit matrix */}
          <div className="hbMatrix">
            <div className="hbMatrixHeader">
              <div className="hbMatrixName">Habit</div>
              {weekDates.map((d) => (
                <div className="hbMatrixDay" key={ymd(d)}>
                  {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                </div>
              ))}
              <div className="hbMatrixStat">Streak</div>
              <div className="hbMatrixStat">Best</div>
              <div className="hbMatrixStat">Week</div>
            </div>

            {habitStats.map((hs) => (
              <div className="hbMatrixRow" key={hs.name}>
                <div className="hbMatrixName" title={hs.name}>{hs.name}</div>
                {weekDates.map((d) => {
                  const key = ymd(d);
                  const checked = !!weekData[key]?.habits?.[hs.name];
                  const isToday = key === todayStr;
                  return (
                    <button
                      className={`hbMatrixCell ${checked ? "hbCellDone" : ""} ${isToday ? "hbCellToday" : ""}`}
                      key={key}
                      onClick={() => toggleHabit(key, hs.name)}
                      type="button"
                    >
                      {checked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                <div className="hbMatrixStat hbStatStreak">
                  {hs.streak > 0 ? `🔥 ${hs.streak}` : "—"}
                </div>
                <div className="hbMatrixStat hbStatBest">
                  {hs.best > 0 ? `🏆 ${hs.best}` : "—"}
                </div>
                <div className="hbMatrixStat hbStatWeek">
                  {hs.weekDone}/{7}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
