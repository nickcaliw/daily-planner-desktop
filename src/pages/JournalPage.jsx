import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ymd, addDays } from "../lib/dates.js";
import AutoGrowTextarea from "../components/AutoGrowTextarea.jsx";

const api = typeof window !== "undefined" ? window.journalApi : null;
const settingsApi = typeof window !== "undefined" ? window.settingsApi : null;

const MOODS = [
  { value: "great", label: "Great", emoji: "😄", color: "#27ae60", level: 5 },
  { value: "good", label: "Good", emoji: "🙂", color: "#2ecc71", level: 4 },
  { value: "okay", label: "Okay", emoji: "😐", color: "#f1c40f", level: 3 },
  { value: "low", label: "Low", emoji: "😔", color: "#e67e22", level: 2 },
  { value: "tough", label: "Tough", emoji: "😢", color: "#e74c3c", level: 1 },
];

const ENERGY_LEVELS = [
  { level: 1, label: "Very Low" },
  { level: 2, label: "Low" },
  { level: 3, label: "Medium" },
  { level: 4, label: "High" },
  { level: 5, label: "Very High" },
];

const TAGS = ["Work", "Exercise", "Social", "Sleep", "Weather", "Food", "Stress", "Family", "Health", "Creativity"];

export default function JournalPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState(0);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);
  const moodSaveTimer = useRef(null);

  // Weekly mood data
  const [weekMoods, setWeekMoods] = useState({});

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
      // Load mood extra data (energy, tags)
      if (settingsApi) {
        const raw = await settingsApi.get(`mood_${selectedDate}`);
        if (!cancelled && raw) {
          try {
            const data = JSON.parse(raw);
            setEnergy(data.energy || 0);
            setTags(data.tags || []);
          } catch { setEnergy(0); setTags([]); }
        } else if (!cancelled) {
          setEnergy(0);
          setTags([]);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Load week moods for the mini chart
  useEffect(() => {
    async function loadWeek() {
      if (!settingsApi) return;
      const moods = {};
      for (let i = 6; i >= 0; i--) {
        const d = ymd(addDays(today, -i));
        const raw = await settingsApi.get(`mood_${d}`);
        if (raw) {
          try { moods[d] = JSON.parse(raw); } catch { /* skip */ }
        }
        // Also check journal mood
        if (api) {
          const entry = await api.get(d);
          if (entry?.mood && !moods[d]) {
            moods[d] = { mood: MOODS.find(m => m.value === entry.mood)?.level || 0 };
          } else if (entry?.mood && moods[d] && !moods[d].mood) {
            moods[d].mood = MOODS.find(m => m.value === entry.mood)?.level || 0;
          }
        }
      }
      setWeekMoods(moods);
    }
    loadWeek();
  }, [today, selectedDate]);

  // Save journal content
  const save = useCallback((newContent, newMood) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (api && selectedDate) {
        await api.save(selectedDate, newContent, newMood);
        refreshList();
      }
    }, 400);
  }, [selectedDate, refreshList]);

  // Save mood extras (energy, tags)
  const saveMoodExtras = useCallback((newEnergy, newTags, newMoodLevel) => {
    if (moodSaveTimer.current) clearTimeout(moodSaveTimer.current);
    moodSaveTimer.current = setTimeout(() => {
      if (settingsApi) {
        const data = { energy: newEnergy, tags: newTags, mood: newMoodLevel || 0 };
        settingsApi.set(`mood_${selectedDate}`, JSON.stringify(data));
      }
    }, 300);
  }, [selectedDate]);

  const handleContentChange = (v) => {
    setContent(v);
    save(v, mood);
  };

  const handleMoodChange = (v) => {
    setMood(v);
    save(content, v);
    const moodObj = MOODS.find(m => m.value === v);
    saveMoodExtras(energy, tags, moodObj?.level || 0);
  };

  const handleEnergyChange = (level) => {
    setEnergy(level);
    const moodObj = MOODS.find(m => m.value === mood);
    saveMoodExtras(level, tags, moodObj?.level || 0);
  };

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    setTags(next);
    const moodObj = MOODS.find(m => m.value === mood);
    saveMoodExtras(energy, next, moodObj?.level || 0);
  };

  const startNewEntry = () => setSelectedDate(todayStr);

  const selectedDateObj = selectedDate
    ? (() => { const [y, m, d] = selectedDate.split("-").map(Number); return new Date(y, m - 1, d); })()
    : null;

  const moodObj = MOODS.find(m => m.value === mood);

  return (
    <div className="journalPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Journal</h1>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={startNewEntry}>Today's Entry</button>
        </div>
      </div>

      <div className="jnlBody">
        {/* Entry list */}
        <div className="jnlList">
          <div className="jnlListHeader">Entries</div>

          {/* Weekly mood mini chart */}
          <div className="jnlWeekMoods">
            {Array.from({ length: 7 }, (_, i) => {
              const d = ymd(addDays(today, i - 6));
              const data = weekMoods[d];
              const mLevel = data?.mood || 0;
              const mColor = mLevel ? MOODS.find(m => m.level === mLevel)?.color || "#ddd" : "var(--line2)";
              const dayLabel = new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" });
              return (
                <button key={d} className={`jnlWeekDay ${d === selectedDate ? "jnlWeekDayActive" : ""}`}
                  onClick={() => setSelectedDate(d)} type="button">
                  <div className="jnlWeekDot" style={{ background: mColor, width: 8 + mLevel * 4, height: 8 + mLevel * 4 }} />
                  <div className="jnlWeekLabel">{dayLabel}</div>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="loadingMsg">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="jnlEmpty">
              <div className="emptyState">
                <div className="emptyStateIcon">📝</div>
                <div className="emptyStateTitle">Your journal is waiting</div>
                <div className="emptyStateSub">Capture your thoughts, reflect on your day, and track your mood.</div>
              </div>
            </div>
          ) : (
            <div className="jnlEntries">
              {entries.map((e) => {
                const d = (() => { const [y, m, d] = e.date.split("-").map(Number); return new Date(y, m - 1, d); })();
                const mObj = MOODS.find((m) => m.value === e.mood);
                return (
                  <button key={e.date}
                    className={`jnlEntryBtn ${e.date === selectedDate ? "jnlEntryActive" : ""}`}
                    onClick={() => setSelectedDate(e.date)} type="button">
                    <div className="jnlEntryDate">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="jnlEntryPreview">
                      {mObj && <span>{mObj.emoji}</span>}
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
              </div>

              {/* Mood + Energy row */}
              <div className="jnlMoodSection">
                <div className="jnlMoodRow">
                  <div className="jnlSectionLabel">How are you feeling?</div>
                  <div className="jnlMoodPicker">
                    {MOODS.map((m) => (
                      <button key={m.value}
                        className={`jnlMoodBtn ${mood === m.value ? "jnlMoodActive" : ""}`}
                        style={mood === m.value ? { background: m.color + "20", borderColor: m.color } : {}}
                        onClick={() => handleMoodChange(m.value)}
                        title={m.label} type="button">
                        <span className="jnlMoodEmoji">{m.emoji}</span>
                        <span className="jnlMoodLabel">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="jnlMoodRow">
                  <div className="jnlSectionLabel">Energy level</div>
                  <div className="jnlEnergyPicker">
                    {ENERGY_LEVELS.map((e) => (
                      <button key={e.level}
                        className={`jnlEnergyBtn ${energy === e.level ? "jnlEnergyActive" : ""}`}
                        onClick={() => handleEnergyChange(e.level)} type="button">
                        <div className="jnlEnergyBars">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="jnlEnergyBar"
                              style={{ height: i * 4, background: i <= e.level ? (energy === e.level ? "var(--accent)" : "var(--muted)") : "var(--line2)" }} />
                          ))}
                        </div>
                        <span className="jnlEnergyLabel">{e.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="jnlMoodRow">
                  <div className="jnlSectionLabel">What's influencing your mood?</div>
                  <div className="jnlTagPicker">
                    {TAGS.map(tag => (
                      <button key={tag}
                        className={`jnlTag ${tags.includes(tag) ? "jnlTagActive" : ""}`}
                        onClick={() => toggleTag(tag)} type="button">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Journal text */}
              <textarea
                className="jnlTextarea"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your thoughts..."
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        .jnlWeekMoods {
          display: flex; gap: 4px; padding: 12px 14px; border-bottom: 1px solid var(--line2);
          justify-content: space-between;
        }
        .jnlWeekDay {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer; padding: 4px;
          border-radius: 8px; transition: background 0.15s;
        }
        .jnlWeekDay:hover { background: var(--chip); }
        .jnlWeekDayActive { background: var(--accent-soft); }
        .jnlWeekDot {
          border-radius: 50%; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          min-width: 8px; min-height: 8px;
        }
        .jnlWeekLabel { font-size: 10px; color: var(--muted); font-weight: 600; }

        .jnlMoodSection {
          padding: 16px 0; display: flex; flex-direction: column; gap: 16px;
          border-bottom: 1px solid var(--line2); margin-bottom: 16px;
        }
        .jnlMoodRow { display: flex; flex-direction: column; gap: 8px; }
        .jnlSectionLabel {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--muted);
        }
        .jnlMoodPicker { display: flex; gap: 6px; }
        .jnlMoodBtn {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 8px 12px; border: 1.5px solid var(--line2); border-radius: 10px;
          background: none; cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: var(--font);
        }
        .jnlMoodBtn:hover { border-color: var(--line); transform: scale(1.05); }
        .jnlMoodActive { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .jnlMoodEmoji { font-size: 24px; }
        .jnlMoodLabel { font-size: 11px; font-weight: 600; color: var(--muted); }
        .jnlMoodActive .jnlMoodLabel { color: var(--ink); }

        .jnlEnergyPicker { display: flex; gap: 6px; }
        .jnlEnergyBtn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 8px 12px; border: 1.5px solid var(--line2); border-radius: 10px;
          background: none; cursor: pointer; transition: all 0.15s; font-family: var(--font);
        }
        .jnlEnergyBtn:hover { border-color: var(--line); }
        .jnlEnergyActive { border-color: var(--accent); background: var(--accent-soft); }
        .jnlEnergyBars { display: flex; align-items: flex-end; gap: 2px; height: 20px; }
        .jnlEnergyBar { width: 4px; border-radius: 2px; transition: background 0.15s; }
        .jnlEnergyLabel { font-size: 10px; font-weight: 600; color: var(--muted); }
        .jnlEnergyActive .jnlEnergyLabel { color: var(--accent); }

        .jnlTagPicker { display: flex; flex-wrap: wrap; gap: 6px; }
        .jnlTag {
          padding: 5px 12px; border: 1.5px solid var(--line2); border-radius: 20px;
          background: none; font-size: 12px; font-weight: 600; color: var(--muted);
          cursor: pointer; transition: all 0.15s; font-family: var(--font);
        }
        .jnlTag:hover { border-color: var(--accent); color: var(--ink); }
        .jnlTagActive {
          background: var(--accent); color: #fff; border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
