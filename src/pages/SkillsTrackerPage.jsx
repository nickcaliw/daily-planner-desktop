import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "skills";
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const CATEGORIES = ["Technical", "Creative", "Physical", "Language", "Business", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LEVEL_COLORS = {
  Beginner: { bg: "#e3f2fd", color: "#1565c0", border: "#bbdefb" },
  Intermediate: { bg: "#fff3e0", color: "#e65100", border: "#ffe0b2" },
  Advanced: { bg: "#e8f5e9", color: "#2e7d32", border: "#c8e6c9" },
  Expert: { bg: "#f3e5f5", color: "#7b1fa2", border: "#e1bee7" },
};
const CATEGORY_ICONS = {
  Technical: "\u2699\ufe0f", Creative: "\ud83c\udfa8", Physical: "\ud83c\udfc3",
  Language: "\ud83d\udde3\ufe0f", Business: "\ud83d\udcbc", Other: "\ud83d\udccc",
};

/* ──────────────────── component ──────────────────── */

export default function SkillsTrackerPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [logHoursId, setLogHoursId] = useState(null);
  const [logHoursVal, setLogHoursVal] = useState("");
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

  const addSkill = async () => {
    const id = genId();
    const data = {
      name: "", category: "Technical", level: "Beginner",
      hours: 0, target: "", notes: "",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setEditingId(id);
  };

  const deleteSkill = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) setEditingId(null);
    setConfirmDel(null);
    refresh();
  };

  const submitLogHours = (item) => {
    const hrs = parseFloat(logHoursVal);
    if (!isNaN(hrs) && hrs > 0) {
      save(item.id, { ...item, hours: (item.hours || 0) + hrs });
    }
    setLogHoursId(null);
    setLogHoursVal("");
  };

  const totalHours = useMemo(() =>
    items.reduce((sum, i) => sum + (i.hours || 0), 0),
  [items]);

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  return (
    <div className="daysPage">
      <style>{`
        .skillGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding:20px 24px;}
        .skillCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:18px;cursor:pointer;transition:box-shadow .15s,border-color .15s;}
        .skillCard:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.1);}
        .skillCardActive{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.15);}
        .skillCardHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;}
        .skillName{font-size:16px;font-weight:700;color:var(--text);flex:1;min-width:0;word-break:break-word;}
        .skillNameEmpty{color:var(--muted);font-style:italic;font-weight:400;}
        .skillLevelBadge{font-size:11px;padding:3px 10px;border-radius:10px;font-weight:700;flex-shrink:0;border:1.5px solid;}
        .skillCatRow{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);margin-bottom:10px;}
        .skillMeta{display:flex;gap:14px;font-size:13px;color:var(--muted);margin-bottom:8px;flex-wrap:wrap;}
        .skillMetaItem{display:flex;align-items:center;gap:4px;}
        .skillMetaHours{font-weight:700;color:var(--text);}
        .skillTarget{font-size:12px;color:var(--muted);background:var(--bg);padding:6px 10px;border-radius:8px;margin-bottom:8px;line-height:1.4;}
        .skillTargetLabel{font-weight:600;color:var(--text);margin-right:4px;}
        .skillNotes{font-size:12px;color:var(--muted);line-height:1.4;margin-bottom:4px;}
        .skillLogRow{display:flex;align-items:center;gap:6px;margin-top:8px;}
        .skillLogInput{border:1.5px solid var(--border);border-radius:8px;padding:5px 8px;font-size:13px;width:80px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .skillLogInput:focus{border-color:var(--accent);}
        .skillLogBtn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity .15s;}
        .skillLogBtn:hover{opacity:.85;}
        .skillLogCancel{background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:5px 8px;}
        .skillAddHoursBtn{background:none;border:1.5px solid var(--accent);color:var(--accent);border-radius:8px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,color .15s;}
        .skillAddHoursBtn:hover{background:var(--accent);color:#fff;}
        .skillEditPanel{margin-top:14px;border-top:1px solid var(--border);padding-top:14px;display:flex;flex-direction:column;gap:10px;}
        .skillEditRow{display:flex;flex-direction:column;gap:3px;}
        .skillEditLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;}
        .skillEditInput{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .skillEditInput:focus{border-color:var(--accent);}
        .skillEditTextarea{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;resize:vertical;min-height:50px;transition:border-color .15s;}
        .skillEditTextarea:focus{border-color:var(--accent);}
        .skillEditSelect{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .skillEditSelect:focus{border-color:var(--accent);}
        .skillSelectRow{display:flex;gap:8px;}
        .skillDeleteBtn{background:none;border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;align-self:flex-start;}
        .skillDeleteBtn:hover{background:#e53935;color:#fff;}
        .skillEmpty{grid-column:1/-1;text-align:center;padding:48px 0;color:var(--muted);font-size:15px;}
        .skillTotalBadge{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);padding:0 24px 4px;}
        .skillTotalHours{font-weight:700;font-size:18px;color:var(--text);}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Skills Tracker</h1>
          <div className="weekBadge">{items.length} skills</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["All", ...CATEGORIES].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">
                {f !== "All" && CATEGORY_ICONS[f] ? `${CATEGORY_ICONS[f]} ` : ""}{f}
              </button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addSkill} type="button">+ New Skill</button>
        </div>
      </div>

      <div className="dsBody">
        {items.length > 0 && (
          <div className="skillTotalBadge">
            Total hours practiced: <span className="skillTotalHours">{totalHours.toFixed(1)}</span>
          </div>
        )}

        <div className="skillGrid">
          {filtered.length > 0 ? filtered.map(item => {
            const isEditing = editingId === item.id;
            const isLogging = logHoursId === item.id;
            const lvl = LEVEL_COLORS[item.level] || LEVEL_COLORS.Beginner;

            return (
              <div className={`skillCard ${isEditing ? "skillCardActive" : ""}`} key={item.id}
                onClick={() => { if (!isEditing) setEditingId(item.id); }}>
                <div className="skillCardHead">
                  <div className={`skillName ${!item.name ? "skillNameEmpty" : ""}`}>
                    {item.name || "Untitled Skill"}
                  </div>
                  <span className="skillLevelBadge"
                    style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
                    {item.level || "Beginner"}
                  </span>
                </div>

                <div className="skillCatRow">
                  {CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other} {item.category || "Other"}
                </div>

                <div className="skillMeta">
                  <span className="skillMetaItem">
                    <span className="skillMetaHours">{(item.hours || 0).toFixed(1)}</span> hours
                  </span>
                </div>

                {item.target && (
                  <div className="skillTarget">
                    <span className="skillTargetLabel">Target:</span>{item.target}
                  </div>
                )}

                {item.notes && !isEditing && (
                  <div className="skillNotes">{item.notes}</div>
                )}

                {!isEditing && !isLogging && (
                  <div style={{ marginTop: 8 }}>
                    <button className="skillAddHoursBtn" type="button"
                      onClick={e => { e.stopPropagation(); setLogHoursId(item.id); setLogHoursVal(""); }}>
                      + Log Hours
                    </button>
                  </div>
                )}

                {isLogging && !isEditing && (
                  <div className="skillLogRow" onClick={e => e.stopPropagation()}>
                    <input className="skillLogInput" type="number" step="0.25" min="0"
                      placeholder="hrs" value={logHoursVal} autoFocus
                      onChange={e => setLogHoursVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") submitLogHours(item); if (e.key === "Escape") setLogHoursId(null); }} />
                    <button className="skillLogBtn" type="button"
                      onClick={() => submitLogHours(item)}>Add</button>
                    <button className="skillLogCancel" type="button"
                      onClick={() => setLogHoursId(null)}>Cancel</button>
                  </div>
                )}

                {isEditing && (
                  <div className="skillEditPanel" onClick={e => e.stopPropagation()}>
                    <div className="skillEditRow">
                      <label className="skillEditLabel">Skill Name</label>
                      <input className="skillEditInput" value={item.name || ""}
                        placeholder="e.g. TypeScript, Piano, Spanish"
                        onChange={e => save(item.id, { ...item, name: e.target.value })} />
                    </div>
                    <div className="skillSelectRow">
                      <div className="skillEditRow" style={{ flex: 1 }}>
                        <label className="skillEditLabel">Category</label>
                        <select className="skillEditSelect" value={item.category || "Technical"}
                          onChange={e => save(item.id, { ...item, category: e.target.value })}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="skillEditRow" style={{ flex: 1 }}>
                        <label className="skillEditLabel">Level</label>
                        <select className="skillEditSelect" value={item.level || "Beginner"}
                          onChange={e => save(item.id, { ...item, level: e.target.value })}>
                          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="skillEditRow">
                      <label className="skillEditLabel">Hours Practiced</label>
                      <input className="skillEditInput" type="number" step="0.25" min="0"
                        value={item.hours || 0}
                        onChange={e => save(item.id, { ...item, hours: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="skillEditRow">
                      <label className="skillEditLabel">Target / Goal</label>
                      <input className="skillEditInput" value={item.target || ""}
                        placeholder="e.g. Build a full-stack app, Pass B2 exam"
                        onChange={e => save(item.id, { ...item, target: e.target.value })} />
                    </div>
                    <div className="skillEditRow">
                      <label className="skillEditLabel">Notes</label>
                      <textarea className="skillEditTextarea" value={item.notes || ""} rows={2}
                        placeholder="Resources, progress notes, etc."
                        onChange={e => save(item.id, { ...item, notes: e.target.value })} />
                    </div>
                    <button className="skillDeleteBtn"
                      onClick={() => setConfirmDel(item.id)} type="button">
                      Delete Skill
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="skillEmpty">
              No {filter !== "All" ? filter.toLowerCase() : ""} skills yet. Click <strong>+ New Skill</strong> to start tracking.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Skill"
        message="This will permanently delete this skill and all logged hours."
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteSkill(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
