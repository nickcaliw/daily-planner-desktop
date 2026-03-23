import { useCallback, useMemo, useRef, useState } from "react";
import { ymd, parseYMD, startOfWeekMonday } from "../lib/dates.js";
import { HABITS, HOURS } from "../lib/constants.js";
import { defaultHabits } from "../lib/habits.js";
import { useMonthData } from "../hooks/useMonthData.js";
import { useHabits } from "../hooks/useHabits.js";
import AutoGrowTextarea from "../components/AutoGrowTextarea.jsx";

const api = typeof window !== "undefined" ? window.plannerApi : null;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function habitPct(entry, habitsList) {
  if (!entry?.habits || !habitsList?.length) return 0;
  let done = 0;
  for (const h of habitsList) if (entry.habits[h]) done++;
  return Math.round((done / habitsList.length) * 100);
}

function hasContent(entry) {
  if (!entry) return false;
  return !!(
    entry.grateful ||
    entry.feel ||
    entry.goal ||
    entry.notes ||
    entry.top3?.some((t) => t) ||
    entry.wins?.some((w) => w) ||
    Object.values(entry.agenda || {}).some((v) => v)
  );
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - startDow);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    cells.push({
      date: d,
      dateStr: ymd(d),
      inMonth: d.getMonth() === month - 1,
    });
  }

  const lastRowStart = 35;
  const allOutside = cells.slice(lastRowStart).every((c) => !c.inMonth);
  return allOutside ? cells.slice(0, 35) : cells;
}

function defaultEntry(dateStr) {
  return {
    date: dateStr,
    tab: "planner",
    grateful: "",
    feel: "",
    goal: "",
    agenda: HOURS.reduce((acc, h) => ((acc[h] = ""), acc), {}),
    top3: ["", "", ""],
    notes: "",
    wins: ["", "", ""],
    rating: 3,
    habits: defaultHabits(),
  };
}

/** Debounced save to SQLite / localStorage */
function useDayPersist() {
  const timers = useRef({});

  return useCallback((dateStr, entry) => {
    if (timers.current[dateStr]) clearTimeout(timers.current[dateStr]);
    timers.current[dateStr] = setTimeout(() => {
      if (api) {
        api.saveDay(dateStr, entry);
      } else {
        try {
          const raw = localStorage.getItem("weekly_planner_v2");
          const all = raw ? JSON.parse(raw) : {};
          all[dateStr] = entry;
          localStorage.setItem("weekly_planner_v2", JSON.stringify(all));
        } catch {}
      }
    }, 300);
  }, []);
}

