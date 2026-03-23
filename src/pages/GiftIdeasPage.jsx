import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "giftideas";

const OCCASIONS = ["Birthday", "Christmas", "Anniversary", "Just Because", "Other"];
const OCCASION_COLORS = {
  Birthday: "#e91e63", Christmas: "#4caf50", Anniversary: "#9c27b0",
  "Just Because": "#ff9800", Other: "#607d8b",
};

export default function GiftIdeasPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "todo" | "purchased"
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
      forWho: "", idea: "", occasion: "Birthday", budget: "",
      purchased: false, link: "", notes: "",
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
    if (filter === "todo") return !item.purchased;
    if (filter === "purchased") return !!item.purchased;
    return true;
  });

  // Group by person
  const grouped = {};
  for (const item of filtered) {
    const key = item.forWho || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const sortedGroups = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="daysPage">
      <style>{`
        .giGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;padding:20px 24px;}
        .giCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:16px;cursor:pointer;transition:box-shadow .15s,border-color .15s;}
        .giCard:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.1);}
        .giCardActive{border-color:var(--accent);box-shadow:0 2px 12px rgba(91,124,245,.15);}
        .giCardTop{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
        .giCatDot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px;}
        .giIdea{font-size:15px;font-weight:600;color:var(--text);flex:1;min-width:0;word-break:break-word;}
        .giIdeaEmpty{color:var(--muted);font-style:italic;font-weight:400;}
        .giMeta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}
        .giTag{font-size:11px;padding:2px 8px;border-radius:10px;background:var(--bg);color:var(--muted);border:1px solid var(--border);}
        .giPurchasedTag{background:#e8f5e9;color:#2e7d32;border-color:#c8e6c9;}
        .giBudgetTag{font-weight:600;}
        .giLink{font-size:12px;color:var(--accent);text-decoration:none;display:inline-block;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .giLink:hover{text-decoration:underline;}
        .giGroupLabel{font-size:13px;font-weight:700;color:var(--text);padding:16px 24px 4px;text-transform:uppercase;letter-spacing:.5px;display:flex;align-items:center;gap:8px;}
        .giGroupCount{font-size:11px;font-weight:500;color:var(--muted);background:var(--bg);border-radius:10px;padding:1px 8px;}
        .giEditPanel{margin-top:12px;border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:10px;}
        .giEditRow{display:flex;flex-direction:column;gap:3px;}
        .giEditLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;}
        .giEditInput{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .giEditInput:focus{border-color:var(--accent);}
        .giEditTextarea{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;resize:vertical;min-height:50px;transition:border-color .15s;}
        .giEditTextarea:focus{border-color:var(--accent);}
        .giEditSelect{border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .giEditSelect:focus{border-color:var(--accent);}
        .giCheckRow{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);}
        .giCheckRow input[type="checkbox"]{width:16px;height:16px;accent-color:var(--accent);}
        .giDeleteBtn{background:none;border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;}
        .giDeleteBtn:hover{background:#e53935;color:#fff;}
        .giEmpty{grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted);font-size:15px;}
        .giSelectRow{display:flex;gap:6px;}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Gift Ideas</h1>
          <div className="weekBadge">{items.length} ideas</div>
        </div>
        <div className="nav">
          <div className="dsSortRow">
            {["all", "todo", "purchased"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">{f}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add</button>
        </div>
      </div>

      <div className="dsBody">
        {sortedGroups.length > 0 ? sortedGroups.map(([person, personItems]) => (
          <div key={person}>
            <div className="giGroupLabel">
              {person}
              <span className="giGroupCount">{personItems.length}</span>
            </div>
            <div className="giGrid">
              {personItems.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <div className={`giCard ${isEditing ? "giCardActive" : ""}`} key={item.id}
                    onClick={() => { if (!isEditing) setEditingId(item.id); }}>
                    <div className="giCardTop">
                      <div className="giCatDot" style={{ background: OCCASION_COLORS[item.occasion] || "#607d8b" }} />
                      <div className={`giIdea ${!item.idea ? "giIdeaEmpty" : ""}`}>
                        {item.idea || "Untitled gift"}
                      </div>
                    </div>
                    <div className="giMeta">
                      {item.occasion && <span className="giTag">{item.occasion}</span>}
                      {item.budget && <span className="giTag giBudgetTag">{item.budget}</span>}
                      {item.purchased && <span className="giTag giPurchasedTag">Purchased</span>}
                    </div>
                    {item.link && !isEditing && (
                      <a className="giLink" href={item.link} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}>{item.link}</a>
                    )}

                    {isEditing && (
                      <div className="giEditPanel" onClick={e => e.stopPropagation()}>
                        <div className="giEditRow">
                          <label className="giEditLabel">For Who</label>
                          <input className="giEditInput" value={item.forWho || ""}
                            placeholder="Person's name"
                            onChange={e => save(item.id, { ...item, forWho: e.target.value })} />
                        </div>
                        <div className="giEditRow">
                          <label className="giEditLabel">Gift Idea</label>
                          <input className="giEditInput" value={item.idea || ""}
                            placeholder="What's the gift?"
                            onChange={e => save(item.id, { ...item, idea: e.target.value })} />
                        </div>
                        <div className="giSelectRow">
                          <div className="giEditRow" style={{ flex: 1 }}>
                            <label className="giEditLabel">Occasion</label>
                            <select className="giEditSelect" value={item.occasion || "Birthday"}
                              onChange={e => save(item.id, { ...item, occasion: e.target.value })}>
                              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="giEditRow" style={{ flex: 1 }}>
                            <label className="giEditLabel">Budget</label>
                            <input className="giEditInput" value={item.budget || ""}
                              placeholder="e.g. $50"
                              onChange={e => save(item.id, { ...item, budget: e.target.value })} />
                          </div>
                        </div>
                        <div className="giEditRow">
                          <label className="giEditLabel">Link</label>
                          <input className="giEditInput" value={item.link || ""}
                            placeholder="https://..."
                            onChange={e => save(item.id, { ...item, link: e.target.value })} />
                        </div>
                        <div className="giCheckRow">
                          <input type="checkbox" checked={!!item.purchased}
                            onChange={e => save(item.id, { ...item, purchased: e.target.checked })} />
                          <span>Purchased</span>
                        </div>
                        <div className="giEditRow">
                          <label className="giEditLabel">Notes</label>
                          <textarea className="giEditTextarea" value={item.notes || ""} rows={2}
                            placeholder="Optional notes..."
                            onChange={e => save(item.id, { ...item, notes: e.target.value })} />
                        </div>
                        <button className="giDeleteBtn" onClick={() => deleteItem(item.id)} type="button">
                          Delete Idea
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="giGrid">
            <div className="giEmpty">
              No {filter !== "all" ? filter : ""} gift ideas yet. Click <strong>+ Add</strong> to start collecting ideas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
