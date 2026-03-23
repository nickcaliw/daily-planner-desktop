import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const TYPES = ["goal", "skill", "note", "achievement"];
const STATUSES = ["planned", "in-progress", "completed"];
const PRIORITIES = ["high", "medium", "low"];
const TAB_FILTERS = ["All", "Goals", "Skills", "Notes", "Achievements"];

const PRIORITY_COLORS = {
  high: "#e74c3c",
  medium: "#f39c12",
  low: "#27ae60",
};

const STATUS_LABELS = {
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function CareerPage() {
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  const refresh = useCallback(async () => {
    if (api) {
      const data = await api.list("career");
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...data } : it));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (api) api.save(id, "career", data);
    }, 300);
  }, []);

  const createItem = async () => {
    const id = genId();
    const data = {
      title: "New Item",
      type: "goal",
      description: "",
      status: "planned",
      priority: "medium",
      targetDate: "",
      createdAt: new Date().toISOString(),
    };
    if (api) await api.save(id, "career", data);
    await refresh();
    setExpandedId(id);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const deleteItem = async (id) => {
    if (api) await api.delete(id);
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
    refresh();
  };

  const filtered = items.filter(it => {
    if (filter === "All") return true;
    if (filter === "Goals") return it.type === "goal";
    if (filter === "Skills") return it.type === "skill";
    if (filter === "Notes") return it.type === "note";
    if (filter === "Achievements") return it.type === "achievement";
    return true;
  });

  const activeCount = items.filter(it => it.status !== "completed").length;

  if (loading) {
    return (
      <div className="careerPage">
        <div className="topbar">
          <div className="topbarLeft">
            <h1 className="pageTitle">Career</h1>
          </div>
        </div>
        <div className="careerContent" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
          <div style={{ color: "var(--muted)", fontSize: 15 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="careerPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Career</h1>
          <div className="weekBadge">{activeCount} active</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={createItem}>+ Add Item</button>
        </div>
      </div>

      <div className="careerContent">
        <div className="careerFilterRow">
          {TAB_FILTERS.map(f => (
            <button
              key={f}
              className={`tabBtn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>

        <div className="careerList">
          {filtered.length === 0 && (
            <div className="careerEmpty">
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                {filter === "All"
                  ? "No career items yet. Click \"+ Add Item\" to get started."
                  : `No ${filter.toLowerCase()} found.`}
              </div>
            </div>
          )}

          {filtered.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className={`careerCard ${isExpanded ? "careerCardExpanded" : ""}`}>
                <button
                  className="careerCardHeader"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  type="button"
                >
                  <div className="careerCardLeft">
                    <span
                      className="careerPriorityDot"
                      style={{ background: PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium }}
                      title={`${item.priority} priority`}
                    />
                    <span className="careerCardTitle">{item.title}</span>
                    <span className="careerTypeBadge" data-type={item.type}>{item.type}</span>
                  </div>
                  <div className="careerCardRight">
                    <span className="careerStatusBadge" data-status={item.status}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    {item.targetDate && (
                      <span className="careerCardDate">{item.targetDate}</span>
                    )}
                    <svg
                      className={`careerChevron ${isExpanded ? "careerChevronOpen" : ""}`}
                      width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="careerCardBody">
                    <div className="careerFieldGrid">
                      <div className="careerFieldRow">
                        <label className="label">Title</label>
                        <input
                          className="careerInput"
                          value={item.title}
                          onChange={e => save(item.id, { ...item, title: e.target.value })}
                          placeholder="Item title..."
                        />
                      </div>

                      <div className="careerFieldRow">
                        <label className="label">Type</label>
                        <select
                          className="careerSelect"
                          value={item.type}
                          onChange={e => save(item.id, { ...item, type: e.target.value })}
                        >
                          {TYPES.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="careerFieldRow">
                        <label className="label">Status</label>
                        <select
                          className="careerSelect"
                          value={item.status}
                          onChange={e => save(item.id, { ...item, status: e.target.value })}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>

                      <div className="careerFieldRow">
                        <label className="label">Priority</label>
                        <select
                          className="careerSelect"
                          value={item.priority}
                          onChange={e => save(item.id, { ...item, priority: e.target.value })}
                        >
                          {PRIORITIES.map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="careerFieldRow">
                        <label className="label">Target Date</label>
                        <input
                          type="date"
                          className="careerDateInput"
                          value={item.targetDate || ""}
                          onChange={e => save(item.id, { ...item, targetDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="careerDescSection">
                      <label className="label">Description</label>
                      <textarea
                        className="careerDescArea"
                        value={item.description || ""}
                        onChange={e => save(item.id, { ...item, description: e.target.value })}
                        placeholder="Add details about this item..."
                        rows={4}
                      />
                    </div>

                    <div className="careerCardActions">
                      <button
                        className="careerDeleteBtn"
                        onClick={() => setConfirmDeleteId(item.id)}
                        type="button"
                        title="Delete item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .careerPage {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .careerContent {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
        }
        .careerFilterRow {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
        }
        .careerList {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .careerEmpty {
          text-align: center;
          padding: 48px 0;
        }
        .careerCard {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e5ddd0);
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .careerCard:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .careerCardExpanded {
          border-color: var(--accent, #5B7CF5);
          box-shadow: 0 2px 12px rgba(91,124,245,0.1);
        }
        .careerCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font: inherit;
          color: inherit;
          gap: 12px;
        }
        .careerCardHeader:hover {
          background: rgba(0,0,0,0.02);
        }
        .careerCardLeft {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .careerPriorityDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .careerCardTitle {
          font-size: 14px;
          font-weight: 600;
          color: var(--text, #3a3226);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .careerTypeBadge {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 10px;
          text-transform: capitalize;
          flex-shrink: 0;
          background: #e8ecf4;
          color: #5B7CF5;
        }
        .careerTypeBadge[data-type="achievement"] {
          background: #fef3cd;
          color: #856404;
        }
        .careerTypeBadge[data-type="skill"] {
          background: #d4edda;
          color: #155724;
        }
        .careerTypeBadge[data-type="note"] {
          background: #e2e3e5;
          color: #383d41;
        }
        .careerCardRight {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .careerStatusBadge {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 10px;
          background: #e8ecf4;
          color: var(--muted, #9a8e7e);
        }
        .careerStatusBadge[data-status="in-progress"] {
          background: #cce5ff;
          color: #004085;
        }
        .careerStatusBadge[data-status="completed"] {
          background: #d4edda;
          color: #155724;
        }
        .careerStatusBadge[data-status="planned"] {
          background: #e2e3e5;
          color: #383d41;
        }
        .careerCardDate {
          font-size: 12px;
          color: var(--muted, #9a8e7e);
        }
        .careerChevron {
          transition: transform 0.2s;
          color: var(--muted, #9a8e7e);
        }
        .careerChevronOpen {
          transform: rotate(180deg);
        }
        .careerCardBody {
          padding: 0 16px 16px;
          border-top: 1px solid var(--border, #e5ddd0);
        }
        .careerFieldGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding-top: 16px;
        }
        .careerFieldRow {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .careerInput,
        .careerSelect,
        .careerDateInput {
          padding: 8px 10px;
          border: 1px solid var(--border, #e5ddd0);
          border-radius: 6px;
          background: var(--bg, #f6f1e8);
          font: inherit;
          font-size: 13px;
          color: var(--text, #3a3226);
          outline: none;
          transition: border-color 0.15s;
        }
        .careerInput:focus,
        .careerSelect:focus,
        .careerDateInput:focus {
          border-color: var(--accent, #5B7CF5);
        }
        .careerDescSection {
          margin-top: 12px;
        }
        .careerDescArea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border, #e5ddd0);
          border-radius: 6px;
          background: var(--bg, #f6f1e8);
          font: inherit;
          font-size: 13px;
          color: var(--text, #3a3226);
          resize: vertical;
          min-height: 80px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .careerDescArea:focus {
          border-color: var(--accent, #5B7CF5);
        }
        .careerCardActions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .careerDeleteBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #e74c3c;
          border-radius: 6px;
          background: none;
          color: #e74c3c;
          font: inherit;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .careerDeleteBtn:hover {
          background: #fdf0ef;
        }
      `}</style>
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Item"
        message={`Delete "${items.find(i => i.id === confirmDeleteId)?.title || "this item"}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteItem(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
