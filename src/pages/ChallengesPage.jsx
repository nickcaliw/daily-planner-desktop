import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ymd, addDays } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "challenges";
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const DURATIONS = [7, 14, 21, 30];
const STATUS_OPTIONS = ["active", "completed", "abandoned"];

/* ──────────────────── helpers ──────────────────── */

function getStreak(checkIns, startDate, duration) {
  let streak = 0, best = 0;
  for (let i = 0; i < duration; i++) {
    const d = ymd(addDays(new Date(startDate), i));
    if (checkIns[d]) { streak++; if (streak > best) best = streak; }
    else streak = 0;
  }
  return { current: streak, best };
}

function getProgress(checkIns, duration) {
  const done = Object.values(checkIns || {}).filter(Boolean).length;
  return { done, total: duration, pct: Math.round((done / duration) * 100) };
}

/* ──────────────────── component ──────────────────── */

export default function ChallengesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("active");
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems(await api.list(COLLECTION) || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => { if (api) api.save(id, COLLECTION, data); }, 300);
  }, []);

  const addChallenge = async () => {
    const id = genId();
    const data = {
      name: "", description: "", duration: 30,
      startDate: ymd(new Date()), checkIns: {}, status: "active",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setEditingId(id);
  };

  const deleteChallenge = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) setEditingId(null);
    setConfirmDel(null);
    refresh();
  };

  const toggleDay = useCallback((item, dateStr) => {
    const today = ymd(new Date());
    if (dateStr > today) return; // can't check future days
    const updated = { ...item.checkIns, [dateStr]: !item.checkIns?.[dateStr] };
    save(item.id, { ...item, checkIns: updated });
  }, [save]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(item => item.status === filter);
  }, [items, filter]);

  const today = ymd(new Date());

  return (
    <div className="daysPage">
      <style>{`
        .chalGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;padding:20px 24px;}
        .chalCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:18px;transition:box-shadow .15s,border-color .15s;}
        .chalCard:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.1);}
        .chalCardActive{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.15);}
        .chalCardHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px;}
        .chalName{font-size:16px;font-weight:700;color:var(--text);flex:1;min-width:0;word-break:break-word;}
        .chalNameEmpty{color:var(--muted);font-style:italic;font-weight:400;}
        .chalDesc{font-size:13px;color:var(--muted);margin-bottom:10px;line-height:1.4;}
        .chalStatusBadge{font-size:11px;padding:2px 10px;border-radius:10px;font-weight:600;text-transform:capitalize;flex-shrink:0;}
        .chalStatusActive{background:#e3f2fd;color:#1565c0;}
        .chalStatusCompleted{background:#e8f5e9;color:#2e7d32;}
        .chalStatusAbandoned{background:#fce4ec;color:#c62828;}
        .chalMeta{display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:12px;flex-wrap:wrap;}
        .chalMetaItem{display:flex;align-items:center;gap:4px;}
        .chalDayGrid{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;}
        .chalDayCircle{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;cursor:pointer;transition:all .12s;position:relative;}
        .chalDayCircle:hover{transform:scale(1.15);}
        .chalDayDone{background:var(--accent);border-color:var(--accent);color:#fff;}
        .chalDayMissed{background:#fff3e0;border-color:#ffcc80;color:#e65100;}
        .chalDayFuture{background:var(--bg);border-color:var(--border);color:var(--muted);cursor:default;opacity:.5;}
        .chalDayFuture:hover{transform:none;}
        .chalDayToday{border-color:var(--accent);border-width:2px;box-shadow:0 0 0 2px rgba(91,124,245,.2);}
        .chalProgress{margin-bottom:8px;}
        .chalProgressBar{height:6px;background:var(--bg);border-radius:4px;overflow:hidden;margin-bottom:4px;}
        .chalProgressFill{height:100%;background:var(--accent);border-radius:4px;transition:width .3s;}
        .chalProgressLabel{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);}
        .chalEditPanel{margin-top:14px;border-top:1px solid var(--border);padding-top:14px;display:flex;flex-direction:column;gap:10px;}
        .chalEditRow{display:flex;flex-direction:column;gap:3px;}
        .chalEditLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;}
        .chalEditInput{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .chalEditInput:focus{border-color:var(--accent);}
        .chalEditTextarea{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;resize:vertical;min-height:50px;transition:border-color .15s;}
        .chalEditTextarea:focus{border-color:var(--accent);}
        .chalEditSelect{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .chalEditSelect:focus{border-color:var(--accent);}
        .chalSelectRow{display:flex;gap:8px;}
        .chalDeleteBtn{background:none;border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;align-self:flex-start;}
        .chalDeleteBtn:hover{background:#e53935;color:#fff;}
        .chalEmpty{grid-column:1/-1;text-align:center;padding:48px 0;color:var(--muted);font-size:15px;}
        .chalStreakBadge{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:600;color:#e65100;background:#fff3e0;padding:2px 8px;border-radius:10px;}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Challenges</h1>
          <div className="weekBadge">{items.filter(i => i.status === "active").length} active</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["active", "completed", "all"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">{f}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addChallenge} type="button">+ New Challenge</button>
        </div>
      </div>

      <div className="dsBody">
        <div className="chalGrid">
          {filtered.length > 0 ? filtered.map(item => {
            const isEditing = editingId === item.id;
            const dur = item.duration || 30;
            const start = item.startDate || today;
            const checkIns = item.checkIns || {};
            const progress = getProgress(checkIns, dur);
            const streak = getStreak(checkIns, start, dur);

            // Build day array
            const days = [];
            for (let i = 0; i < dur; i++) {
              const d = addDays(new Date(start), i);
              const ds = ymd(d);
              const done = !!checkIns[ds];
              const isFuture = ds > today;
              const isToday = ds === today;
              const missed = !done && !isFuture;
              days.push({ dayNum: i + 1, date: ds, done, isFuture, isToday, missed });
            }

            return (
              <div className={`chalCard ${isEditing ? "chalCardActive" : ""}`} key={item.id}
                onClick={() => { if (!isEditing) setEditingId(item.id); }}>
                <div className="chalCardHead">
                  <div className={`chalName ${!item.name ? "chalNameEmpty" : ""}`}>
                    {item.name || "Untitled Challenge"}
                  </div>
                  <span className={`chalStatusBadge chalStatus${(item.status || "active").charAt(0).toUpperCase() + (item.status || "active").slice(1)}`}>
                    {item.status || "active"}
                  </span>
                </div>
                {item.description && <div className="chalDesc">{item.description}</div>}

                <div className="chalMeta">
                  <span className="chalMetaItem">{dur} days</span>
                  <span className="chalMetaItem">Started {start}</span>
                  {streak.current > 0 && (
                    <span className="chalStreakBadge">{streak.current} day streak</span>
                  )}
                </div>

                <div className="chalDayGrid">
                  {days.map(day => (
                    <div key={day.date}
                      className={`chalDayCircle${day.done ? " chalDayDone" : day.isFuture ? " chalDayFuture" : " chalDayMissed"}${day.isToday ? " chalDayToday" : ""}`}
                      title={`Day ${day.dayNum} — ${day.date}`}
                      onClick={e => { e.stopPropagation(); toggleDay(item, day.date); }}>
                      {day.done ? "\u2713" : day.dayNum}
                    </div>
                  ))}
                </div>

                <div className="chalProgress">
                  <div className="chalProgressBar">
                    <div className="chalProgressFill" style={{ width: `${progress.pct}%` }} />
                  </div>
                  <div className="chalProgressLabel">
                    <span>{progress.done}/{progress.total} days</span>
                    <span>{progress.pct}%</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="chalEditPanel" onClick={e => e.stopPropagation()}>
                    <div className="chalEditRow">
                      <label className="chalEditLabel">Challenge Name</label>
                      <input className="chalEditInput" value={item.name || ""}
                        placeholder="e.g. 30 Days of Running"
                        onChange={e => save(item.id, { ...item, name: e.target.value })} />
                    </div>
                    <div className="chalEditRow">
                      <label className="chalEditLabel">Description</label>
                      <textarea className="chalEditTextarea" value={item.description || ""} rows={2}
                        placeholder="What's this challenge about?"
                        onChange={e => save(item.id, { ...item, description: e.target.value })} />
                    </div>
                    <div className="chalSelectRow">
                      <div className="chalEditRow" style={{ flex: 1 }}>
                        <label className="chalEditLabel">Duration</label>
                        <select className="chalEditSelect" value={item.duration || 30}
                          onChange={e => save(item.id, { ...item, duration: Number(e.target.value) })}>
                          {DURATIONS.map(d => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </div>
                      <div className="chalEditRow" style={{ flex: 1 }}>
                        <label className="chalEditLabel">Start Date</label>
                        <input type="date" className="chalEditInput" value={item.startDate || ""}
                          onChange={e => save(item.id, { ...item, startDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="chalEditRow">
                      <label className="chalEditLabel">Status</label>
                      <select className="chalEditSelect" value={item.status || "active"}
                        onChange={e => save(item.id, { ...item, status: e.target.value })}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button className="chalDeleteBtn"
                      onClick={() => setConfirmDel(item.id)} type="button">
                      Delete Challenge
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="chalEmpty">
              No {filter !== "all" ? filter : ""} challenges yet. Click <strong>+ New Challenge</strong> to get started.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Challenge"
        message="This will permanently delete this challenge and all check-in data."
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteChallenge(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
