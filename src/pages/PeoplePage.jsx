import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "people";

const RELATIONSHIPS = ["Family", "Friend", "Mentor", "Colleague", "Other"];

const REL_COLORS = {
  Family: "#e91e63",
  Friend: "#5B7CF5",
  Mentor: "#9c27b0",
  Colleague: "#ff9800",
  Other: "#607d8b",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 86400000);
}

function contactLabel(dateStr) {
  const d = daysSince(dateStr);
  if (d === null) return "No contact logged";
  if (d === 0) return "Contacted today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function emptyPerson() {
  return {
    name: "",
    relationship: "Friend",
    phone: "",
    email: "",
    birthday: "",
    lastContact: "",
    notes: "",
  };
}

export default function PeoplePage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyPerson());
  const [search, setSearch] = useState("");
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) {
      const list = (await api.list(COLLECTION)) || [];
      setItems(list);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openEdit = (item) => {
    setEditingId(item.id);
    setDraft({
      name: item.name || "",
      relationship: item.relationship || "Friend",
      phone: item.phone || "",
      email: item.email || "",
      birthday: item.birthday || "",
      lastContact: item.lastContact || "",
      notes: item.notes || "",
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setDraft(emptyPerson());
  };

  const saveDraft = useCallback(
    (id, data) => {
      setDraft(data);
      // Optimistically update the list
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
      saveTimer.current[id] = setTimeout(() => {
        if (api) api.save(id, COLLECTION, data);
      }, 400);
    },
    []
  );

  const addPerson = async () => {
    const id = crypto.randomUUID();
    const data = {
      ...emptyPerson(),
      name: "New Person",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    const added = { id, ...data };
    openEdit(added);
  };

  const deletePerson = async (id) => {
    if (api) await api.delete(id);
    if (editingId === id) closeEdit();
    refresh();
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.relationship || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  return (
    <div className="pplPage">
      <style>{`
        .pplPage { display: flex; flex-direction: column; height: 100%; }

        .pplBody {
          flex: 1; overflow-y: auto; padding: 24px;
        }

        .pplSearch {
          padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--border, #ddd);
          background: var(--paper, #fbf7f0); font-size: 14px; width: 220px;
          outline: none; transition: border-color 0.15s;
        }
        .pplSearch:focus { border-color: var(--accent, #5B7CF5); }

        .pplGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        .pplCard {
          background: var(--paper, #fbf7f0);
          border: 1.5px solid var(--border, #e0dcd4);
          border-radius: 12px; padding: 16px; cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          position: relative;
        }
        .pplCard:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-color: var(--accent, #5B7CF5); }
        .pplCardActive { border-color: var(--accent, #5B7CF5); box-shadow: 0 2px 12px rgba(91,124,245,0.12); }

        .pplCardName {
          font-size: 16px; font-weight: 600; color: var(--text, #3a3226);
          margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .pplBadge {
          display: inline-block; padding: 2px 10px; border-radius: 99px;
          font-size: 11px; font-weight: 600; color: #fff;
          margin-bottom: 8px; letter-spacing: 0.3px;
        }

        .pplCardMeta {
          font-size: 12px; color: var(--muted, #9a9083); line-height: 1.6;
        }

        .pplCardDelete {
          position: absolute; top: 10px; right: 10px;
          background: none; border: none; cursor: pointer;
          color: var(--muted, #9a9083); font-size: 16px; padding: 2px 6px;
          border-radius: 6px; transition: background 0.15s, color 0.15s;
          line-height: 1;
        }
        .pplCardDelete:hover { background: #fce4ec; color: #e53935; }

        /* Edit panel (modal overlay) */
        .pplOverlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }

        .pplModal {
          background: var(--paper, #fbf7f0);
          border-radius: 16px; padding: 28px 32px; width: 440px; max-width: 90vw;
          max-height: 85vh; overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .pplModalTitle {
          font-size: 18px; font-weight: 700; color: var(--text, #3a3226);
          margin-bottom: 20px;
        }

        .pplField { margin-bottom: 14px; }

        .pplLabel {
          display: block; font-size: 12px; font-weight: 600;
          color: var(--muted, #9a9083); margin-bottom: 4px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .pplInput, .pplSelect, .pplTextarea {
          width: 100%; padding: 8px 12px; border-radius: 8px;
          border: 1.5px solid var(--border, #ddd);
          background: var(--bg, #f6f1e8); font-size: 14px;
          font-family: inherit; outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .pplInput:focus, .pplSelect:focus, .pplTextarea:focus {
          border-color: var(--accent, #5B7CF5);
        }

        .pplTextarea { resize: vertical; min-height: 60px; }

        .pplModalActions {
          display: flex; gap: 10px; margin-top: 20px; justify-content: space-between;
        }

        .pplDeleteBtn {
          background: none; border: 1.5px solid #e53935; color: #e53935;
          padding: 7px 16px; border-radius: 8px; font-size: 13px;
          cursor: pointer; font-weight: 600; transition: background 0.15s;
        }
        .pplDeleteBtn:hover { background: #fce4ec; }

        .pplEmpty {
          text-align: center; padding: 60px 0; color: var(--muted, #9a9083);
          font-size: 15px;
        }
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">People</h1>
          <div className="weekBadge">{items.length} contacts</div>
        </div>
        <div className="nav" style={{ gap: 10 }}>
          <input
            className="pplSearch"
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btnPrimary" onClick={addPerson} type="button">
            + Add Person
          </button>
        </div>
      </div>

      <div className="pplBody">
        <div className="pplGrid">
          {sorted.map((item) => {
            const relColor = REL_COLORS[item.relationship] || REL_COLORS.Other;
            return (
              <div
                className={`pplCard ${item.id === editingId ? "pplCardActive" : ""}`}
                key={item.id}
                onClick={() => openEdit(item)}
              >
                <button
                  className="pplCardDelete"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePerson(item.id);
                  }}
                  type="button"
                >
                  &times;
                </button>
                <div className="pplCardName">{item.name || "Unnamed"}</div>
                {item.relationship && (
                  <span className="pplBadge" style={{ background: relColor }}>
                    {item.relationship}
                  </span>
                )}
                <div className="pplCardMeta">
                  {item.phone && <div>{item.phone}</div>}
                  {item.email && <div>{item.email}</div>}
                  {item.birthday && <div>Birthday: {formatDate(item.birthday)}</div>}
                  <div>Last contact: {contactLabel(item.lastContact)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="pplEmpty">
            No contacts yet. Click <strong>+ Add Person</strong> to start building your network.
          </div>
        )}

        {items.length > 0 && filtered.length === 0 && (
          <div className="pplEmpty">
            No people match your search.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="pplOverlay" onClick={closeEdit}>
          <div className="pplModal" onClick={(e) => e.stopPropagation()}>
            <div className="pplModalTitle">
              {draft.name || "Edit Person"}
            </div>

            <div className="pplField">
              <label className="pplLabel">Name</label>
              <input
                className="pplInput"
                value={draft.name}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>

            <div className="pplField">
              <label className="pplLabel">Relationship</label>
              <select
                className="pplSelect"
                value={draft.relationship}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, relationship: e.target.value })
                }
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="pplField">
              <label className="pplLabel">Phone</label>
              <input
                className="pplInput"
                value={draft.phone}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="pplField">
              <label className="pplLabel">Email</label>
              <input
                className="pplInput"
                type="email"
                value={draft.email}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, email: e.target.value })
                }
                placeholder="name@example.com"
              />
            </div>

            <div className="pplField">
              <label className="pplLabel">Birthday</label>
              <input
                className="pplInput"
                type="date"
                value={draft.birthday}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, birthday: e.target.value })
                }
              />
            </div>

            <div className="pplField">
              <label className="pplLabel">Last Contact</label>
              <input
                className="pplInput"
                type="date"
                value={draft.lastContact}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, lastContact: e.target.value })
                }
              />
            </div>

            <div className="pplField">
              <label className="pplLabel">Notes</label>
              <textarea
                className="pplTextarea"
                rows={3}
                value={draft.notes}
                onChange={(e) =>
                  saveDraft(editingId, { ...draft, notes: e.target.value })
                }
                placeholder="How you met, shared interests, reminders..."
              />
            </div>

            <div className="pplModalActions">
              <button
                className="pplDeleteBtn"
                onClick={() => deletePerson(editingId)}
                type="button"
              >
                Delete Person
              </button>
              <button className="btn btnPrimary" onClick={closeEdit} type="button">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
