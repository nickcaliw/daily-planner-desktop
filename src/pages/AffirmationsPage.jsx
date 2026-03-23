import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.affirmationsApi : null;

export default function AffirmationsPage() {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (api) api.list().then(a => setItems(a || []));
  }, []);

  const addAffirmation = useCallback(async () => {
    const text = newText.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    const data = { text, active: true };
    if (api) await api.save(id, data);
    setItems(prev => [...prev, { id, ...data }]);
    setNewText("");
    inputRef.current?.focus();
  }, [newText]);

  const deleteAffirmation = useCallback(async (id) => {
    if (api) await api.delete(id);
    setItems(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleActive = useCallback(async (id) => {
    setItems(prev => {
      const next = prev.map(a => a.id === id ? { ...a, active: !a.active } : a);
      const item = next.find(a => a.id === id);
      if (api && item) api.save(id, { text: item.text, active: item.active });
      return next;
    });
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) return;
    setItems(prev => {
      const next = prev.map(a => a.id === editingId ? { ...a, text } : a);
      const item = next.find(a => a.id === editingId);
      if (api && item) api.save(editingId, { text: item.text, active: item.active });
      return next;
    });
    setEditingId(null);
  }, [editingId, editText]);

  const activeCount = items.filter(a => a.active).length;

  return (
    <div className="affPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Affirmations</h1>
          <div className="weekBadge">{activeCount} active</div>
        </div>
      </div>

      <div className="affContent">
        <div className="affInfo">
          Active affirmations rotate daily on your Dashboard. Add personal mantras, goals, or reminders.
        </div>

        {/* Add new */}
        <div className="affAddRow">
          <input
            ref={inputRef}
            className="input affInput"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addAffirmation(); }}
            placeholder="I am capable of achieving great things…"
          />
          <button className="btn btnPrimary" onClick={addAffirmation}>Add</button>
        </div>

        {/* List */}
        <div className="affList">
          {items.length === 0 && (
            <div className="affEmpty">No affirmations yet. Add one above to get started.</div>
          )}
          {items.map(item => (
            <div key={item.id} className={`affItem ${item.active ? "" : "affItemInactive"}`}>
              {editingId === item.id ? (
                <div className="affEditRow">
                  <input
                    className="input affInput"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                  />
                  <button className="btn btnPrimary" onClick={saveEdit}>Save</button>
                  <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <button
                    className={`affToggle ${item.active ? "affToggleOn" : ""}`}
                    onClick={() => toggleActive(item.id)}
                    type="button"
                    title={item.active ? "Active — shown on dashboard" : "Inactive — hidden from dashboard"}
                  >
                    {item.active ? "✓" : ""}
                  </button>
                  <div className="affItemText" onClick={() => startEdit(item)}>
                    {item.text}
                  </div>
                  <button
                    className="affDeleteBtn"
                    onClick={() => deleteAffirmation(item.id)}
                    type="button"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
