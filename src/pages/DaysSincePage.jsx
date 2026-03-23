import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.daysSinceApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const COLORS = ["#5B7CF5", "#4caf50", "#ff9800", "#e91e63", "#9c27b0", "#00bcd4", "#795548", "#607d8b"];

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 86400000);
}

function formatDays(n) {
  if (n === null) return "—";
  if (n === 0) return "Today";
  if (n === 1) return "1 day";
  return `${n} days`;
}

function urgencyColor(days, warnAt) {
  if (days === null) return "var(--muted)";
  if (warnAt && days >= warnAt) return "#e53935";
  if (warnAt && days >= warnAt * 0.7) return "#ff9800";
  return "#4caf50";
}

export default function DaysSincePage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [sortBy, setSortBy] = useState("days"); // "days" | "name" | "recent"
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems(await api.list() || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => { if (api) api.save(id, data); }, 300);
  }, []);

  const addItem = async () => {
    const id = genId();
    const data = {
      label: "New Item",
      lastDate: new Date().toISOString().split("T")[0],
      color: COLORS[items.length % COLORS.length],
      warnDays: 0,
      notes: "",
    };
    if (api) await api.save(id, data);
    await refresh();
    setEditingId(id);
  };

  const deleteItem = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) setEditingId(null);
    refresh();
  };

  const resetItem = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const today = new Date().toISOString().split("T")[0];
    save(id, { ...item, lastDate: today });
  };

  const sorted = [...items].sort((a, b) => {
    if (sortBy === "days") {
      const da = daysBetween(a.lastDate) ?? -1;
      const db2 = daysBetween(b.lastDate) ?? -1;
      return db2 - da;
    }
    if (sortBy === "name") return (a.label || "").localeCompare(b.label || "");
    return 0; // recent = default order from DB (updated_at DESC)
  });

  const editing = items.find(i => i.id === editingId);

  return (
    <div className="daysPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Days Since</h1>
          <div className="weekBadge">{items.length} trackers</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["days", "name", "recent"].map(s => (
              <button key={s} className={`tabBtn ${sortBy === s ? "active" : ""}`}
                onClick={() => setSortBy(s)} type="button">{s}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add</button>
        </div>
      </div>

      <div className="dsBody">
        <div className="dsGrid">
          {sorted.map(item => {
            const days = daysBetween(item.lastDate);
            const color = urgencyColor(days, item.warnDays);
            return (
              <div className={`dsCard ${item.id === editingId ? "dsCardActive" : ""}`} key={item.id}>
                <div className="dsCardTop" style={{ borderLeft: `4px solid ${item.color || "var(--accent)"}` }}>
                  <div className="dsCardDays" style={{ color }}>{formatDays(days)}</div>
                  <div className="dsCardLabel">{item.label}</div>
                  {item.warnDays > 0 && days >= item.warnDays && (
                    <div className="dsCardWarn">Overdue</div>
                  )}
                  {item.lastDate && (
                    <div className="dsCardDate">
                      Last: {new Date(item.lastDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
                <div className="dsCardActions">
                  <button className="btn btnPrimary dsResetBtn" onClick={() => resetItem(item.id)} type="button">
                    Reset
                  </button>
                  <button className="btn dsEditBtn" onClick={() => setEditingId(editingId === item.id ? null : item.id)} type="button">
                    Edit
                  </button>
                </div>

                {editingId === item.id && (
                  <div className="dsEditPanel">
                    <div className="dsEditRow">
                      <label className="dsEditLabel">Name</label>
                      <input className="dsEditInput" value={item.label}
                        onChange={e => save(item.id, { ...item, label: e.target.value })} />
                    </div>
                    <div className="dsEditRow">
                      <label className="dsEditLabel">Last Date</label>
                      <input type="date" className="dsEditInput" value={item.lastDate || ""}
                        onChange={e => save(item.id, { ...item, lastDate: e.target.value })} />
                    </div>
                    <div className="dsEditRow">
                      <label className="dsEditLabel">Warn after (days)</label>
                      <input type="number" className="dsEditInput" value={item.warnDays || ""}
                        placeholder="0 = no warning" min="0"
                        onChange={e => save(item.id, { ...item, warnDays: Number(e.target.value) || 0 })} />
                    </div>
                    <div className="dsEditRow">
                      <label className="dsEditLabel">Color</label>
                      <div className="dsColorRow">
                        {COLORS.map(c => (
                          <button key={c} className={`dsColorBtn ${item.color === c ? "dsColorBtnActive" : ""}`}
                            style={{ background: c }} onClick={() => save(item.id, { ...item, color: c })} type="button" />
                        ))}
                      </div>
                    </div>
                    <div className="dsEditRow">
                      <label className="dsEditLabel">Notes</label>
                      <textarea className="dsEditTextarea" value={item.notes || ""} rows={2}
                        onChange={e => save(item.id, { ...item, notes: e.target.value })}
                        placeholder="Optional notes…" />
                    </div>
                    <button className="btn dsDeleteBtn" onClick={() => deleteItem(item.id)} type="button">
                      Delete Tracker
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="dsEmpty">
              <div style={{ fontSize: 15, color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
                No trackers yet. Click <strong>+ Add</strong> to start tracking.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