export default function CalendarPage({ onGoToDay }) {
  const { habits: HABITS_LIST } = useHabits();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingNote, setEditingNote] = useState(null); // dateStr of cell being edited

  const { data, loading, setData } = useMonthData(year, month);
  const persist = useDayPersist();

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const goPrev = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const goNext = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const selectedEntry = selectedDate ? (data[selectedDate] || defaultEntry(selectedDate)) : null;

  const updateSelected = (patch) => {
    if (!selectedDate || loading) return;
    const current = data[selectedDate] || defaultEntry(selectedDate);
    const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
    setData((prev) => ({ ...prev, [selectedDate]: next }));
    persist(selectedDate, next);
  };

  const updateCalNote = useCallback((dateStr, value) => {
    if (loading) return;
    const current = data[dateStr] || defaultEntry(dateStr);
    const next = { ...current, calendarNote: value };
    setData((prev) => ({ ...prev, [dateStr]: next }));
    persist(dateStr, next);
  }, [data, loading, setData, persist]);

  const handleDayClick = (dateStr) => {
    setSelectedDate((prev) => prev === dateStr ? null : dateStr);
  };

  const selectedDateObj = selectedDate ? parseYMD(selectedDate) : null;

  return (
    <div className="calendarPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Calendar</h1>
          <div className="weekBadge">{year}</div>
        </div>
        <div className="nav">
          <button className="btn" onClick={goPrev} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="range calRange">
            {MONTH_NAMES[month - 1]}
          </div>
          <button className="btn" onClick={goNext} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
          {!isCurrentMonth && (
            <button className="btn btnPrimary" onClick={goToday}>
              Today
            </button>
          )}
        </div>
      </div>

      <div className="calBody">
        <div className="calContent">
          {loading ? (
            <div className="loadingMsg">Loading…</div>
          ) : (
            <div className="calGrid">
              {DAY_LABELS.map((d) => (
                <div className="calHeaderCell" key={d}>{d}</div>
              ))}

              {grid.map((cell) => {
                const entry = data[cell.dateStr];
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDate;
                const pct = habitPct(entry, HABITS_LIST);
                const hasData = hasContent(entry);
                const rating = entry?.rating;
                const calNote = entry?.calendarNote || "";
                const isEditing = editingNote === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    className={[
                      "calCell",
                      !cell.inMonth && "calCellOutside",
                      isToday && "calCellToday",
                      isSelected && "calCellSelected",
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleDayClick(cell.dateStr)}
                  >
                    <div className="calDateNum">
                      {cell.date.getDate()}
                    </div>

                    {/* Inline calendar note */}
                    {isEditing ? (
                      <textarea
                        className="calNoteInput"
                        value={calNote}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateCalNote(cell.dateStr, e.target.value)}
                        onBlur={() => setEditingNote(null)}
                        onKeyDown={e => { if (e.key === "Escape") setEditingNote(null); }}
                        placeholder="Add note…"
                      />
                    ) : calNote ? (
                      <div
                        className="calNotePreview"
                        onClick={e => { e.stopPropagation(); setEditingNote(cell.dateStr); }}
                        title="Click to edit"
                      >
                        {calNote}
                      </div>
                    ) : (
                      <div
                        className="calNoteAdd"
                        onClick={e => { e.stopPropagation(); setEditingNote(cell.dateStr); }}
                      >+</div>
                    )}

                    <div className="calIndicators">
                      {pct > 0 && (
                        <div className="calHabitBar">
                          <div className="calHabitFill" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {hasData && !pct && <div className="calDot" />}
                      {rating && rating > 0 && (
                        <div className="calRating">{"★".repeat(rating)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedDate && selectedEntry && (
          <div className="calPanel">
            <div className="calPanelHeader">
              <div>
                <div className="calPanelDay">
                  {selectedDateObj.toLocaleDateString(undefined, { weekday: "long" })}
                </div>
                <div className="calPanelDate">
                  {selectedDateObj.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button
                className="calPanelClose"
                onClick={() => setSelectedDate(null)}
                type="button"
                aria-label="Close panel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="calPanelBody">
              <div className="calPanelSection">
                <div className="label">Notes</div>
                <AutoGrowTextarea
                  value={selectedEntry.notes}
                  onChange={(v) => updateSelected((cur) => ({ ...cur, notes: v }))}
                  placeholder="Write your notes for the day…"
                  className="input"
                  rows={4}
                  minHeight={100}
                  maxHeight={300}
                />
              </div>

              <div className="calPanelSection">
                <div className="label">Grateful for</div>
                <AutoGrowTextarea
                  value={selectedEntry.grateful}
                  onChange={(v) => updateSelected((cur) => ({ ...cur, grateful: v }))}
                  placeholder="What am I grateful for?"
                  className="input"
                  rows={1}
                  minHeight={34}
                  maxHeight={120}
                />
              </div>

              <div className="calPanelSection">
                <div className="label">Daily goal</div>
                <AutoGrowTextarea
                  value={selectedEntry.goal}
                  onChange={(v) => updateSelected((cur) => ({ ...cur, goal: v }))}
                  placeholder="What matters most today?"
                  className="input"
                  rows={1}
                  minHeight={34}
                  maxHeight={120}
                />
              </div>

              <div className="calPanelSection">
                <div className="label">Nutrition</div>
                <div className="nutritionGrid">
                  {[
                    { key: "calories", label: "Cal", unit: "" },
                    { key: "protein", label: "Protein", unit: "g" },
                    { key: "carbs", label: "Carbs", unit: "g" },
                    { key: "fat", label: "Fat", unit: "g" },
                  ].map(({ key, label, unit }) => (
                    <div className="nutritionField" key={key}>
                      <div className="nutritionLabel">{label}</div>
                      <div className="nutritionInputWrap">
                        <input
                          type="number"
                          className="nutritionInput"
                          placeholder="—"
                          value={selectedEntry.nutrition?.[key] ?? ""}
                          onChange={(e) =>
                            updateSelected((cur) => ({
                              ...cur,
                              nutrition: {
                                ...(cur.nutrition || {}),
                                [key]: e.target.value,
                              },
                            }))
                          }
                        />
                        {unit && <span className="nutritionUnit">{unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {habitPct(selectedEntry, HABITS_LIST) > 0 && (
                <div className="calPanelSection">
                  <div className="label">Habits</div>
                  <div className="calPanelHabitBar">
                    <div className="progressBar">
                      <div className="progressFill" style={{ width: `${habitPct(selectedEntry, HABITS_LIST)}%` }} />
                    </div>
                    <div className="progressMeta">
                      <span className="pct">{habitPct(selectedEntry, HABITS_LIST)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="calPanelFooter">
              <button
                className="btn btnPrimary calPanelGoBtn"
                onClick={() => {
                  const weekStart = startOfWeekMonday(selectedDateObj);
                  onGoToDay(weekStart);
                }}
                type="button"
              >
                Open in Planner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
