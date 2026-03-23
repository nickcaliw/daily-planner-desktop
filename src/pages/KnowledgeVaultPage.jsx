import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.knowledgeApi : null;

/* ─── Content types ─── */
const TYPES = [
  {
    id: "book", label: "Book", emoji: "📚", color: "#795548",
    fields: [
      { key: "author", label: "Author", type: "text", placeholder: "Author name" },
      { key: "genre", label: "Genre", type: "text", placeholder: "e.g. Self-help, Fiction" },
      { key: "bookStatus", label: "Status", type: "select", options: [
        { value: "to-read", label: "To Read" },
        { value: "reading", label: "Reading" },
        { value: "finished", label: "Finished" },
      ]},
      { key: "rating", label: "Rating", type: "rating" },
    ],
    placeholder: "Key takeaways, favorite quotes, notes…",
  },
  {
    id: "podcast", label: "Podcast", emoji: "🎙️", color: "#9c27b0",
    fields: [
      { key: "author", label: "Host", type: "text", placeholder: "Host or show name" },
      { key: "genre", label: "Episode", type: "text", placeholder: "Episode name or #" },
      { key: "bookStatus", label: "Status", type: "select", options: [
        { value: "to-read", label: "To Listen" },
        { value: "reading", label: "Listening" },
        { value: "finished", label: "Listened" },
      ]},
      { key: "rating", label: "Rating", type: "rating" },
    ],
    placeholder: "Key takeaways, timestamps, notes…",
  },
  {
    id: "article", label: "Article", emoji: "📰", color: "#3f51b5",
    fields: [
      { key: "author", label: "Source", type: "text", placeholder: "Website or author" },
      { key: "genre", label: "Topic", type: "text", placeholder: "e.g. Tech, Health" },
    ],
    placeholder: "Summary, key points, quotes…",
  },
  {
    id: "video", label: "Video", emoji: "🎬", color: "#e91e63",
    fields: [
      { key: "author", label: "Creator", type: "text", placeholder: "Channel or creator" },
      { key: "genre", label: "Topic", type: "text", placeholder: "e.g. Tutorial, Documentary" },
    ],
    placeholder: "Key moments, timestamps, notes…",
  },
  {
    id: "quote", label: "Quote", emoji: "💬", color: "#00bcd4",
    fields: [
      { key: "author", label: "By", type: "text", placeholder: "Who said it?" },
      { key: "genre", label: "Source", type: "text", placeholder: "Book, speech, etc." },
    ],
    placeholder: "Enter the quote…",
  },
  {
    id: "course", label: "Course", emoji: "🎓", color: "#4caf50",
    fields: [
      { key: "author", label: "Instructor", type: "text", placeholder: "Instructor or platform" },
      { key: "genre", label: "Topic", type: "text", placeholder: "e.g. Business, Coding" },
      { key: "bookStatus", label: "Status", type: "select", options: [
        { value: "to-read", label: "Not Started" },
        { value: "reading", label: "In Progress" },
        { value: "finished", label: "Completed" },
      ]},
      { key: "rating", label: "Rating", type: "rating" },
    ],
    placeholder: "Course notes, key lessons…",
  },
];

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.id, t]));

/* We map our new type ids to the old category system for storage compatibility */
function typeToCat(typeId) {
  if (typeId === "book") return "books";
  if (typeId === "quote") return "quotes";
  return typeId; // podcast, article, video, course stored as-is
}

function catToType(cat) {
  if (cat === "books") return "book";
  if (cat === "quotes") return "quote";
  if (TYPES.find(t => t.id === cat)) return cat;
  return null; // legacy categories without a type
}

function genId() {
  return crypto.randomUUID();
}

