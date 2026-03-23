import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.booksApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const STATUSES = ["reading", "to-read", "finished"];
const STATUS_LABELS = { "reading": "Currently Reading", "to-read": "To Read", "finished": "Finished" };

export default function ReadingPage() {
  const [books, setBooks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("reading");
  const saveTimer = useRef(null);

  const refresh = useCallback(async () => {
    if (api) setBooks(await api.list() || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const selected = books.find(b => b.id === selectedId) || null;

  const save = useCallback((id, data) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { if (api) api.save(id, data); }, 300);
  }, []);

  const createBook = async () => {
    const id = genId();
    const data = { title: "New Book", author: "", status: "to-read", rating: 0, notes: "", startDate: "", finishDate: "", genre: "" };
    if (api) await api.save(id, data);
    await refresh();
    setSelectedId(id);
    setFilter("to-read");
  };

  const deleteBook = async () => {
    if (!selectedId) return;
    if (api) await api.delete(selectedId);
    setSelectedId(null);
    refresh();
  };

  const filtered = books.filter(b => b.status === filter);

  const counts = {
    reading: books.filter(b => b.status === "reading").length,
    "to-read": books.filter(b => b.status === "to-read").length,
    finished: books.filter(b => b.status === "finished").length,
  };

  return (
    <div className="readingPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Reading List</h1>
          <div className="weekBadge">{books.length} books</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={createBook}>+ Add Book</button>
        </div>
      </div>

      <div className="readingBody">
        <div className="readingList">
          <div className="goalsFilterRow">
            {STATUSES.map(s => (
              <button key={s} className={`tabBtn ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)} type="button">
                {STATUS_LABELS[s]} ({counts[s]})
              </button>
            ))}
          </div>
          <div className="readingEntries">
            {filtered.map(b => (
              <button key={b.id} className={`goalCard ${b.id === selectedId ? "goalCardActive" : ""}`}
                onClick={() => setSelectedId(b.id)} type="button">
                <div className="goalCardTop">
                  <div className="goalCardTitle">{b.title}</div>
                </div>
                {b.author && <div className="readingAuthor">by {b.author}</div>}
                {b.genre && <div className="goalCardCat">{b.genre}</div>}
                {b.rating > 0 && (
                  <div className="readingStars">{"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}</div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="ntEmpty">No books in this category</div>
            )}
          </div>
        </div>

        <div className="goalEditor">
          {selected ? (
            <div className="goalEditorInner">
              <div className="goalEditorHeader">
                <input className="ntTitleInput" value={selected.title}
                  onChange={e => save(selectedId, { ...selected, title: e.target.value })}
                  placeholder="Book title…" />
                <button className="ntDeleteBtn" onClick={deleteBook} title="Delete book" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              <div className="goalFields">
                <div className="goalFieldRow">
                  <label className="label">Author</label>
                  <input className="goalDateInput" value={selected.author || ""}
                    onChange={e => save(selectedId, { ...selected, author: e.target.value })}
                    placeholder="Author name…" />
                </div>
                <div className="goalFieldRow">
                  <label className="label">Genre</label>
                  <input className="goalDateInput" value={selected.genre || ""}
                    onChange={e => save(selectedId, { ...selected, genre: e.target.value })}
                    placeholder="e.g. Self-help, Fiction…" />
                </div>
                <div className="goalFieldRow">
                  <label className="label">Status</label>
                  <select className="goalSelect" value={selected.status}
                    onChange={e => save(selectedId, { ...selected, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="goalFieldRow">
                  <label className="label">Rating</label>
                  <div className="readingRatingPicker">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button"
                        className={`readingRatingStar ${n <= (selected.rating || 0) ? "active" : ""}`}
                        onClick={() => save(selectedId, { ...selected, rating: n === selected.rating ? 0 : n })}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="goalFieldRow">
                  <label className="label">Started</label>
                  <input type="date" className="goalDateInput" value={selected.startDate || ""}
                    onChange={e => save(selectedId, { ...selected, startDate: e.target.value })} />
                </div>
                <div className="goalFieldRow">
                  <label className="label">Finished</label>
                  <input type="date" className="goalDateInput" value={selected.finishDate || ""}
                    onChange={e => save(selectedId, { ...selected, finishDate: e.target.value })} />
                </div>
              </div>

              <div className="goalDescSection">
                <label className="label">Notes</label>
                <textarea className="goalDescArea" value={selected.notes || ""}
                  onChange={e => save(selectedId, { ...selected, notes: e.target.value })}
                  placeholder="Key takeaways, favorite quotes, thoughts…" />
              </div>
            </div>
          ) : (
            <div className="ntPlaceholder">
              <div className="ntPlaceholderText">Select a book or add a new one</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
