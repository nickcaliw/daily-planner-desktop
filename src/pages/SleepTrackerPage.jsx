import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";

const sleepApi = typeof window !== "undefined" ? window.sleepApi : null;
const SLEEP_GOAL = 8; // hours

function calcDuration(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = waketime.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return (wakeMins - bedMins) / 60;
}

function formatDuration(hours) {
  if (hours == null) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export default function SleepTrackerPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);
  const [selectedDate, setSelectedDate] = useState(() => today);
  const dateStr = useMemo(() => ymd(selectedDate), [selectedDate]);

  const [bedtime, setBedtime] = useState("");
  const [waketime, setWaketime] = useState("");
  const [quality, setQuality] = useState(0);
  const [notes, setNotes] = useState("");
  const [rangeData, setRangeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Chart view
  const [chartView, setChartView] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const duration = useMemo(() => calcDuration(bedtime, waketime), [bedtime, waketime]);

  const goPrev = () => setSelectedDate(d => addDays(d, -1));
  const goNext = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) setSelectedDate(next);
  };
  const goToday = () => setSelectedDate(today);
  const isToday = dateStr === todayStr;

  const formattedDate = useMemo(() =>
    isToday ? "Today" : selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    [selectedDate, isToday]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (sleepApi) {
      sleepApi.get(dateStr).then(data => {
        if (cancelled) return;
        setBedtime(data?.bedtime || "");
        setWaketime(data?.waketime || "");
        setQuality(data?.quality || 0);
        setNotes(data?.notes || "");
        setLoading(false);
      });
    } else setLoading(false);
    return () => { cancelled = true; };
  }, [dateStr]);

  // Load range data for charts
  useEffect(() => {
    if (!sleepApi) return;
    const sixtyAgo = addDays(today, -60);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const earliest = monthStart < sixtyAgo ? monthStart : sixtyAgo;
    const weekStart = addDays(startOfWeekMonday(today), weekOffset * 7);
    const finalEarliest = weekStart < earliest ? weekStart : earliest;
    sleepApi.range(ymd(finalEarliest), todayStr).then(data => {
      setRangeData(data || []);
    });
  }, [today, todayStr, monthDate, weekOffset, bedtime, waketime, quality]);

  const doSave = useCallback((b, w, q, n) => {
    if (!sleepApi) return;
    const hours = calcDuration(b, w);
    sleepApi.save(dateStr, { bedtime: b, waketime: w, quality: q, notes: n, hours });
  }, [dateStr]);

  const scheduleSave = useCallback((b, w, q, n) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(b, w, q, n), 300);
  }, [doSave]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleBedtime = e => { setBedtime(e.target.value); scheduleSave(e.target.value, waketime, quality, notes); };
  const handleWaketime = e => { setWaketime(e.target.value); scheduleSave(bedtime, e.target.value, quality, notes); };
  const handleQuality = q => { setQuality(q); scheduleSave(bedtime, waketime, q, notes); };
  const handleNotes = e => { setNotes(e.target.value); scheduleSave(bedtime, waketime, quality, e.target.value); };

  // Build data lookup
  const byDate = useMemo(() => {
    const map = {};
    for (const entry of rangeData) {
      if (entry.date) map[entry.date] = entry;
    }
    // Override with current editing state
    if (duration != null) {
      map[dateStr] = { ...map[dateStr], bedtime, waketime, quality, hours: duration };
    }
    return map;
  }, [rangeData, dateStr, bedtime, waketime, quality, duration]);

  // --- WEEK CHART ---
  const weekChartMonday = useMemo(() => addDays(startOfWeekMonday(today), weekOffset * 7), [today, weekOffset]);

  const weekBars = useMemo(() => {
    const maxHrs = Math.max(10, ...Object.values(byDate).map(e => e.hours || 0));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekChartMonday, i);
      const key = ymd(d);
      const entry = byDate[key];
      const hrs = entry?.hours ?? calcDuration(entry?.bedtime, entry?.waketime);
      const q = entry?.quality || 0;
      const isFuture = d > today;
      const pct = hrs != null ? Math.round((hrs / maxHrs) * 100) : 0;
      return {
        key, label: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNum: d.getDate(), hours: hrs, quality: q, pct,
        metGoal: hrs != null && hrs >= SLEEP_GOAL,
        isSelected: key === dateStr, isFuture,
      };
    });
  }, [byDate, weekChartMonday, today, dateStr]);

  const weekLabel = useMemo(() => {
    const sun = addDays(weekChartMonday, 6);
    return `${weekChartMonday.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${sun.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }, [weekChartMonday]);

  // Week averages
  const weekAvg = useMemo(() => {
    let totalHrs = 0, totalQ = 0, count = 0;
    for (const bar of weekBars) {
      if (bar.hours != null && bar.hours > 0 && !bar.isFuture) {
        totalHrs += bar.hours;
        if (bar.quality > 0) totalQ += bar.quality;
        count++;
      }
    }
    return { avgHours: count ? totalHrs / count : 0, avgQuality: count ? totalQ / count : 0, count };
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
      const hrs = entry?.hours ?? calcDuration(entry?.bedtime, entry?.waketime);
      const q = entry?.quality || 0;
      const isFuture = date > today;
      days.push({
        key, day: d, hours: hrs, quality: q,
        metGoal: hrs != null && hrs >= SLEEP_GOAL,
        hasData: hrs != null && hrs > 0,
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
    const totalHrs = tracked.reduce((s, d) => s + (d.hours || 0), 0);
    return { total: valid.length, tracked: tracked.length, metGoal: met.length, avgHours: tracked.length ? totalHrs / tracked.length : 0 };
  }, [monthDays]);

  const goToDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  const qualityColor = (q) => {
    if (q >= 4) return "sleepTrendBarGood";
    if (q === 3) return "sleepTrendBarOk";
    if (q >= 1) return "sleepTrendBarBad";
    return "sleepTrendBarOk";
  };

  return (
    <div className="sleepPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Sleep Tracker</h1>
        </div>
        <div className="nav">
          <button className="btn" onClick={goPrev} aria-label="Previous day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="range">{formattedDate}</div>
          <button className="btn" onClick={goNext} disabled={isToday} aria-label="Next day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          {!isToday && <button className="btn btnPrimary" onClick={goToday}>Today</button>}
        </div>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading...</div>
      ) : (
        <div className="sleepContent">
          <div className="sleepForm">
            <div className="sleepTimeRow">
              <div className="sleepTimeField">
                <div className="sleepTimeLabel">Bedtime</div>
                <input type="time" className="sleepTimeInput" value={bedtime} onChange={handleBedtime} />
              </div>
              <div className="sleepTimeField">
                <div className="sleepTimeLabel">Wake Time</div>
                <input type="time" className="sleepTimeInput" value={waketime} onChange={handleWaketime} />
              </div>
            </div>

            <div className="sleepDuration">
              <div className="sleepDurationValue">{duration != null ? formatDuration(duration) : "—"}</div>
              <div className="sleepDurationLabel">Total Sleep</div>
            </div>

            <div className="sleepQuality">
              <div className="sleepQualityLabel">Quality</div>
              {[1, 2, 3, 4, 5].map(q => (
                <button
                  key={q}
                  className={`sleepQualityBtn ${quality === q ? "sleepQualityBtnActive" : ""}`}
                  onClick={() => handleQuality(q)}
                  type="button"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="sleepNotes">
              <textarea placeholder="Sleep notes..." value={notes} onChange={handleNotes} rows={3} />
            </div>
          </div>

          {/* Averages */}
          <div className="sleepAvg">
            <div className="sleepAvgCard">
              <div className="sleepAvgValue">{weekAvg.count > 0 ? formatDuration(weekAvg.avgHours) : "—"}</div>
              <div className="sleepAvgLabel">Week Avg Sleep</div>
            </div>
            <div className="sleepAvgCard">
              <div className="sleepAvgValue">{weekAvg.count > 0 ? `${weekAvg.avgQuality.toFixed(1)} / 5` : "—"}</div>
              <div className="sleepAvgLabel">Week Avg Quality</div>
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
                    <div className="waterWeekValue">{bar.isFuture ? "" : (bar.hours != null ? `${bar.hours.toFixed(1)}h` : "")}</div>
                    <div
                      className={`waterWeekBar ${bar.metGoal ? "waterWeekBarGoal" : qualityColor(bar.quality)}`}
                      style={{ height: bar.isFuture ? "0%" : `${bar.pct}%` }}
                    />
                    {!bar.isFuture && bar.metGoal && <div className="waterWeekGoalCheck">&#10003;</div>}
                    <div className="waterWeekLabel">{bar.label}</div>
                    <div className="waterWeekDayNum">{bar.dayNum}</div>
                  </div>
                ))}
              </div>
              <div className="waterChartLegend">
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> {SLEEP_GOAL}h+ goal</span>
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
                  <div className="waterMonthStatLabel">Tracked</div>
                </div>
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum waterMonthStatGoal">{monthStats.metGoal}</div>
                  <div className="waterMonthStatLabel">{SLEEP_GOAL}h+ nights</div>
                </div>
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum waterMonthStatMissed">{monthStats.tracked - monthStats.metGoal}</div>
                  <div className="waterMonthStatLabel">Under {SLEEP_GOAL}h</div>
                </div>
                <div className="waterMonthStat">
                  <div className="waterMonthStatNum">{monthStats.avgHours > 0 ? formatDuration(monthStats.avgHours) : "—"}</div>
                  <div className="waterMonthStatLabel">Avg sleep</div>
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
                        <div className="waterMonthCellGlasses">{formatDuration(day.hours)}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="waterChartLegend">
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendGoal" /> {SLEEP_GOAL}h+ sleep</span>
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendPartial" /> Below {SLEEP_GOAL}h</span>
                <span className="waterLegendItem"><span className="waterLegendDot waterLegendMissed" /> No data</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