/* ─── Star rating widget ─── */
function StarRating({ value, onChange }) {
  return (
    <div className="kvStars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`kvStar ${n <= value ? "kvStarActive" : ""}`}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function KnowledgeVaultPage() {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeType, setActiveType] = useState(null); // null = show type picker home
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Editor state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [meta, setMeta] = useState({});

  const saveTimer = useRef(null);
  const searchTimer = useRef(null);
  const titleInputRef = useRef(null);

  const refreshList = useCallback(async () => {
    if (!api) return;
    const list = await api.list();
    setEntries(list || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshList().then(() => setLoading(false));
  }, [refreshList]);

  // Load selected entry into editor
  useEffect(() => {
    if (!selectedId || !api) return;
    let cancelled = false;
    api.get(selectedId).then(entry => {
      if (cancelled || !entry) return;
      setTitle(entry.title || "");
      setContent(entry.content || "");
      setPinned(!!entry.pinned);
      setMeta({
        author: entry.author || "",
        genre: entry.genre || "",
        bookStatus: entry.bookStatus || "to-read",
        rating: entry.rating || 0,
      });
      setShowForm(true);
      const t = catToType(entry.category);
      if (t) setActiveType(t);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  const save = useCallback((id, t, c, cat, p, extra = {}) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!api || !id) return;
      const data = { title: t, content: c, ...extra };
      await api.save(id, cat, data, p);
      refreshList();
    }, 400);
  }, [refreshList]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      searchTimer.current = setTimeout(() => refreshList(), 200);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      if (api) {
        const results = await api.search(query);
        setEntries(results || []);
      }
    }, 300);
  }, [refreshList]);

  const doSave = (overrides = {}) => {
    const m = overrides.meta || meta;
    const cat = typeToCat(activeType);
    save(
      selectedId,
      overrides.title ?? title,
      overrides.content ?? content,
      cat,
      overrides.pinned ?? pinned,
      { author: m.author, genre: m.genre, bookStatus: m.bookStatus, rating: m.rating }
    );
  };

  const updateMeta = (key, value) => {
    const next = { ...meta, [key]: value };
    setMeta(next);
    doSave({ meta: next });
  };

  const createEntry = async (typeId) => {
    const id = genId();
    const cat = typeToCat(typeId);
    const data = { title: "", content: "", author: "", genre: "", bookStatus: "to-read", rating: 0 };
    if (api) await api.save(id, cat, data, false);
    await refreshList();
    setSelectedId(id);
    setActiveType(typeId);
    setTitle("");
    setContent("");
    setPinned(false);
    setMeta({ author: "", genre: "", bookStatus: "to-read", rating: 0 });
    setShowForm(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteEntry = async () => {
    if (!selectedId || !api) return;
    await api.delete(selectedId);
    setSelectedId(null);
    setShowForm(false);
    setConfirmDelete(false);
    refreshList();
  };

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    doSave({ pinned: next });
  };

  const goBack = () => {
    setShowForm(false);
    setSelectedId(null);
  };

  // Filtered entries by active type
  const filtered = useMemo(() => {
    let list = entries;
    if (activeType) {
      const cat = typeToCat(activeType);
      list = list.filter(e => e.category === cat);
    }
    if (searchQuery.trim()) {
      // search is already handled server-side, but filter by type too
      if (activeType) {
        const cat = typeToCat(activeType);
        list = list.filter(e => e.category === cat);
      }
    }
    return list;
  }, [entries, activeType, searchQuery]);

  // Counts per type
  const typeCounts = useMemo(() => {
    const counts = {};
    for (const t of TYPES) {
      const cat = typeToCat(t.id);
      counts[t.id] = entries.filter(e => e.category === cat).length;
    }
    return counts;
  }, [entries]);

  const typeConfig = activeType ? TYPE_MAP[activeType] : null;

  return (
    <div className="kvPage">
      <div className="topbar">
        <div className="topbarLeft">
          {showForm && activeType ? (
            <button className="kvBackBtn" onClick={goBack} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          ) : null}
          <h1 className="pageTitle">Knowledge Vault</h1>
          <div className="weekBadge">{entries.length} entries</div>
        </div>
      </div>

      {/* ── Main content ── */}
      {!showForm ? (
        <div className="kvHome">
          {/* Type buttons — the hero of the page */}
          <div className="kvTypeSection">
            <h2 className="kvHomeSectionTitle">Add New</h2>
            <div className="kvTypeGrid">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  className="kvTypeCard"
                  onClick={() => createEntry(t.id)}
                  type="button"
                  style={{ "--type-color": t.color }}
                >
                  <div className="kvTypeEmoji">{t.emoji}</div>
                  <div className="kvTypeName">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Browse by type */}
          <div className="kvBrowseSection">
            <div className="kvBrowseHeader">
              <h2 className="kvHomeSectionTitle">Browse</h2>
              <div className="kvSearchWrap">
                <input
                  className="kvSearchInput"
                  type="text"
                  placeholder="Search entries…"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Type filter pills */}
            <div className="kvFilterPills">
              <button
                className={`kvPill ${!activeType ? "kvPillActive" : ""}`}
                onClick={() => setActiveType(null)}
                type="button"
              >
                All ({entries.length})
              </button>
              {TYPES.map(t => (
                <button
                  key={t.id}
                  className={`kvPill ${activeType === t.id ? "kvPillActive" : ""}`}
                  onClick={() => setActiveType(activeType === t.id ? null : t.id)}
                  type="button"
                  style={{ "--pill-color": t.color }}
                >
                  {t.emoji} {t.label} ({typeCounts[t.id] || 0})
                </button>
              ))}
            </div>

            {/* Entries list */}
            <div className="kvEntriesGrid">
              {loading ? (
                <div className="loadingMsg">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="kvEmpty">
                  {searchQuery ? "No results found" : "No entries yet — pick a type above to get started!"}
                </div>
              ) : (
                filtered.map(entry => {
                  const t = TYPE_MAP[catToType(entry.category)];
                  return (
                    <button
                      key={entry.id}
                      className={`kvEntryCard ${entry.id === selectedId ? "kvEntryCardActive" : ""}`}
                      onClick={() => setSelectedId(entry.id)}
                      type="button"
                    >
                      <div className="kvEntryCardTop">
                        <span className="kvEntryCardEmoji">{t?.emoji || "📝"}</span>
                        {entry.pinned && <span className="kvPinIcon">📌</span>}
                      </div>
                      <div className="kvEntryCardTitle">{entry.title || "Untitled"}</div>
                      {entry.author && (
                        <div className="kvEntryCardAuthor">{entry.author}</div>
                      )}
                      {entry.content && (
                        <div className="kvEntryCardPreview">
                          {entry.content.slice(0, 80)}
                        </div>
                      )}
                      <div className="kvEntryCardFooter">
                        <span className="kvEntryCardType" style={{ color: t?.color || "var(--muted)" }}>
                          {t?.label || "Note"}
                        </span>
                        {entry.rating > 0 && (
                          <span className="kvEntryCardStars">{"★".repeat(entry.rating)}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Editor view ── */
        <div className="kvEditorView">
          <div className="kvEditorCard">
            {typeConfig && (
              <div className="kvEditorTypeBadge" style={{ background: typeConfig.color }}>
                {typeConfig.emoji} {typeConfig.label}
              </div>
            )}

            <div className="kvEditorHeader">
              <input
                ref={titleInputRef}
                className="kvTitleInput"
                value={title}
                onChange={e => { setTitle(e.target.value); doSave({ title: e.target.value }); }}
                placeholder={`${typeConfig?.label || "Entry"} title…`}
              />
              <div className="kvEditorActions">
                <button
                  className={`kvPinBtn ${pinned ? "kvPinBtnActive" : ""}`}
                  onClick={togglePin}
                  type="button"
                  title={pinned ? "Unpin" : "Pin to top"}
                >
                  📌
                </button>
                <button className="kvDeleteBtn" onClick={() => setConfirmDelete(true)} title="Delete entry" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Type-specific fields */}
            {typeConfig?.fields && (
              <div className="kvFieldsGrid">
                {typeConfig.fields.map(field => (
                  <div className="kvFieldRow" key={field.key}>
                    <label className="kvFieldLabel">{field.label}</label>
                    {field.type === "text" ? (
                      <input
                        className="kvFieldInput"
                        value={meta[field.key] || ""}
                        onChange={e => updateMeta(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="kvFieldSelect"
                        value={meta[field.key] || field.options[0].value}
                        onChange={e => updateMeta(field.key, e.target.value)}
                      >
                        {field.options.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : field.type === "rating" ? (
                      <StarRating value={meta.rating || 0} onChange={v => updateMeta("rating", v)} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="kvTextarea"
              value={content}
              onChange={e => { setContent(e.target.value); doSave({ content: e.target.value }); }}
              placeholder={typeConfig?.placeholder || "Write your notes…"}
            />
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Entry"
        message="Delete this knowledge entry? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={deleteEntry}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
