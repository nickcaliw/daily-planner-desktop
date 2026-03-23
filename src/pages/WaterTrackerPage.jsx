import { useCallback, useEffect, useMemo, useState } from "react";
import { ymd, parseYMD, startOfWeekMonday, addDays } from "../lib/dates.js";

const waterApi = typeof window !== "undefined" ? window.waterApi : null;

export default function WaterTrackerPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  // Selected date for editing
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);
  const [loading, setLoading] = useState(true);

  // Chart view: "week" or "month"
  const [chartView, setChartView] = useState("week");

  // Week navigation offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);
  // Month navigation
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // All data for the visible range
  const [rangeData, setRangeData] = useState([]);
  const [streak, setStreak] = useState(0);

  // Load entry for selected date
  useEffect(() => {
    if (!waterApi) { setLoading(false); return; }
    waterApi.get(selectedDate).then(entry => {
      if (entry) {
        setGlasses(entry.glasses ?? 0);
        setGoal(entry.goal ?? 8);
      } else {
        setGlasses(0);
        // keep current goal setting
      }
      setLoading(false);
    });
  }, [selectedDate]);

  // Load range data for charts + streak
  // Compute the earliest date we need: min of (60 days ago, start of viewed month, start of viewed week)
  useEffect(() => {
    if (!waterApi) return;
    const sixtyAgo = addDays(today, -60);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const earliest = monthStart < sixtyAgo ? monthStart : sixtyAgo;
    const weekStart = addDays(startOfWeekMonday(today), weekOffset * 7);
    const finalEarliest = weekStart < earliest ? weekStart : earliest;
    const rangeStart = ymd(finalEarliest);
    waterApi.range(rangeStart, todayStr).then(data => {
      setRangeData(data || []);
    });
  }, [today, todayStr, glasses, goal, selectedDate, monthDate, weekOffset]);

  // Compute streak
  useEffect(() => {
    const byDate = {};
    for (const d of rangeData) { if (d.date) byDate[d.date] = d; }
    // Override with current editing state
    byDate[selectedDate] = { glasses, goal };

    let s = 0;
    for (let i = 0; i <= 60; i++) {
      const d = ymd(addDays(today, -i));
      const entry = byDate[d];
      if (entry && entry.glasses >= (entry.goal ?? 8)) s++;
      else break;
    }
    setStreak(s);
  }, [rangeData, today, glasses, goal, selectedDate]);

  const save = useCallback(async (g, gl) => {
    if (waterApi) await waterApi.save(selectedDate, { glasses: g, goal: gl });
  }, [selectedDate]);

  const addGlass = () => { const n = glasses + 1; setGlasses(n); save(n, goal); };
  const removeGlass = () => { const n = Math.max(0, glasses - 1); setGlasses(n); save(n, goal); };
  const changeGoal = e => { const v = Math.max(1, parseInt(e.target.value, 10) || 1); setGoal(v); save(glasses, v); };

  // Date navigation
  const goToDate = (dateStr) => {
    setSelectedDate(dateStr);
  };
  const prevDay = () => {
    const d = parseYMD(selectedDate);
    goToDate(ymd(addDays(d, -1)));
  };
  const nextDay = () => {
    const d = parseYMD(selectedDate);
    const next = addDays(d, 1);
    if (next <= today) goToDate(ymd(next));
  };

  const selectedDateObj = useMemo(() => parseYMD(selectedDate), [selectedDate]);
  const isToday = selectedDate === todayStr;
  const canGoForward = !isToday;

  const selectedLabel = useMemo(() => {
    if (isToday) return "Today";
    const d = selectedDateObj;
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }, [selectedDateObj, isToday]);

  // --- WEEK CHART DATA ---
  const weekChartMonday = useMemo(() => {
    const base = startOfWeekMonday(today);
    return addDays(base, weekOffset * 7);
  }, [today, weekOffset]);

  const weekBars = useMemo(() => {
    const byDate = {};
    for (const d of rangeData) { if (d.date) byDate[d.date] = d; }
    // Override with current editing state
    byDate[selectedDate] = { glasses, goal };

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekChartMonday, i);
      const key = ymd(d);
      const entry = byDate[key];
      const g = entry?.glasses ?? 0;
      const gl = entry?.goal ?? 8;
      const isSelected = key === selectedDate;
      const isFuture = d > today;
      return {
        key, label: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNum: d.getDate(),
        glasses: g, goal: gl,
        pct: gl > 0 ? Math.min(100, Math.round((g / gl) * 100)) : 0,
        metGoal: g >= gl && g > 0,
        isSelected, isFuture
      };
    });
  }, [rangeData, weekChartMonday, today, selectedDate, glasses, goal]);

  const weekLabel = useMemo(() => {
    const sun = addDays(weekChartMonday, 6);
    const left = weekChartMonday.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const right = sun.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${left} - ${right}`;
  }, [weekChartMonday]);

  const isCurrentWeek = weekOffset === 0;

  // --- MONTH CHART DATA ---
  const monthDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const startPad = firstDow === 0 ? 6 : firstDow - 1; // Mon-based

    const byDate = {};
    for (const d of rangeData) { if (d.date) byDate[d.date] = d; }
    byDate[selectedDate] = { glasses, goal };

    const days = [];
    // Padding for start of month
    for (let i = 0; i < startPad; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = ymd(date);
      const entry = byDate[key];
      const g = entry?.glasses ?? 0;
      const gl = entry?.goal ?? 8;
      const isFuture = date > today;
      days.push({
        key, day: d, glasses: g, goal: gl,
        metGoal: g >= gl && g > 0,
        hasData: g > 0,
        isFuture,
        isSelected: key === selectedDate,
        isToday: key === todayStr,
      });
    }
    return days;
  }, [monthDate, rangeData, today, todayStr, selectedDate, glasses, goal]);

  const monthLabel = useMemo(() => {
    return monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [monthDate]);

  const prevMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    if (next <= today) setMonthDate(next);
  };
  const canNextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1) <= today;

  // Month stats
  const monthStats = useMemo(() => {
    const validDays = monthDays.filter(d => d && !d.isFuture);
    const daysWithData = validDays.filter(d => d.hasData);
    const metGoalDays = validDays.filter(d => d.metGoal);
    const totalGlasses = validDays.reduce((sum, d) => sum + d.glasses, 0);
    return { total: validDays.length, tracked: daysWithData.length, metGoal: metGoalDays.length, totalGlasses };
  }, [monthDays]);

  // Glass icons for selected day
  const glassIcons = useMemo(() => Array.from({ length: goal }, (_, i) => i < glasses), [glasses, goal]);
  const pct = goal > 0 ? Math.min(100, Math.round((glasses / goal) * 100)) : 0;

  if (loading) {
    return (
      <div className="waterPage">
        <div className="topbar"><div className="topbarLeft"><h1 className="pageTitle">Water Tracker</h1></div></div>
        <div className="loadingMsg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="waterPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Water Tracker</h1>
          {streak > 0 && (
            <div className="weekBadge" title="Current streak">{streak} day streak</div>
          )}
        </div>
      </div>

      <div className="waterContent">
        {/* Date Navigator */}
        <div className="waterDateNav">
          <button className="waterDateNavBtn" onClick={prevDay} type="button">&lsaquo;</button>
          <div className="waterDateNavCenter">
            <span className="waterDateNavLabel">{selectedLabel}</span>
            <input
              type="date"
              className="waterDateNavInput"
              value={selectedDate}
              max={todayStr}
              onChange={e => e.target.value && goToDate(e.target.value)}
            />
          </div>
          <button className="waterDateNavBtn" onClick={nextDay} disabled={!canGoForward} type="button">&rsaquo;</button>
          {!isToday && (
            <button className="waterTodayBtn" onClick={() => goToDate(todayStr)} type="button">Today</button>
          )}
        </div>

        {/* Current day intake */}
        <div className="waterDisplay">
          <div className="waterCount">{glasses}</div>
          <div className="waterGoalText">of {goal} glasses ({glasses * 250}ml)</div>
          <div className="waterPctBar">
            <div className="waterPctBarFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="waterPctLabel">{pct}%</div>
        </div>

        <div className="waterControls">
          <button className="waterSubBtn" onClick={removeGlass} disabled={glasses <= 0} type="button">-</button>
          <button className="waterAddBtn" onClick={addGlass} type="button">+</button>
        </div>

        <div className="waterGlasses">
          {glassIcons.map((filled, i) => (
            <div key={i} className={`waterGlass ${filled ? "waterGlassFilled" : ""}`} />
          ))}
        </div>

        <div className="waterGoalInput">
          <span>Daily goal:</span>
          <input type="number" min="1" max="20" value={goal} onChange={changeGoal} />
          <span>glasses</span>
        </div>

        {/* Chart View Toggle */}
        <div className="waterChartToggle">
          <button
            className={`waterChartToggleBtn ${chartView === "week" ? "waterChartToggleActive" : ""}`}
            onClick={() => setChartView("week")}
            type="button"
          >Weekly</button>
          <button
            className={`waterChartToggleBtn ${chartView === "month" ? "waterChartToggleActive" : ""}`}
            onClick={() => setChartView("month")}
            type="button"
          >Monthly</button>
        </div>

        {/* Weekly Chart */}
        {chartView === "week" && (
          <div className="waterWeekChart">
            <div className="waterChartHeader">
              <button className="waterChartNavBtn" onClick={() => setWeekOffset(o => o - 1)} type="button">&lsaquo;</button>
              <div className="waterWeekTitle">{weekLabel}</div>
              <button className="waterChartNavBtn" onClick={() => setWeekOffset(o => o + 1)} disabled={isCurrentWeek} type="button">&rsaquo;</button>
            </div>
            <div className="waterWeekBars">
              {weekBars.map(bar => (
                <div
                  className={`waterWeekBarWrap ${bar.isSelected ? "waterWeekBarSelected" : ""} ${bar.isFuture ? "waterWeekBarFuture" : ""}`}
                  key={bar.key}
                  onClick={() => !bar.isFuture && goToDate(bar.key)}
                  style={{ cursor: bar.isFuture ? "default" : "pointer" }}
                >
                  <div className="waterWeekValue">{bar.isFuture ? "" : bar.glasses}</div>
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
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> Goal met</span>
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Below goal</span>
            </div>
          </div>
        )}

        {/* Monthly Chart */}
        {chartView === "month" && (
          <div className="waterMonthChart">
            <div className="waterChartHeader">
              <button className="waterChartNavBtn" onClick={prevMonth} type="button">&lsaquo;</button>
              <div className="waterWeekTitle">{monthLabel}</div>
              <button className="waterChartNavBtn" onClick={nextMonth} disabled={!canNextMonth} type="button">&rsaquo;</button>
            </div>

            <div className="waterMonthStats">
              <div className="waterMonthStat">
                <div className="waterMonthStatNum">{monthStats.tracked}</div>
                <div className="waterMonthStatLabel">Days tracked</div>
              </div>
              <div className="waterMonthStat">
                <div className="waterMonthStatNum waterMonthStatGoal">{monthStats.metGoal}</div>
                <div className="waterMonthStatLabel">Goal hit</div>
              </div>
              <div className="waterMonthStat">
                <div className="waterMonthStatNum waterMonthStatMissed">{monthStats.tracked - monthStats.metGoal}</div>
                <div className="waterMonthStatLabel">Missed</div>
              </div>
              <div className="waterMonthStat">
                <div className="waterMonthStatNum">{monthStats.totalGlasses}</div>
                <div className="waterMonthStatLabel">Total glasses</div>
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
                      <div className="waterMonthCellGlasses">{day.glasses}/{day.goal}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="waterChartLegend">
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> Goal met</span>
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Below goal</span>
              <span className="waterLegendItem"><span className="waterLegendDot waterLegendMissed" /> No data</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
