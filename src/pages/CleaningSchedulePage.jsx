import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.settingsApi : null;

const DEFAULT_TASKS = {
  daily: [
    { id: "d1", label: "Make beds" },
    { id: "d2", label: "Dishes" },
    { id: "d3", label: "Wipe counters" },
    { id: "d4", label: "Take out trash" },
  ],
  weekly: [
    { id: "w1", label: "Vacuum" },
    { id: "w2", label: "Mop floors" },
    { id: "w3", label: "Laundry" },
    { id: "w4", label: "Clean bathrooms" },
    { id: "w5", label: "Dust surfaces" },
  ],
  monthly: [
    { id: "m1", label: "Deep clean kitchen" },
    { id: "m2", label: "Clean windows" },
    { id: "m3", label: "Organize closets" },
    { id: "m4", label: "Clean appliances" },
  ],
};

const SECTION_META = {
  daily: { label: "Daily", color: "#22C55E", icon: "sun" },
  weekly: { label: "Weekly", color: "#5B7CF5", icon: "calendar" },
  monthly: { label: "Monthly", color: "#F59E0B", icon: "star" },
};

function weekKey(monday) {
  const y = monday.getFullYear();
  const jan1 = new Date(y, 0, 1);
  const diff = Math.round((monday - jan1) / 86400000);
  const wn = String(Math.floor(diff / 7) + 1).padStart(2, "0");
  return `${y}-W${wn}`;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CleaningSchedulePage() {
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [pastStats, setPastStats] = useState([]);
  const addInputRef = useRef(null);

  const monday = useMemo(
    () => addDays(startOfWeekMonday(today), weekOffset * 7),
    [today, weekOffset]
  );
  const sunday = useMemo(() => addDays(monday, 6), [monday]);
  const wk = useMemo(() => weekKey(monday), [monday]);
  const isCurrentWeek = weekOffset === 0;

  const fmtShort = (d) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Load tasks template
  useEffect(() => {
    if (!api) { setLoading(false); return; }
    api.get("cleaning_schedule").then((raw) => {
      if (raw) {
        try { setTasks(JSON.parse(raw)); } catch { /* keep defaults */ }
      }
      setLoading(false);
    });
  }, []);

  // Load checked state for current week
  useEffect(() => {
    if (!api) return;
    api.get(`cleaning_log_${wk}`).then((raw) => {
      if (raw) {
        try { setChecked(JSON.parse(raw)); } catch { setChecked({}); }
      } else {
        setChecked({});
      }
    });
  }, [wk]);

  // Load past 4 weeks of stats for comparison
  useEffect(() => {
    if (!api) return;
    const loadStats = async () => {
      const stats = [];
      for (let i = 1; i <= 4; i++) {
        const m = addDays(startOfWeekMonday(today), (weekOffset - i) * 7);
        const k = weekKey(m);
        const raw = await api.get(`cleaning_log_${k}`);
        let completed = 0;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            completed = Object.values(parsed).filter(Boolean).length;
          } catch { /* skip */ }
        }
        stats.push({ weekKey: k, monday: m, completed });
      }
      setPastStats(stats);
    };
    loadStats();
  }, [today, weekOffset]);

  const saveTasks = useCallback((next) => {
    setTasks(next);
    if (api) api.set("cleaning_schedule", JSON.stringify(next));
  }, []);

  const saveChecked = useCallback((next) => {
    setChecked(next);
    if (api) api.set(`cleaning_log_${wk}`, JSON.stringify(next));
  }, [wk]);

  const toggleTask = useCallback((taskId) => {
    setChecked((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      if (api) api.set(`cleaning_log_${wk}`, JSON.stringify(next));
      return next;
    });
  }, [wk]);

  const addTask = useCallback((section) => {
    const label = newTaskLabel.trim();
    if (!label) return;
    const id = genId();
    const next = { ...tasks, [section]: [...tasks[section], { id, label }] };
    saveTasks(next);
    setNewTaskLabel("");
    setAddingTo(null);
  }, [newTaskLabel, tasks, saveTasks]);

  const removeTask = useCallback((section, taskId) => {
    const next = {
      ...tasks,
      [section]: tasks[section].filter((t) => t.id !== taskId),
    };
    saveTasks(next);
    // Also remove from checked
    setChecked((prev) => {
      const c = { ...prev };
      delete c[taskId];
      if (api) api.set(`cleaning_log_${wk}`, JSON.stringify(c));
      return c;
    });
  }, [tasks, saveTasks, wk]);

  // Focus input when adding
  useEffect(() => {
    if (addingTo && addInputRef.current) addInputRef.current.focus();
  }, [addingTo]);

  // Stats calculations
  const totalTasks = useMemo(
    () => Object.values(tasks).flat().length,
    [tasks]
  );
  const totalChecked = useMemo(
    () => Object.values(tasks).flat().filter((t) => checked[t.id]).length,
    [tasks, checked]
  );
  const overallPct = totalTasks ? Math.round((totalChecked / totalTasks) * 100) : 0;

  const sectionStats = useCallback(
    (section) => {
      const list = tasks[section] || [];
      const done = list.filter((t) => checked[t.id]).length;
      const pct = list.length ? Math.round((done / list.length) * 100) : 0;
      return { done, total: list.length, pct };
    },
    [tasks, checked]
  );

  if (loading) {
    return <div className="clean-loading">Loading...</div>;
  }

  return (
    <>
      <style>{`
        .clean-page { padding: 0 32px 48px; max-width: 860px; margin: 0 auto; }

        .clean-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 0 16px; border-bottom: 1px solid #e8e0d4; margin-bottom: 24px;
        }
        .clean-topbar h1 { font-size: 22px; font-weight: 700; color: #3d3529; margin: 0; }
        .clean-week-nav { display: flex; align-items: center; gap: 10px; }
        .clean-week-nav button {
          background: none; border: 1px solid #d6cfc4; border-radius: 6px;
          padding: 4px 10px; cursor: pointer; font-size: 14px; color: #6b5e4f;
          transition: background 0.15s;
        }
        .clean-week-nav button:hover { background: #ede7dc; }
        .clean-week-label { font-size: 14px; font-weight: 500; color: #6b5e4f; min-width: 170px; text-align: center; }
        .clean-today-btn {
          background: #5B7CF5 !important; color: #fff !important; border-color: #5B7CF5 !important;
          font-weight: 500;
        }
        .clean-today-btn:hover { background: #4a6be4 !important; }

        .clean-overview {
          display: flex; align-items: center; gap: 20px;
          background: #fbf7f0; border: 1px solid #e8e0d4; border-radius: 12px;
          padding: 16px 20px; margin-bottom: 24px;
        }
        .clean-overview-pct {
          font-size: 32px; font-weight: 700; color: #5B7CF5; min-width: 70px; text-align: center;
        }
        .clean-overview-bar { flex: 1; }
        .clean-overview-label { font-size: 13px; color: #8c7e6e; margin-bottom: 6px; }
        .clean-bar-track {
          height: 10px; background: #e8e0d4; border-radius: 5px; overflow: hidden;
        }
        .clean-bar-fill {
          height: 100%; border-radius: 5px; transition: width 0.3s ease;
        }
        .clean-overview-count { font-size: 13px; color: #8c7e6e; margin-top: 4px; }

        .clean-section { margin-bottom: 24px; }
        .clean-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .clean-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 600; color: #3d3529;
        }
        .clean-section-badge {
          font-size: 11px; font-weight: 600; padding: 2px 8px;
          border-radius: 10px; color: #fff;
        }
        .clean-section-pct { font-size: 13px; color: #8c7e6e; font-weight: 500; }

        .clean-section-bar {
          height: 6px; background: #e8e0d4; border-radius: 3px;
          overflow: hidden; margin-bottom: 10px;
        }
        .clean-section-bar-fill {
          height: 100%; border-radius: 3px; transition: width 0.3s ease;
        }

        .clean-task-list { display: flex; flex-direction: column; gap: 4px; }
        .clean-task {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px;
          background: #fbf7f0; border: 1px solid #e8e0d4;
          transition: background 0.15s, border-color 0.15s;
        }
        .clean-task:hover { border-color: #d0c8bb; }
        .clean-task.clean-task--done { background: #f0f8f0; border-color: #c8e6c8; }

        .clean-task-check {
          width: 20px; height: 20px; border-radius: 5px;
          border: 2px solid #c9c0b3; background: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .clean-task-check.checked {
          background: #22C55E; border-color: #22C55E;
        }
        .clean-task-check svg { opacity: 0; transition: opacity 0.15s; }
        .clean-task-check.checked svg { opacity: 1; }

        .clean-task-label {
          flex: 1; font-size: 14px; color: #3d3529;
          transition: color 0.15s, text-decoration 0.15s;
        }
        .clean-task--done .clean-task-label {
          color: #9c9488; text-decoration: line-through;
        }

        .clean-task-remove {
          opacity: 0; background: none; border: none; cursor: pointer;
          color: #c9c0b3; padding: 2px; transition: opacity 0.15s, color 0.15s;
        }
        .clean-task:hover .clean-task-remove { opacity: 1; }
        .clean-task-remove:hover { color: #e74c3c; }

        .clean-add-row {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px; margin-top: 4px;
        }
        .clean-add-btn {
          background: none; border: 1px dashed #c9c0b3; border-radius: 6px;
          padding: 6px 14px; cursor: pointer; font-size: 13px; color: #8c7e6e;
          transition: border-color 0.15s, color 0.15s;
        }
        .clean-add-btn:hover { border-color: #5B7CF5; color: #5B7CF5; }
        .clean-add-input {
          flex: 1; border: 1px solid #d6cfc4; border-radius: 6px;
          padding: 6px 10px; font-size: 13px; background: #fff;
          color: #3d3529; outline: none; font-family: inherit;
        }
        .clean-add-input:focus { border-color: #5B7CF5; }
        .clean-add-input::placeholder { color: #b8b0a4; }
        .clean-add-actions { display: flex; gap: 4px; }
        .clean-add-actions button {
          background: none; border: 1px solid #d6cfc4; border-radius: 6px;
          padding: 4px 10px; cursor: pointer; font-size: 12px;
          color: #6b5e4f; transition: all 0.15s;
        }
        .clean-add-actions .clean-save-btn { background: #5B7CF5; color: #fff; border-color: #5B7CF5; }
        .clean-add-actions .clean-save-btn:hover { background: #4a6be4; }

        .clean-stats {
          background: #fbf7f0; border: 1px solid #e8e0d4; border-radius: 12px;
          padding: 16px 20px; margin-top: 8px;
        }
        .clean-stats h3 { font-size: 14px; font-weight: 600; color: #3d3529; margin: 0 0 12px; }
        .clean-stats-grid { display: flex; gap: 12px; flex-wrap: wrap; }
        .clean-stat-card {
          flex: 1; min-width: 120px;
          background: #fff; border: 1px solid #e8e0d4; border-radius: 8px;
          padding: 10px 14px; text-align: center;
        }
        .clean-stat-week { font-size: 11px; color: #8c7e6e; margin-bottom: 4px; }
        .clean-stat-val { font-size: 20px; font-weight: 700; color: #5B7CF5; }
        .clean-stat-of { font-size: 11px; color: #8c7e6e; }

        .clean-loading {
          display: flex; align-items: center; justify-content: center;
          height: 200px; color: #8c7e6e; font-size: 14px;
        }
      `}</style>

      <div className="clean-page">
        {/* Topbar */}
        <div className="clean-topbar">
          <h1>Cleaning Schedule</h1>
          <div className="clean-week-nav">
            <button onClick={() => setWeekOffset((w) => w - 1)}>&larr;</button>
            <span className="clean-week-label">
              {fmtShort(monday)} &mdash; {fmtShort(sunday)}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)}>&rarr;</button>
            {!isCurrentWeek && (
              <button className="clean-today-btn" onClick={() => setWeekOffset(0)}>
                This Week
              </button>
            )}
          </div>
        </div>

        {/* Overall progress */}
        <div className="clean-overview">
          <div className="clean-overview-pct">{overallPct}%</div>
          <div className="clean-overview-bar">
            <div className="clean-overview-label">Overall completion this week</div>
            <div className="clean-bar-track">
              <div
                className="clean-bar-fill"
                style={{ width: `${overallPct}%`, background: "#5B7CF5" }}
              />
            </div>
            <div className="clean-overview-count">
              {totalChecked} of {totalTasks} tasks completed
            </div>
          </div>
        </div>

        {/* Sections */}
        {["daily", "weekly", "monthly"].map((section) => {
          const meta = SECTION_META[section];
          const stats = sectionStats(section);
          return (
            <div className="clean-section" key={section}>
              <div className="clean-section-header">
                <div className="clean-section-title">
                  <span
                    className="clean-section-badge"
                    style={{ background: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span>{stats.done}/{stats.total}</span>
                </div>
                <span className="clean-section-pct">{stats.pct}%</span>
              </div>
              <div className="clean-section-bar">
                <div
                  className="clean-section-bar-fill"
                  style={{ width: `${stats.pct}%`, background: meta.color }}
                />
              </div>
              <div className="clean-task-list">
                {(tasks[section] || []).map((task) => {
                  const done = !!checked[task.id];
                  return (
                    <div
                      className={`clean-task${done ? " clean-task--done" : ""}`}
                      key={task.id}
                    >
                      <div
                        className={`clean-task-check${done ? " checked" : ""}`}
                        onClick={() => toggleTask(task.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6l3 3 5-6"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="clean-task-label">{task.label}</span>
                      <button
                        className="clean-task-remove"
                        title="Remove task"
                        onClick={() => removeTask(section, task.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 3l8 8M11 3l-8 8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add task row */}
              {addingTo === section ? (
                <div className="clean-add-row">
                  <input
                    ref={addInputRef}
                    className="clean-add-input"
                    placeholder={`New ${meta.label.toLowerCase()} task...`}
                    value={newTaskLabel}
                    onChange={(e) => setNewTaskLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask(section);
                      if (e.key === "Escape") { setAddingTo(null); setNewTaskLabel(""); }
                    }}
                  />
                  <div className="clean-add-actions">
                    <button
                      className="clean-save-btn"
                      onClick={() => addTask(section)}
                    >
                      Add
                    </button>
                    <button onClick={() => { setAddingTo(null); setNewTaskLabel(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="clean-add-row">
                  <button
                    className="clean-add-btn"
                    onClick={() => { setAddingTo(section); setNewTaskLabel(""); }}
                  >
                    + Add task
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Week-over-week stats */}
        <div className="clean-stats">
          <h3>Week-over-Week Completion</h3>
          <div className="clean-stats-grid">
            <div className="clean-stat-card">
              <div className="clean-stat-week">This week</div>
              <div className="clean-stat-val">{totalChecked}</div>
              <div className="clean-stat-of">of {totalTasks} tasks</div>
            </div>
            {pastStats.map((s) => (
              <div className="clean-stat-card" key={s.weekKey}>
                <div className="clean-stat-week">
                  {fmtShort(s.monday)}
                </div>
                <div className="clean-stat-val">{s.completed}</div>
                <div className="clean-stat-of">of {totalTasks} tasks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
