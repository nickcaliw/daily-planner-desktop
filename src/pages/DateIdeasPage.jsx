import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "dateideas";

const CATEGORIES = ["Romantic", "Adventure", "Food", "Entertainment", "Travel", "At Home", "Other"];
const COSTS = ["Free", "$", "$$", "$$$"];
const CATEGORY_COLORS = {
  Romantic: "#e91e63", Adventure: "#ff5722", Food: "#ff9800",
  Entertainment: "#9c27b0", Travel: "#00bcd4", "At Home": "#4caf50", Other: "#607d8b",
};

export default function DateIdeasPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "todo" | "done"
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

  const addItem = async () => {
    const id = crypto.randomUUID();
    const data = {
      title: "", category: "Other", forWho: "", cost: "$",
      done: false, notes: "", rating: 0,
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

  const filtered = items.filter(item => {
    if (filter === "todo") return !item.done;
    if (filter === "done") return !!item.done;
    return true;
  });

  return (
    <div className="daysPage">
      <style>{`
        .diGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;padding:20px 24px;}
        .diCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:16px;cursor:pointer;transition:box-shadow .15s,border-color .15s;}
        .diCard:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.1);}
        .diCardActive{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.15);}
        .diCardTop{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
        .diCatDot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px;}
        .diTitle{font-size:15px;font-weight:600;color:var(--text);flex:1;min-width:0;word-break:break-word;}
        .diTitleEmpty{color:var(--muted);font-style:italic;font-weight:400;}
        .diMeta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}
        .diTag{font-size:11px;padding:2px 8px;border-radius:10px;background:var(--bg);color:var(--muted);border:1px solid var(--border);}
        .diDoneTag{background:#e8f5e9;color:#2e7d32;border-color:#c8e6c9;}
        .diStars{color:#ff9800;font-size:13px;letter-spacing:1px;}
        .diEditPanel{margin-top:12px;border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:10px;}
        .diEditRow{display:flex;flex-direction:column;gap:3px;}
        .diEditLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;}
        .diEditInput{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .diEditInput:focus{border-color:var(--accent);}
        .diEditTextarea{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;resize:vertical;min-height:50px;transition:border-color .15s;}
        .diEditTextarea:focus{border-color:var(--accent);}
        .diCheckRow{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);}
        .diCheckRow input[type="checkbox"]{width:16px;height:16px;accent-color:var(--accent);}
        .diRatingRow{display:flex;align-items:center;gap:4px;}
        .diStar{background:none;border:none;cursor:pointer;font-size:20px;padding:0 1px;color:#ccc;transition:color .1s;}
        .diStarOn{color:#ff9800;}
        .diDeleteBtn{background:none;border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;}
        .diDeleteBtn:hover{background:#e53935;color:#fff;}
        .diEmpty{grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted);font-size:15px;}
        .diSelectRow{display:flex;gap:6px;}
        .diEditSelect{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .diEditSelect:focus{border-color:var(--accent);}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Date Ideas</h1>
          <div className="weekBadge">{items.length} ideas</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["all", "todo", "done"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">{f}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add</button>
        </div>
      </div>

      <div className="dsBody">
        <div className="diGrid">
          {filtered.map(item => {
            const isEditing = editingId === item.id;
            return (
              <div className={`diCard ${isEditing ? "diCardActive" : ""}`} key={item.id}
                onClick={() => { if (!isEditing) setEditingId(item.id); }}>
                <div className="diCardTop">
                  <div className="diCatDot" style={{ background: CATEGORY_COLORS[item.category] || "#607d8b" }} />
                  <div className={`diTitle ${!item.title ? "diTitleEmpty" : ""}`}>
                    {item.title || "Untitled idea"}
                  </div>
                </div>
                <div className="diMeta">
                  {item.category && <span className="diTag">{item.category}</span>}
                  {item.forWho && <span className="diTag">{item.forWho}</span>}
                  {item.cost && <span className="diTag">{item.cost}</span>}
                  {item.done && <span className="diTag diDoneTag">Done</span>}
                </div>
                {item.done && item.rating > 0 && (
                  <div className="diStars">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
                )}

                {isEditing && (
                  <div className="diEditPanel" onClick={e => e.stopPropagation()}>
                    <div className="diEditRow">
                      <label className="diEditLabel">Activity</label>
                      <input className="diEditInput" value={item.title || ""}
                        placeholder="What's the date idea?"
                        onChange={e => save(item.id, { ...item, title: e.target.value })} />
                    </div>
                    <div className="diSelectRow">
                      <div className="diEditRow" style={{ flex: 1 }}>
                        <label className="diEditLabel">Category</label>
                        <select className="diEditSelect" value={item.category || "Other"}
                          onChange={e => save(item.id, { ...item, category: e.target.value })}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="diEditRow" style={{ flex: 1 }}>
                        <label className="diEditLabel">Cost</label>
                        <select className="diEditSelect" value={item.cost || "$"}
                          onChange={e => save(item.id, { ...item, cost: e.target.value })}>
                          {COSTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="diEditRow">
                      <label className="diEditLabel">For Who</label>
                      <input className="diEditInput" value={item.forWho || ""}
                        placeholder="e.g. Sarah, Family, Friends"
                        onChange={e => save(item.id, { ...item, forWho: e.target.value })} />
                    </div>
                    <div className="diCheckRow">
                      <input type="checkbox" checked={!!item.done}
                        onChange={e => save(item.id, { ...item, done: e.target.checked })} />
                      <span>Done — we did this!</span>
                    </div>
                    {item.done && (
                      <div className="diEditRow">
                        <label className="diEditLabel">Rating</label>
                        <div className="diRatingRow">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} className={`diStar ${n <= (item.rating || 0) ? "diStarOn" : ""}`}
                              onClick={() => save(item.id, { ...item, rating: n })} type="button">
                              {n <= (item.rating || 0) ? "★" : "☆"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="diEditRow">
                      <label className="diEditLabel">Notes</label>
                      <textarea className="diEditTextarea" value={item.notes || ""} rows={2}
                        placeholder="Optional notes..."
                        onChange={e => save(item.id, { ...item, notes: e.target.value })} />
                    </div>
                    <button className="diDeleteBtn" onClick={() => deleteItem(item.id)} type="button">
                      Delete Idea
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="diEmpty">
              No {filter !== "all" ? filter : ""} date ideas yet. Click <strong>+ Add</strong> to start brainstorming.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
