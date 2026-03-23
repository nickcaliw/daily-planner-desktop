import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "relationships";

const TYPES = ["Partner", "Family", "Close Friend", "Friend", "Mentor", "Mentee"];
const FREQUENCIES = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "Quarterly"];

const FREQ_DAYS = {
  Daily: 1,
  Weekly: 7,
  "Bi-Weekly": 14,
  Monthly: 30,
  Quarterly: 90,
};

const TYPE_COLORS = {
  Partner: "#e91e63",
  Family: "#9c27b0",
  "Close Friend": "#5B7CF5",
  Friend: "#00bcd4",
  Mentor: "#ff9800",
  Mentee: "#4caf50",
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 86400000);
}

function isOverdue(item) {
  const days = daysSince(item.lastContact);
  if (days === null) return false;
  const threshold = FREQ_DAYS[item.frequency] || 30;
  return days > threshold;
}

function isWarning(item) {
  const days = daysSince(item.lastContact);
  if (days === null) return false;
  const threshold = FREQ_DAYS[item.frequency] || 30;
  return days > threshold * 0.7 && days <= threshold;
}

function Stars({ value, onChange, readOnly }) {
  return (
    <span className="relStars">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`relStar ${n <= value ? "relStarFilled" : ""}`}
          onClick={readOnly ? undefined : () => onChange(n)}
          style={readOnly ? {} : { cursor: "pointer" }}
        >
          {n <= value ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

export default function RelationshipTrackerPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems((await api.list(COLLECTION)) || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => {
      if (api) api.save(id, COLLECTION, data);
    }, 300);
  }, []);

  const addItem = async () => {
    const id = crypto.randomUUID();
    const data = {
      name: "New Relationship",
      type: "Friend",
      frequency: "Monthly",
      lastContact: new Date().toISOString().split("T")[0],
      quality: 3,
      goals: "",
      notes: "",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setEditingId(id);
  };

  const deleteItem = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) setEditingId(null);
    refresh();
  };

  const sorted = [...items].sort((a, b) => {
    const da = daysSince(a.lastContact) ?? -1;
    const db = daysSince(b.lastContact) ?? -1;
    return db - da;
  });

  return (
    <div className="relPage">
      <style>{`
        .relPage {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .relPage .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 28px 10px 28px;
          flex-shrink: 0;
        }
        .relPage .topbarLeft {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .relPage .pageTitle {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }
        .relPage .relCount {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          background: rgba(91,124,245,0.10);
          border-radius: 8px;
          padding: 3px 10px;
        }
        .relBody {
          flex: 1;
          overflow-y: auto;
          padding: 8px 28px 28px;
        }
        .relGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }
        .relCard {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e8e0d4);
          border-radius: 12px;
          padding: 16px;
          transition: box-shadow 0.15s;
        }
        .relCard:hover {
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .relCardOverdue {
          background: #fff8e1;
          border-color: #ffcc02;
        }
        .relCardWarning {
          background: #fff3e0;
          border-color: #ffb74d;
        }
        .relCardHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .relCardName {
          font-size: 16px;
          font-weight: 650;
          color: var(--text);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .relTypeBadge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          color: #fff;
          white-space: nowrap;
        }
        .relCardMeta {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          color: var(--muted, #999);
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .relDaysSince {
          font-weight: 600;
        }
        .relDaysOverdue {
          color: #e53935;
        }
        .relDaysOk {
          color: #4caf50;
        }
        .relDaysWarn {
          color: #ff9800;
        }
        .relFreq {
          font-size: 12px;
          color: var(--muted, #999);
        }
        .relStars {
          font-size: 16px;
          letter-spacing: 1px;
        }
        .relStar {
          color: #ccc;
        }
        .relStarFilled {
          color: #f5b942;
        }
        .relCardActions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .relEditBtn, .relContactBtn {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid var(--border, #e8e0d4);
          background: transparent;
          color: var(--text);
          cursor: pointer;
        }
        .relContactBtn {
          background: var(--accent, #5B7CF5);
          color: #fff;
          border-color: var(--accent, #5B7CF5);
        }
        .relEditPanel {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border, #e8e0d4);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .relEditRow {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .relEditLabel {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #999);
        }
        .relEditInput, .relEditSelect {
          font-size: 14px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border, #e8e0d4);
          background: var(--bg, #f6f1e8);
          color: var(--text);
          font-family: inherit;
          outline: none;
        }
        .relEditInput:focus, .relEditSelect:focus, .relEditTextarea:focus {
          border-color: var(--accent, #5B7CF5);
        }
        .relEditTextarea {
          font-size: 14px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border, #e8e0d4);
          background: var(--bg, #f6f1e8);
          color: var(--text);
          font-family: inherit;
          outline: none;
          resize: vertical;
          min-height: 48px;
        }
        .relDeleteBtn {
          font-size: 12px;
          padding: 5px 14px;
          border-radius: 6px;
          border: 1px solid #e53935;
          background: transparent;
          color: #e53935;
          cursor: pointer;
          align-self: flex-start;
          margin-top: 4px;
        }
        .relDeleteBtn:hover {
          background: #e53935;
          color: #fff;
        }
        .relEmpty {
          font-size: 15px;
          color: var(--muted, #999);
          text-align: center;
          padding: 40px 0;
        }
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Relationships</h1>
          <div className="relCount">{items.length} people</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add</button>
        </div>
      </div>

      <div className="relBody">
        <div className="relGrid">
          {sorted.map(item => {
            const days = daysSince(item.lastContact);
            const overdue = isOverdue(item);
            const warning = isWarning(item);
            const isEditing = editingId === item.id;
            let daysClass = "relDaysOk";
            if (overdue) daysClass = "relDaysOverdue";
            else if (warning) daysClass = "relDaysWarn";

            return (
              <div
                className={`relCard ${overdue ? "relCardOverdue" : ""} ${warning && !overdue ? "relCardWarning" : ""}`}
                key={item.id}
              >
                <div className="relCardHeader">
                  <div className="relCardName">{item.name || "Unnamed"}</div>
                  <span className="relTypeBadge" style={{ background: TYPE_COLORS[item.type] || "#607d8b" }}>
                    {item.type || "Friend"}
                  </span>
                </div>
                <div className="relCardMeta">
                  <span className={`relDaysSince ${daysClass}`}>
                    {days === null ? "No contact date" : days === 0 ? "Today" : `${days}d ago`}
                  </span>
                  <span className="relFreq">{item.frequency || "Monthly"}</span>
                  <Stars value={item.quality || 0} readOnly />
                </div>
                <div className="relCardActions">
                  <button
                    className="relContactBtn"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      save(item.id, { ...item, lastContact: today });
                    }}
                    type="button"
                  >
                    Log Contact
                  </button>
                  <button
                    className="relEditBtn"
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                    type="button"
                  >
                    {isEditing ? "Close" : "Edit"}
                  </button>
                </div>

                {isEditing && (
                  <div className="relEditPanel">
                    <div className="relEditRow">
                      <label className="relEditLabel">Name</label>
                      <input className="relEditInput" value={item.name || ""}
                        onChange={e => save(item.id, { ...item, name: e.target.value })} />
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Type</label>
                      <select className="relEditSelect" value={item.type || "Friend"}
                        onChange={e => save(item.id, { ...item, type: e.target.value })}>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Frequency</label>
                      <select className="relEditSelect" value={item.frequency || "Monthly"}
                        onChange={e => save(item.id, { ...item, frequency: e.target.value })}>
                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Last Contact</label>
                      <input type="date" className="relEditInput" value={item.lastContact || ""}
                        onChange={e => save(item.id, { ...item, lastContact: e.target.value })} />
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Quality</label>
                      <Stars value={item.quality || 0} onChange={n => save(item.id, { ...item, quality: n })} />
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Goals</label>
                      <textarea className="relEditTextarea" value={item.goals || ""} rows={2}
                        onChange={e => save(item.id, { ...item, goals: e.target.value })}
                        placeholder="What do you want to work on in this relationship?" />
                    </div>
                    <div className="relEditRow">
                      <label className="relEditLabel">Notes</label>
                      <textarea className="relEditTextarea" value={item.notes || ""} rows={2}
                        onChange={e => save(item.id, { ...item, notes: e.target.value })}
                        placeholder="Optional notes..." />
                    </div>
                    <button className="relDeleteBtn" onClick={() => deleteItem(item.id)} type="button">
                      Delete Relationship
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="relEmpty">
              No relationships tracked yet. Click <strong>+ Add</strong> to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
