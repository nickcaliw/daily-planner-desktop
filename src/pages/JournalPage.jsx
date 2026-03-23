import { useCallback, useEffect, useRef, useState } from "react";
import { ymd } from "../lib/dates.js";
import AutoGrowTextarea from "../components/AutoGrowTextarea.jsx";

const api = typeof window !== "undefined" ? window.journalApi : null;

const MOODS = [
  { value: "great", label: "Great", emoji: "😊" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😔" },
  { value: "tough", label: "Tough", emoji: "😣" },
];

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Load entry list
  const refreshList = useCallback(async () => {
    if (api) {
      const list = await api.list();
      setEntries(list || []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshList().then(() => setLoading(false));
  }, [refreshList]);

  // Load selected entry
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    async function load() {
      if (api) {
        const entry = await api.get(selectedDate);
        if (!cancelled) {
          setContent(entry?.content || "");
          setMood(entry?.mood || "");
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Auto-save with debounce
  const save = useCallback((newContent, newMood) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (api && selectedDate) {
        await api.save(selectedDate, newContent, newMood);
        refreshList();
      }
    }, 400);
  }, [selectedDate, refreshList]);

  const handleContentChange = (v) => {
    setContent(v);
    save(v, mood);
  };

  const handleMoodChange = (v) => {
    setMood(v);
    save(content, v);
  };

  const startNewEntry = () => {
    const today = ymd(new Date());
    setSelectedDate(today);
  };

  const selectedDateObj = selectedDate
    ? (() => { const [y, m, d] = selectedDate.split("-").map(Number); return new Date(y, m - 1, d); })()
    : null;

  return (
    <div className="journalPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Journal</h1>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={startNewEntry}>
            Today's Entry
          </button>
        </div>
      </div>

      <div className="jnlBody">
        {/* Entry list */}
        <div className="jnlList">
          <div className="jnlListHeader">Entries</div>
          {loading ? (
            <div className="loadingMsg">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="jnlEmpty">No entries yet. Start writing!</div>
          ) : (
            <div className="jnlEntries">
              {entries.map((e) => {
                const d = (() => { const [y, m, d] = e.date.split("-").map(Number); return new Date(y, m - 1, d); })();
                const moodObj = MOODS.find((m) => m.value === e.mood);
                return (
                  <button
                    key={e.date}
                    className={`jnlEntryBtn ${e.date === selectedDate ? "jnlEntryActive" : ""}`}
                    onClick={() => setSelectedDate(e.date)}
                    type="button"
                  >
                    <div className="jnlEntryDate">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="jnlEntryPreview">
                      {moodObj && <span>{moodObj.emoji}</span>}
                      {e.preview || "Empty entry"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="jnlEditor">
          {selectedDate && selectedDateObj && (
            <>
              <div className="jnlEditorHeader">
                <div className="jnlEditorDate">
                  {selectedDateObj.toLocaleDateString(undefined, {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </div>
                <div className="jnlMoodPicker">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      className={`jnlMoodBtn ${mood === m.value ? "jnlMoodActive" : ""}`}
                      onClick={() => handleMoodChange(m.value)}
                      title={m.label}
                      type="button"
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="jnlTextarea"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="What's on your mind today?"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
