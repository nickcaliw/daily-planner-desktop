import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "bucketlist";

const CATEGORIES = ["Travel", "Experience", "Achievement", "Learning", "Adventure", "Creative", "Other"];
const CATEGORY_COLORS = {
  Travel: "#2196f3",
  Experience: "#e91e63",
  Achievement: "#ff9800",
  Learning: "#9c27b0",
  Adventure: "#4caf50",
  Creative: "#00bcd4",
  Other: "#607d8b",
};

export default function BucketListPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "todo" | "done"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
      title: "", description: "", category: "Experience",
      targetDate: "", completed: false, completedDate: "",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setEditingId(id);
  };

  const deleteItem = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) setEditingId(null);
    setConfirmDeleteId(null);
    refresh();
  };

  const toggleCompleted = (item) => {
    const nowCompleted = !item.completed;
    const today = new Date().toISOString().slice(0, 10);
    save(item.id, {
      ...item,
      completed: nowCompleted,
      completedDate: nowCompleted ? today : "",
    });
  };

  const filtered = items.filter(item => {
    if (filter === "todo") return !item.completed;
    if (filter === "done") return !!item.completed;
    return true;
  });

  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="daysPage">
      <style>{`
        .blGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;padding:20px 24px;}
        .blCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:16px;cursor:pointer;transition:box-shadow .15s,border-color .15s;position:relative;}
        .blCard:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.1);}
        .blCardActive{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.15);}
        .blCardDone{opacity:.75;}
        .blCardTop{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
        .blCheckbox{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;margin-top:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;background:none;}
        .blCheckbox:hover{border-color:var(--accent);}
        .blCheckboxDone{border-color:#4caf50;background:#4caf50;color:#fff;}
        .blCheckboxDone svg{display:block;}
        .blTitle{font-size:15px;font-weight:600;color:var(--text);flex:1;min-width:0;word-break:break-word;}
        .blTitleEmpty{color:var(--muted);font-style:italic;font-weight:400;}
        .blTitleDone{text-decoration:line-through;color:var(--muted);}
        .blDesc{font-size:13px;color:var(--muted);margin-bottom:8px;line-height:1.4;}
        .blMeta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;}
        .blCatBadge{font-size:11px;padding:2px 10px;border-radius:10px;color:#fff;font-weight:600;letter-spacing:.3px;}
        .blTag{font-size:11px;padding:2px 8px;border-radius:10px;background:var(--bg);color:var(--muted);border:1px solid var(--border);}
        .blDoneTag{background:#e8f5e9;color:#2e7d32;border-color:#c8e6c9;}
        .blEditPanel{margin-top:12px;border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:10px;}
        .blEditRow{display:flex;flex-direction:column;gap:3px;}
        .blEditLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;}
        .blEditInput{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .blEditInput:focus{border-color:var(--accent);}
        .blEditTextarea{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;resize:vertical;min-height:50px;transition:border-color .15s;}
        .blEditTextarea:focus{border-color:var(--accent);}
        .blEditSelect{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .blEditSelect:focus{border-color:var(--accent);}
        .blSelectRow{display:flex;gap:6px;}
        .blCheckRow{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);}
        .blCheckRow input[type="checkbox"]{width:16px;height:16px;accent-color:var(--accent);}
        .blDeleteBtn{background:none;border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;}
        .blDeleteBtn:hover{background:#e53935;color:#fff;}
        .blEmpty{grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted);font-size:15px;}
        .blProgress{display:flex;align-items:center;gap:10px;padding:4px 24px 0;font-size:13px;color:var(--muted);}
        .blProgressBar{flex:1;max-width:200px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
        .blProgressFill{height:100%;background:#4caf50;border-radius:3px;transition:width .3s;}
        .blProgressText{font-weight:600;color:var(--text);}
        .blConfirmOverlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:999;}
        .blConfirmDialog{background:var(--paper);border-radius:14px;padding:24px;max-width:340px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.18);text-align:center;}
        .blConfirmTitle{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
        .blConfirmMsg{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.4;}
        .blConfirmBtns{display:flex;gap:10px;justify-content:center;}
        .blConfirmCancel{background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:8px 20px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer;transition:background .15s;}
        .blConfirmCancel:hover{background:var(--border);}
        .blConfirmDelete{background:#e53935;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:600;color:#fff;cursor:pointer;transition:background .15s;}
        .blConfirmDelete:hover{background:#c62828;}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Bucket List</h1>
          <div className="weekBadge">{items.length} items</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["all", "todo", "done"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">{f}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add Item</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="blProgress">
          <span className="blProgressText">{completedCount} of {items.length} completed</span>
          <div className="blProgressBar">
            <div className="blProgressFill" style={{ width: `${items.length ? Math.round((completedCount / items.length) * 100) : 0}%` }} />
          </div>
          <span>{items.length ? Math.round((completedCount / items.length) * 100) : 0}%</span>
        </div>
      )}

      <div className="dsBody">
        <div className="blGrid">
          {filtered.length > 0 ? filtered.map(item => {
            const isEditing = editingId === item.id;
            return (
              <div className={`blCard ${isEditing ? "blCardActive" : ""} ${item.completed ? "blCardDone" : ""}`}
                key={item.id} onClick={() => { if (!isEditing) setEditingId(item.id); }}>
                <div className="blCardTop">
                  <div
                    className={`blCheckbox ${item.completed ? "blCheckboxDone" : ""}`}
                    onClick={e => { e.stopPropagation(); toggleCompleted(item); }}
                  >
                    {item.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className={`blTitle ${!item.title ? "blTitleEmpty" : ""} ${item.completed ? "blTitleDone" : ""}`}>
                    {item.title || "Untitled item"}
                  </div>
                </div>
                {item.description && !isEditing && (
                  <div className="blDesc">{item.description}</div>
                )}
                <div className="blMeta">
                  {item.category && (
                    <span className="blCatBadge" style={{ background: CATEGORY_COLORS[item.category] || "#607d8b" }}>
                      {item.category}
                    </span>
                  )}
                  {item.targetDate && <span className="blTag">Target: {item.targetDate}</span>}
                  {item.completed && item.completedDate && (
                    <span className="blTag blDoneTag">Done: {item.completedDate}</span>
                  )}
                </div>

                {isEditing && (
                  <div className="blEditPanel" onClick={e => e.stopPropagation()}>
                    <div className="blEditRow">
                      <label className="blEditLabel">Title</label>
                      <input className="blEditInput" value={item.title || ""}
                        placeholder="What's on your bucket list?"
                        onChange={e => save(item.id, { ...item, title: e.target.value })} />
                    </div>
                    <div className="blEditRow">
                      <label className="blEditLabel">Description</label>
                      <textarea className="blEditTextarea" value={item.description || ""} rows={2}
                        placeholder="Optional details..."
                        onChange={e => save(item.id, { ...item, description: e.target.value })} />
                    </div>
                    <div className="blSelectRow">
                      <div className="blEditRow" style={{ flex: 1 }}>
                        <label className="blEditLabel">Category</label>
                        <select className="blEditSelect" value={item.category || "Other"}
                          onChange={e => save(item.id, { ...item, category: e.target.value })}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="blEditRow" style={{ flex: 1 }}>
                        <label className="blEditLabel">Target Date</label>
                        <input className="blEditInput" type="date" value={item.targetDate || ""}
                          onChange={e => save(item.id, { ...item, targetDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="blCheckRow">
                      <input type="checkbox" checked={!!item.completed}
                        onChange={() => toggleCompleted(item)} />
                      <span>Completed</span>
                      {item.completed && item.completedDate && (
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>on {item.completedDate}</span>
                      )}
                    </div>
                    <button className="blDeleteBtn" onClick={() => setConfirmDeleteId(item.id)} type="button">
                      Delete Item
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="blEmpty">
              No {filter !== "all" ? filter : ""} bucket list items yet. Click <strong>+ Add Item</strong> to start dreaming big.
            </div>
          )}
        </div>
      </div>

      {confirmDeleteId && (
        <div className="blConfirmOverlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="blConfirmDialog" onClick={e => e.stopPropagation()}>
            <div className="blConfirmTitle">Delete Item</div>
            <div className="blConfirmMsg">Are you sure you want to remove this from your bucket list? This cannot be undone.</div>
            <div className="blConfirmBtns">
              <button className="blConfirmCancel" onClick={() => setConfirmDeleteId(null)} type="button">Cancel</button>
              <button className="blConfirmDelete" onClick={() => deleteItem(confirmDeleteId)} type="button">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
