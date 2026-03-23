import { useCallback, useEffect, useRef, useState } from "react";

const visionApi = typeof window !== "undefined" ? window.visionApi : null;
const dialogApi = typeof window !== "undefined" ? window.dialogApi : null;

const CATEGORIES = ["Health", "Career", "Travel", "Family", "Wealth", "Personal"];

export default function VisionBoardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef({});

  const refreshList = useCallback(async () => {
    if (visionApi) {
      const list = await visionApi.list();
      setItems(list || []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshList().then(() => setLoading(false));
  }, [refreshList]);

  const debouncedSave = useCallback((id, data) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      if (visionApi) await visionApi.save(id, data);
    }, 300);
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      debouncedSave(id, updated);
      return updated;
    }));
  }, [debouncedSave]);

  const addImage = useCallback(async () => {
    if (!dialogApi) return;
    const dataUri = await dialogApi.openImage();
    if (!dataUri) return;
    const id = crypto.randomUUID();
    const item = { id, image: dataUri, title: "", description: "", category: "" };
    if (visionApi) { await visionApi.save(id, item); await refreshList(); }
  }, [refreshList]);

  const addText = useCallback(async () => {
    const id = crypto.randomUUID();
    const item = { id, image: null, title: "New Vision", description: "", category: "" };
    if (visionApi) { await visionApi.save(id, item); await refreshList(); }
  }, [refreshList]);

  const deleteItem = useCallback(async (id) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    if (visionApi) { await visionApi.delete(id); await refreshList(); }
  }, [refreshList]);

  return (
    <div className="visionPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Vision Board</h1>
          <div className="weekBadge">{items.length} items</div>
        </div>
        <div className="nav visionToolbar">
          <button className="btn btnPrimary" onClick={addImage} type="button">Add Image</button>
          <button className="btn" onClick={addText} type="button">Add Text</button>
        </div>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading…</div>
      ) : (
        <div className="visionBoard">
          {items.length === 0 && (
            <div className="visionEmpty">No items yet. Add an image or text card to get started.</div>
          )}
          {items.map(item => (
            <div className="visionCard" key={item.id}>
              <button className="visionCardDelete" onClick={() => deleteItem(item.id)} type="button" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {item.image && <img className="visionCardImg" src={item.image} alt={item.title || "Vision"} />}
              <div className="visionCardBody">
                <input
                  className="visionCardTitle"
                  type="text"
                  value={item.title || ""}
                  placeholder="Title"
                  onChange={e => updateItem(item.id, { title: e.target.value })}
                />
                <textarea
                  className="visionCardDesc"
                  value={item.description || ""}
                  placeholder="Description or affirmation…"
                  rows={2}
                  onChange={e => updateItem(item.id, { description: e.target.value })}
                />
                {item.category && <div className="visionCatBadge">{item.category}</div>}
                {!item.category && (
                  <select
                    className="visionCatSelect"
                    value=""
                    onChange={e => updateItem(item.id, { category: e.target.value })}
                  >
                    <option value="">Add category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
