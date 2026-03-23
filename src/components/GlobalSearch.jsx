import { useState, useEffect, useRef, useCallback } from "react";

const TYPE_META = {
  planner: {
    label: "Planner",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    page: "planner",
  },
  journal: {
    label: "Journal",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    page: "journal",
  },
  knowledge: {
    label: "Knowledge",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    page: "knowledge",
  },
  goal: {
    label: "Goals",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    page: "goals",
  },
  note: {
    label: "Notes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    page: "notes",
  },
};

function getResultTitle(result) {
  switch (result.type) {
    case "planner":
      return result.date;
    case "journal":
      return result.date;
    case "knowledge":
      return result.data?.title || result.category || "Untitled";
    case "goal":
      return result.data?.title || "Untitled Goal";
    case "note":
      return result.title || "Untitled Note";
    default:
      return "Result";
  }
}

function getResultPreview(result) {
  switch (result.type) {
    case "planner":
      if (result.data && typeof result.data === "object") {
        const parts = [];
        if (result.data.agenda) parts.push(result.data.agenda);
        if (result.data.gratitude) parts.push(result.data.gratitude);
        return parts.join(" — ").slice(0, 120) || null;
      }
      return null;
    case "journal":
      return result.preview || null;
    case "knowledge":
      return result.data?.content?.slice(0, 120) || null;
    case "goal":
      return result.data?.description?.slice(0, 120) || null;
    case "note":
      return result.preview || null;
    default:
      return null;
  }
}

function groupResults(results) {
  const groups = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

export default function GlobalSearch({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await window.searchApi.global(q.trim());
        setResults(res || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  const handleResultClick = (result) => {
    const meta = TYPE_META[result.type];
    if (meta && onNavigate) onNavigate(meta.page);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const grouped = groupResults(results);
  const hasResults = results.length > 0;
  const showEmpty = query.trim().length > 0 && !loading && !hasResults;

  return (
    <div className="gsOverlay" onClick={handleBackdropClick}>
      <div className="gsModal">
        {/* Search input */}
        <div className="gsInputWrap">
          <svg className="gsSearchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="gsInput"
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={handleChange}
            spellCheck={false}
          />
          <kbd className="gsKbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="gsResults">
          {loading && (
            <div className="gsEmpty">
              <span className="gsSpinner" />
              Searching...
            </div>
          )}

          {showEmpty && (
            <div className="gsEmpty">No results found</div>
          )}

          {!loading && hasResults && (
            Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] || { label: type, icon: null };
              return (
                <div key={type} className="gsGroup">
                  <div className="gsGroupLabel">
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>
                  {items.map((item, i) => {
                    const title = getResultTitle(item);
                    const preview = getResultPreview(item);
                    return (
                      <button
                        key={`${type}-${item.id || item.date || i}`}
                        className="gsItem"
                        onClick={() => handleResultClick(item)}
                      >
                        <div className="gsItemBody">
                          <span className="gsItemTitle">{title}</span>
                          {preview && <span className="gsItemPreview">{preview}</span>}
                        </div>
                        <span className="gsBadge">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
