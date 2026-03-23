import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.notesApi : null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  const refreshList = useCallback(async () => {
    if (api) {
      const list = await api.list();
      setNotes(list || []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshList().then(() => setLoading(false));
  }, [refreshList]);

  // Load selected note
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function load() {
      if (api) {
        const note = await api.get(selectedId);
        if (!cancelled && note) {
          setTitle(note.title);
          setContent(note.content);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedId]);

  const save = useCallback((id, newTitle, newContent) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (api && id) {
        await api.save(id, newTitle, newContent);
        refreshList();
      }
    }, 400);
  }, [refreshList]);

  const handleTitleChange = (v) => {
    setTitle(v);
    save(selectedId, v, content);
  };

  const handleContentChange = (v) => {
    setContent(v);
    save(selectedId, title, v);
  };

  const createNote = async () => {
    const id = generateId();
    if (api) {
      await api.save(id, "Untitled", "");
      await refreshList();
      setSelectedId(id);
      setTitle("Untitled");
      setContent("");
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteNote = async () => {
    if (!selectedId) return;
    if (api) {
      await api.delete(selectedId);
      setSelectedId(null);
      setTitle("");
      setContent("");
      setConfirmDelete(false);
      refreshList();
    }
  };

  return (
    <div className="notesPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Notes</h1>
          <div className="weekBadge">{notes.length} notes</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={createNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Note
          </button>
        </div>
      </div>

      <div className="ntBody">
        {/* Notes list */}
        <div className="ntList">
          <div className="ntListHeader">All Notes</div>
          {loading ? (
            <div className="loadingMsg">Loading…</div>
          ) : notes.length === 0 ? (
            <div className="ntEmpty">No notes yet. Create one!</div>
          ) : (
            <div className="ntEntries">
              {notes.map((n) => (
                <button
                  key={n.id}
                  className={`ntNoteBtn ${n.id === selectedId ? "ntNoteActive" : ""}`}
                  onClick={() => setSelectedId(n.id)}
                  type="button"
                >
                  <div className="ntNoteTitle">{n.title || "Untitled"}</div>
                  <div className="ntNotePreview">{n.preview || "Empty note"}</div>
                  <div className="ntNoteDate">
                    {new Date(n.updated_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric",
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="ntEditor">
          {selectedId ? (
            <>
              <div className="ntEditorHeader">
                <input
                  className="ntTitleInput"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Note title…"
                />
                <button className="ntDeleteBtn" onClick={() => setConfirmDelete(true)} title="Delete note" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <textarea
                className="ntTextarea"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing…"
              />
            </>
          ) : (
            <div className="ntPlaceholder">
              <div className="ntPlaceholderIcon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="ntPlaceholderText">Select a note or create a new one</div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Note"
        message={`Delete "${title || "this note"}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={deleteNote}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
