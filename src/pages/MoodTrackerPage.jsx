import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ymd, addDays, parseYMD } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.settingsApi : null;

const MOODS = [
  { level: 1, emoji: "\u{1F622}", label: "Awful",  color: "#e74c3c" },
  { level: 2, emoji: "\u{1F614}", label: "Bad",    color: "#e67e22" },
  { level: 3, emoji: "\u{1F610}", label: "Okay",   color: "#f1c40f" },
  { level: 4, emoji: "\u{1F642}", label: "Good",   color: "#2ecc71" },
  { level: 5, emoji: "\u{1F604}", label: "Great",  color: "#27ae60" },
];

const ENERGY_LEVELS = [
  { level: 1, label: "Very Low" },
  { level: 2, label: "Low" },
  { level: 3, label: "Medium" },
  { level: 4, label: "High" },
  { level: 5, label: "Very High" },
];

const TAGS = [
  "Work", "Exercise", "Social", "Sleep", "Weather",
  "Food", "Stress", "Family", "Health", "Creativity",
];

function moodColor(level) {
  const m = MOODS.find(m => m.level === level);
  return m ? m.color : "#ddd";
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export default function MoodTrackerPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);

  // Current day's data
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);

  // Data caches for charts
  const [weekData, setWeekData] = useState({});
  const [monthData, setMonthData] = useState({});

  const noteTimer = useRef(null);
  const [popMood, setPopMood] = useState(null);

  const selectedDateObj = useMemo(() => parseYMD(selectedDate), [selectedDate]);

  const displayDate = useMemo(() => {
    return selectedDateObj.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }, [selectedDateObj]);

  const isToday = selectedDate === todayStr;

  // --- Load day data ---
  const loadDay = useCallback(async (dateStr) => {
    if (!api) { setLoading(false); return; }
    try {
      const raw = await api.get(`mood_${dateStr}`);
      if (raw) {
        const data = JSON.parse(raw);
        setMood(data.mood ?? null);
        setEnergy(data.energy ?? null);
        setNote(data.note ?? "");
        setTags(data.tags ?? []);
      } else {
        setMood(null);
        setEnergy(null);
        setNote("");
        setTags([]);
      }
    } catch {
      setMood(null);
      setEnergy(null);
      setNote("");
      setTags([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  // --- Save helper ---
  const saveData = useCallback((overrides = {}) => {
    if (!api) return;
    const data = { mood, energy, note, tags, ...overrides, updatedAt: new Date().toISOString() };
    api.set(`mood_${selectedDate}`, JSON.stringify(data));
  }, [mood, energy, note, tags, selectedDate]);

  // --- Load week data ---
  const weekStart = useMemo(() => {
    const d = parseYMD(selectedDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
  }, [selectedDate]);

  const loadWeekData = useCallback(async () => {
    if (!api) return;
    const result = {};
    for (let i = 0; i < 7; i++) {
      const d = ymd(addDays(weekStart, i));
      try {
        const raw = await api.get(`mood_${d}`);
        if (raw) result[d] = JSON.parse(raw);
      } catch { /* skip */ }
    }
    setWeekData(result);
  }, [weekStart]);

  useEffect(() => { loadWeekData(); }, [loadWeekData]);

  // --- Load month data ---
  const monthYear = useMemo(() => {
    const d = parseYMD(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate]);

  const loadMonthData = useCallback(async () => {
    if (!api) return;
    const { year, month } = monthYear;
    const daysInMonth = getDaysInMonth(year, month);
    const result = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const d = ymd(new Date(year, month, day));
      try {
        const raw = await api.get(`mood_${d}`);
        if (raw) result[d] = JSON.parse(raw);
      } catch { /* skip */ }
    }
    setMonthData(result);
  }, [monthYear]);

  useEffect(() => { loadMonthData(); }, [loadMonthData]);

  // --- Handlers ---
  const handleMoodSelect = useCallback((level) => {
    setMood(level);
    setPopMood(level);
    setTimeout(() => setPopMood(null), 400);
    // Save immediately with new mood
    if (!api) return;
    const data = { mood: level, energy, note, tags, updatedAt: new Date().toISOString() };
    api.set(`mood_${selectedDate}`, JSON.stringify(data));
    // Refresh charts after short delay
    setTimeout(() => { loadWeekData(); loadMonthData(); }, 100);
  }, [energy, note, tags, selectedDate, loadWeekData, loadMonthData]);

  const handleEnergySelect = useCallback((level) => {
    setEnergy(level);
    if (!api) return;
    const data = { mood, energy: level, note, tags, updatedAt: new Date().toISOString() };
    api.set(`mood_${selectedDate}`, JSON.stringify(data));
  }, [mood, note, tags, selectedDate]);

  const handleNoteChange = useCallback((e) => {
    const val = e.target.value;
    setNote(val);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      if (!api) return;
      // Re-read current state via closure isn't reliable, so just save what we have
      const data = { mood, energy, note: val, tags, updatedAt: new Date().toISOString() };
      api.set(`mood_${selectedDate}`, JSON.stringify(data));
    }, 300);
  }, [mood, energy, tags, selectedDate]);

  const handleTagToggle = useCallback((tag) => {
    setTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      if (api) {
        const data = { mood, energy, note, tags: next, updatedAt: new Date().toISOString() };
        api.set(`mood_${selectedDate}`, JSON.stringify(data));
      }
      return next;
    });
  }, [mood, energy, note, selectedDate]);

  const goToday = useCallback(() => setSelectedDate(todayStr), [todayStr]);
  const goPrev = useCallback(() => setSelectedDate(prev => ymd(addDays(parseYMD(prev), -1))), []);
  const goNext = useCallback(() => setSelectedDate(prev => {
    const next = ymd(addDays(parseYMD(prev), 1));
    return next <= todayStr ? next : prev;
  }), [todayStr]);

  // --- Week chart data ---
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const key = ymd(d);
      days.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNum: d.getDate(),
        data: weekData[key] || null,
        isSelected: key === selectedDate,
        isToday: key === todayStr,
      });
    }
    return days;
  }, [weekStart, weekData, selectedDate, todayStr]);

  // --- Month heatmap data ---
  const monthGrid = useMemo(() => {
    const { year, month } = monthYear;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    // Shift so Monday=0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const key = ymd(new Date(year, month, day));
      cells.push({
        day,
        key,
        data: monthData[key] || null,
        isSelected: key === selectedDate,
        isToday: key === todayStr,
        isFuture: key > todayStr,
      });
    }
    return cells;
  }, [monthYear, monthData, selectedDate, todayStr]);

  const monthLabel = useMemo(() => {
    const { year, month } = monthYear;
    return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [monthYear]);

  if (loading) {
    return (
      <div className="moodPage">
        <style>{styles}</style>
        <div className="topbar"><div className="topbarLeft"><h1 className="pageTitle">Mood Tracker</h1></div></div>
        <div className="moodContent"><div className="moodLoading">Loading...</div></div>
      </div>
    );
  }

  return (
    <div className="moodPage">
      <style>{styles}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Mood Tracker</h1>
          {mood && (
            <div className="weekBadge" style={{ background: moodColor(mood) + "22", color: moodColor(mood) }}>
              {MOODS.find(m => m.level === mood)?.emoji} {MOODS.find(m => m.level === mood)?.label}
            </div>
          )}
        </div>
        <div className="moodDateNav">
          <button className="moodNavBtn" onClick={goPrev} title="Previous day">&lsaquo;</button>
          <button className={`moodDateLabel ${isToday ? "moodDateToday" : ""}`} onClick={goToday}>
            {isToday ? "Today" : displayDate}
          </button>
          <button className="moodNavBtn" onClick={goNext} disabled={isToday} title="Next day">&rsaquo;</button>
          {!isToday && <button className="moodTodayBtn" onClick={goToday}>Today</button>}
        </div>
      </div>

      <div className="moodContent">
        {/* Quick Mood Selector */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">How are you feeling?</h2>
          <div className="moodSelector">
            {MOODS.map(m => (
              <button
                key={m.level}
                className={`moodBtn ${mood === m.level ? "moodBtnActive" : ""} ${popMood === m.level ? "moodBtnPop" : ""}`}
                style={mood === m.level ? { background: m.color + "22", borderColor: m.color } : {}}
                onClick={() => handleMoodSelect(m.level)}
              >
                <span className="moodEmoji">{m.emoji}</span>
                <span className="moodLabel">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">Energy Level</h2>
          <div className="moodEnergyRow">
            {ENERGY_LEVELS.map(e => (
              <button
                key={e.level}
                className={`moodEnergyBtn ${energy === e.level ? "moodEnergyActive" : ""}`}
                onClick={() => handleEnergySelect(e.level)}
              >
                <span className="moodEnergyBar">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className="moodEnergyDot"
                      style={{ background: i < e.level ? (energy === e.level ? "#5B7CF5" : "#ccc") : "#eee" }}
                    />
                  ))}
                </span>
                <span className="moodEnergyLabel">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">What's on your mind?</h2>
          <textarea
            className="moodNote"
            placeholder="Write about your day..."
            value={note}
            onChange={handleNoteChange}
            rows={3}
          />
        </div>

        {/* Tags */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">Tags</h2>
          <div className="moodTags">
            {TAGS.map(tag => (
              <button
                key={tag}
                className={`moodTag ${tags.includes(tag) ? "moodTagActive" : ""}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Mood Chart */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">This Week</h2>
          <div className="moodWeekChart">
            {weekDays.map(d => (
              <div
                key={d.key}
                className={`moodWeekDay ${d.isSelected ? "moodWeekDaySelected" : ""} ${d.isToday ? "moodWeekDayToday" : ""}`}
                onClick={() => setSelectedDate(d.key)}
              >
                <span className="moodWeekLabel">{d.label}</span>
                <div
                  className="moodWeekDot"
                  style={{
                    background: d.data?.mood ? moodColor(d.data.mood) : "#e0ddd5",
                    width: d.data?.mood ? 12 + d.data.mood * 4 : 16,
                    height: d.data?.mood ? 12 + d.data.mood * 4 : 16,
                  }}
                  title={d.data?.mood ? MOODS.find(m => m.level === d.data.mood)?.label : "No entry"}
                />
                <span className="moodWeekNum">{d.dayNum}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Heatmap */}
        <div className="moodSection">
          <h2 className="moodSectionTitle">{monthLabel}</h2>
          <div className="moodHeatmapHeader">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <span key={d} className="moodHeatmapDay">{d}</span>
            ))}
          </div>
          <div className="moodHeatmap">
            {monthGrid.map((cell, i) => (
              <div
                key={i}
                className={`moodHeatCell ${cell.empty ? "moodHeatEmpty" : ""} ${cell.isSelected ? "moodHeatSelected" : ""} ${cell.isToday ? "moodHeatToday" : ""} ${cell.isFuture ? "moodHeatFuture" : ""}`}
                style={!cell.empty && cell.data?.mood ? { background: moodColor(cell.data.mood) + "55" } : {}}
                onClick={() => !cell.empty && !cell.isFuture && setSelectedDate(cell.key)}
                title={cell.data?.mood ? MOODS.find(m => m.level === cell.data.mood)?.label : ""}
              >
                {!cell.empty && (
                  <>
                    <span className="moodHeatDay">{cell.day}</span>
                    {cell.data?.mood && (
                      <span className="moodHeatDot" style={{ background: moodColor(cell.data.mood) }} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="moodHeatLegend">
            <span className="moodHeatLegendLabel">Mood:</span>
            {MOODS.map(m => (
              <span key={m.level} className="moodHeatLegendItem">
                <span className="moodHeatLegendDot" style={{ background: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
.moodPage {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f6f1e8;
}
.moodContent {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 48px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
.moodLoading {
  text-align: center;
  padding: 64px 0;
  color: #b5a98c;
  font-size: 15px;
}

/* Date Nav */
.moodDateNav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.moodNavBtn {
  background: none;
  border: 1px solid #e0ddd5;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 20px;
  color: #7a6f5d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.moodNavBtn:hover:not(:disabled) {
  background: #ede8df;
}
.moodNavBtn:disabled {
  opacity: 0.35;
  cursor: default;
}
.moodDateLabel {
  background: none;
  border: none;
  font-size: 13px;
  color: #7a6f5d;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}
.moodDateLabel:hover {
  background: #ede8df;
}
.moodDateToday {
  color: #5B7CF5;
  font-weight: 600;
}
.moodTodayBtn {
  background: #5B7CF5;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
}
.moodTodayBtn:hover {
  background: #4a6be4;
}

/* Sections */
.moodSection {
  margin-bottom: 28px;
}
.moodSectionTitle {
  font-size: 14px;
  font-weight: 600;
  color: #6b5e4b;
  margin: 0 0 12px;
  letter-spacing: 0.01em;
}

/* Mood Selector */
.moodSelector {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.moodBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
  border: 2px solid #e0ddd5;
  border-radius: 14px;
  background: #fbf7f0;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
  min-width: 72px;
}
.moodBtn:hover {
  border-color: #c8c2b5;
  background: #f5f0e5;
}
.moodBtnActive {
  transform: scale(1.05);
  border-width: 2.5px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.moodBtnPop {
  animation: moodPop 0.4s ease;
}
@keyframes moodPop {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  60% { transform: scale(0.95); }
  100% { transform: scale(1.05); }
}
.moodEmoji {
  font-size: 32px;
  line-height: 1;
}
.moodLabel {
  font-size: 12px;
  color: #7a6f5d;
  font-weight: 500;
}
.moodBtnActive .moodLabel {
  font-weight: 700;
}

/* Energy */
.moodEnergyRow {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.moodEnergyBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: 2px solid #e0ddd5;
  border-radius: 10px;
  background: #fbf7f0;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  min-width: 68px;
}
.moodEnergyBtn:hover {
  border-color: #c8c2b5;
}
.moodEnergyActive {
  border-color: #5B7CF5;
  background: #5B7CF522;
}
.moodEnergyBar {
  display: flex;
  gap: 3px;
}
.moodEnergyDot {
  width: 6px;
  height: 16px;
  border-radius: 3px;
  transition: background 0.15s;
}
.moodEnergyLabel {
  font-size: 11px;
  color: #7a6f5d;
  font-weight: 500;
}
.moodEnergyActive .moodEnergyLabel {
  color: #5B7CF5;
  font-weight: 600;
}

/* Note */
.moodNote {
  width: 100%;
  border: 1.5px solid #e0ddd5;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  background: #fbf7f0;
  color: #4a3f2f;
  resize: vertical;
  min-height: 72px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.moodNote:focus {
  border-color: #5B7CF5;
}
.moodNote::placeholder {
  color: #b5a98c;
}

/* Tags */
.moodTags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.moodTag {
  padding: 6px 14px;
  border: 1.5px solid #e0ddd5;
  border-radius: 20px;
  background: #fbf7f0;
  font-size: 13px;
  color: #7a6f5d;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}
.moodTag:hover {
  border-color: #c8c2b5;
  background: #f0ebe0;
}
.moodTagActive {
  background: #5B7CF522;
  border-color: #5B7CF5;
  color: #5B7CF5;
  font-weight: 600;
}

/* Week Chart */
.moodWeekChart {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 12px 0;
}
.moodWeekDay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  min-width: 52px;
}
.moodWeekDay:hover {
  background: #ede8df;
}
.moodWeekDaySelected {
  background: #e8e3d8;
}
.moodWeekDayToday .moodWeekNum {
  color: #5B7CF5;
  font-weight: 700;
}
.moodWeekLabel {
  font-size: 11px;
  color: #b5a98c;
  font-weight: 500;
  text-transform: uppercase;
}
.moodWeekDot {
  border-radius: 50%;
  transition: all 0.2s;
}
.moodWeekNum {
  font-size: 13px;
  color: #7a6f5d;
  font-weight: 500;
}

/* Monthly Heatmap */
.moodHeatmapHeader {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}
.moodHeatmapDay {
  text-align: center;
  font-size: 11px;
  color: #b5a98c;
  font-weight: 600;
  text-transform: uppercase;
  padding: 4px 0;
}
.moodHeatmap {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.moodHeatCell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  background: #fbf7f0;
  border: 1.5px solid transparent;
  transition: all 0.15s;
  position: relative;
}
.moodHeatCell:hover:not(.moodHeatEmpty):not(.moodHeatFuture) {
  border-color: #c8c2b5;
}
.moodHeatEmpty {
  background: transparent;
  cursor: default;
}
.moodHeatSelected {
  border-color: #5B7CF5 !important;
  box-shadow: 0 0 0 2px #5B7CF533;
}
.moodHeatToday {
  border-color: #5B7CF5;
}
.moodHeatFuture {
  opacity: 0.35;
  cursor: default;
}
.moodHeatDay {
  font-size: 12px;
  color: #7a6f5d;
  font-weight: 500;
}
.moodHeatDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.moodHeatLegend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  justify-content: center;
}
.moodHeatLegendLabel {
  font-size: 12px;
  color: #b5a98c;
  font-weight: 500;
}
.moodHeatLegendItem {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #7a6f5d;
}
.moodHeatLegendDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
`;
