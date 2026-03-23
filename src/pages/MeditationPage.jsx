import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";

const meditationApi = typeof window !== "undefined" ? window.meditationApi : null;
const SESSION_TYPES = ["Breathing", "Guided", "Body Scan", "Mindfulness", "Visualization", "Other"];
const MEDITATION_GOAL = 10; // minutes

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MeditationPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const dateStr = useMemo(() => ymd(currentDate), [currentDate]);

  const [minutes, setMinutes] = useState("");
  const [type, setType] = useState("Breathing");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const debounceRef = useRef(null);
  const [rangeData, setRangeData] = useState([]);

  // Chart
  const [chartView, setChartView] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const isToday = dateStr === todayStr;
  const goPrev = () => setCurrentDate(d => addDays(d, -1));
  const goNext = () => { const next = addDays(currentDate, 1); if (next <= today) setCurrentDate(next); };
  const goToday = () => setCurrentDate(new Date());

  const dateLabel = useMemo(() =>
    isToday ? "Today" : currentDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    [currentDate, isToday]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (meditationApi) {
      meditationApi.get(dateStr).then(data => {
        if (cancelled) return;
        setMinutes(data?.minutes != null ? String(data.minutes) : "");
        setType(data?.type || "Breathing");
        setNotes(data?.notes || "");
        setLoading(false);
      });
    } else setLoading(false);
    return () => { cancelled = true; };
  }, [dateStr]);

  // Load range data
  useEffect(() => {
    if (!meditationApi) return;
    const sixtyAgo = addDays(today, -60);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const earliest = monthStart < sixtyAgo ? monthStart : sixtyAgo;
    const weekStart = addDays(startOfWeekMonday(today), weekOffset * 7);
    const finalEarliest = weekStart < earliest ? weekStart : earliest;
    meditationApi.range(ymd(finalEarliest), todayStr).then(data => {
      setRangeData(data || []);
    });
  }, [today, todayStr, monthDate, weekOffset, minutes]);

  const save = useCallback((m, t, n) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (meditationApi) meditationApi.save(dateStr, { minutes: m ? Number(m) : 0, type: t, notes: n });
    }, 300);
  }, [dateStr]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const handleTimerStop = () => {
    setTimerRunning(false);
    if (elapsed > 0) {
      const elapsedMin = Math.max(1, Math.round(elapsed / 60));
      setMinutes(String(elapsedMin));
      save(String(elapsedMin), type, notes);
      setElapsed(0);
    }
  };

  // Build data lookup
  const byDate = useMemo(() => {
    const map = {};
    for (const entry of rangeData) {
      if (entry.date) map[entry.date] = entry;
    }
    map[dateStr] = { ...map[dateStr], minutes: minutes ? Number(minutes) : 0, type };
    return map;
  }, [rangeData, dateStr, minutes, type]);

  // --- WEEK CHART ---
  const weekChartMonday = useMemo(() => addDays(startOfWeekMonday(today), weekOffset * 7), [today, weekOffset]);

  const weekBars = useMemo(() => {
    const maxMin = Math.max(MEDITATION_GOAL, ...Object.values(byDate).map(e => e.minutes || 0));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekChartMonday, i);
      const key = ymd(d);
      const entry = byDate[key];
      const min = entry?.minutes || 0;
      const isFuture = d > today;
      return {
        key, label: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNum: d.getDate(), minutes: min,
        pct: maxMin > 0 ? Math.round((min / maxMin) * 100) : 0,
        metGoal: min >= MEDITATION_GOAL,
        isSelected: key === dateStr, isFuture,
      };
    });
  }, [byDate, weekChartMonday, today, dateStr]);

  const weekLabel = useMemo(() => {
    const sun = addDays(weekChartMonday, 6);
    return `${weekChartMonday.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${sun.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }, [weekChartMonday]);

  // Week stats
  const weekStats = useMemo(() => {
    let total = 0, count = 0;
    for (const bar of weekBars) {
      if (!bar.isFuture && bar.minutes > 0) { total += bar.minutes; count++; }
    }
    return { totalMinutes: total, sessions: count };
  }, [weekBars]);

  // --- MONTH CHART ---
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
      const entry = byDate[key];
      const min = entry?.minutes || 0;
      const isFuture = date > today;
      days.push({
        key, day: d, minutes: min,
        metGoal: min >= MEDITATION_GOAL,
        hasData: min > 0,
        isFuture, isSelected: key === dateStr, isToday: key === todayStr,
      });
    }
    return days;
  }, [monthDate, byDate, today, todayStr, dateStr]);

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const canNextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1) <= today;

  const monthStats = useMemo(() => {
    const valid = monthDays.filter(d => d && !d.isFuture);
    const tracked = valid.filter(d => d.hasData);
    const met = valid.filter(d => d.metGoal);
    const totalMin = tracked.reduce((s, d) => s + d.minutes, 0);
    return { tracked: tracked.length, metGoal: met.length, totalMinutes: totalMin };
  }, [monthDays]);

  const goToDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, d));
  };

  return (
    <div className="medPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Meditation</h1>
        </div>
        <div className="nav">
          <button className="btn" onClick={goPrev} aria-label="Previous day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="range">{dateLabel}</div>
          <button className="btn" onClick={goNext} disabled={isToday} aria-label="Next day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          {!isToday && <button className="btn btnPrimary" onClick={goToday}>Today</button>}
        </div>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading...</div>
      ) : (
        <div className="medContent">
          {/* Timer */}
          <div className="medTimer">
            <div className={`medTimerCircle ${timerRunning ? "medTimerPulse" : ""}`}>
              <div className="medTimerDisplay">{formatTimer(elapsed)}</div>
              <div className="medTimerLabel">{timerRunning ? "Meditating..." : "Ready"}</div>
            </div>
            <div className="medTimerControls">
              {!timerRunning ? (
                <button className="btn btnPrimary" onClick={() => setTimerRunning(true)} type="button">Start</button>
              ) : (
                <button className="btn" onClick={handleTimerStop} type="button">Stop</button>
              )}
              {!timerRunning && elapsed > 0 && (
                <button className="btn" onClick={() => setElapsed(0)} type="button">Reset</button>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="medForm">
            <div className="medFormRow">
              <div className="medFormLabel">Minutes</div>
              <input
                type="number" min="0" max="999" placeholder="0"
                className="medMinutesInput"
                value={minutes}
                onChange={e => { setMinutes(e.target.value); save(e.target.value, type, notes); }}
              />
            </div>
            <div className="medFormRow">
              <div className="medFormLabel">Type</div>
              <select className="medTypeSelect" value={type} onChange={e => { setType(e.target.value); save(minutes, e.target.value, notes); }}>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="medFormRow" style={{ alignItems: "flex-start" }}>
              <div className="medFormLabel">Notes</div>
              <textarea
                className="input"
                rows={3}
                placeholder="Session notes or reflections..."
                value={notes}
                onChange={e => { setNotes(e.target.value); save(minutes, type, e.target.value); }}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="medStats">
            <div className="medStatCard">
              <div className="medStatValue">{weekStats.totalMinutes}</div>
              <div className="medStatLabel">Week Minutes</div>
            </div>
            <div className="medStatCard">
              <div className="medStatValue">{weekStats.sessions}</div>
              <div className="medStatLabel">Sessions</div>
            </div>
          </div>

          {/* Chart Toggle */}
          <div className="waterChartToggle">
            <button className={`waterChartToggleBtn ${chartView === "week" ? "waterChartToggleActive" : ""}`} onClick={() => setChartView("week")} type="button">Weekly</button>
            <button className={`waterChartToggleBtn ${chartView === "month" ? "waterChartToggleActive" : ""}`} onClick={() => setChartView("month")} type="button">Monthly</button>
          </div>

          {/* Weekly Chart */}
          {chartView === "week" && (
            <div className="waterWeekChart">
              <div className="waterChartHeader">
                <button className="waterChartNavBtn" onClick={() => setWeekOffset(o => o - 1)} type="button">&lsaquo;</button>
                <div className="waterWeekTitle">{weekLabel}</div>
                <button className="waterChartNavBtn" onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset === 0} type="button">&rsaquo;</button>
              </div>
              <div className="waterWeekBars">
                {weekBars.map(bar => (
                  <div
                    className={`waterWeekBarWrap ${bar.isSelected ? "waterWeekBarSelected" : ""} ${bar.isFuture ? "waterWeekBarFuture" : ""}`}
                    key={bar.key}
                    onClick={() => !bar.isFuture && goToDate(bar.key)}
                    style={{ cursor: bar.isFuture ? "default" : "pointer" }}
                  >
                    <div className="waterWeekValue">{bar.isFuture ? "" : (bar.minutes > 0 ? `${bar.minutes}m` : "")}</div>
                    <div
                      className={`waterWeekBar ${bar.metGoal ? "waterWeekBarGoal" : "waterWeekBarPartial"}`}
                      style={{ height: bar.isFuture ? "0%" : `${bar.pct}%` }}
                    />
                    {!bar.isFuture && bar.metGoal && <div className="waterWeekGoalCheck">&#10003;</div>}
                    <div className="waterWeekLabel">{bar.label}</div>
                    <div className="waterWeekDayNum">{bar.dayNum}</div>
                  </div>
                ))}
              </div>
              <div className="waterChartLegend">
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> {MEDITATION_GOAL}m+ goal</span>
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Below goal</span>
              </div>
            </div>
          )}

          {/* Monthly Chart */}
          {chartView === "month" && (
            <div className="waterMonthChart">
              <div className="waterChartHeader">
                <button className="waterChartNavBtn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))} type="button">&lsaquo;</button>
                <div className="waterWeekTitle">{monthLabel}</div>
                <button className="waterChartNavBtn" onClick={() => canNextMonth && setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))} disabled={!canNextMonth} type="button">&rsaquo;</button>
              </div>

              <div className="waterMonthStats">
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum">{monthStats.tracked}</div>
                  <div className="waterMonthStatLabel">Sessions</div>
                </div>
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum waterMonthStatGoal">{monthStats.metGoal}</div>
                  <div className="waterMonthStatLabel">{MEDITATION_GOAL}m+ days</div>
                </div>
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum">{monthStats.totalMinutes}</div>
                  <div className="waterMonthStatLabel">Total min</div>
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
                        day.isSelected ? "waterMonthCellSelected" : "",
                        day.isToday ? "waterMonthCellToday" : "",
                        day.metGoal ? "waterMonthCellGoal" : "",
                        day.hasData && !day.metGoal ? "waterMonthCellPartial" : "",
                        !day.hasData && !day.isFuture ? "waterMonthCellMissed" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => !day.isFuture && goToDate(day.key)}
                      style={{ cursor: day.isFuture ? "default" : "pointer" }}
                    >
                      <div className="waterMonthCellDay">{day.day}</div>
                      {!day.isFuture && day.hasData && (
                        <div className="waterMonthCellGlasses">{day.minutes}m</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="waterChartLegend">
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> {MEDITATION_GOAL}m+ session</span>
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Below {MEDITATION_GOAL}m</span>
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendMissed" /> No session</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
