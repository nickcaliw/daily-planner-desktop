import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.lettersApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function timeUntil(dateStr) {
  if (!dateStr) return "";
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - now) / 86400000);
  if (days < 0) return "Ready to open!";
  if (days === 0) return "Opens today!";
  if (days === 1) return "Opens tomorrow";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export default function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "sealed" | "opened"
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setLetters(await api.list() || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setLetters(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => { if (api) api.save(id, data); }, 300);
  }, []);

  const addLetter = async () => {
    const id = genId();
    const today = new Date().toISOString().split("T")[0];
    const data = {
      title: "Dear Future Me",
      body: "",
      writtenDate: today,
      openDate: "",
      opened: false,
      mood: "",
      goals: "",
    };
    if (api) await api.save(id, data);
    await refresh();
    setSelectedId(id);
  };

  const deleteLetter = async (id) => {
    if (api) await api.delete(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  };

  const openLetter = (id) => {
    const letter = letters.find(l => l.id === id);
    if (!letter) return;
    save(id, { ...letter, opened: true });
  };

  const selected = letters.find(l => l.id === selectedId);

  const filtered = letters.filter(l => {
    if (filter === "sealed") return !l.opened;
    if (filter === "opened") return l.opened;
    return true;
  });

  const canOpen = (letter) => {
    if (!letter.openDate) return true;
    const target = new Date(letter.openDate + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now >= target;
  };

  return (
    <div className="ltPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Future Self Letters</h1>
          <div className="weekBadge">{letters.length} letters</div>
        </div>
        <div className="nav">
          <div className="ltFilterRow">
            {["all", "sealed", "opened"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addLetter} type="button">+ Write Letter</button>
        </div>
      </div>

      <div className="ltBody">
        <div className="ltList">
          {filtered.map(letter => (
            <button
              key={letter.id}
              className={`ltCard ${letter.id === selectedId ? "ltCardActive" : ""} ${letter.opened ? "ltCardOpened" : ""}`}
              onClick={() => setSelectedId(letter.id === selectedId ? null : letter.id)}
              type="button"
            >
              <div className="ltCardIcon">{letter.opened ? "📖" : "✉️"}</div>
              <div className="ltCardInfo">
                <div className="ltCardTitle">{letter.title}</div>
                <div className="ltCardMeta">
                  Written {new Date(letter.writtenDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  {letter.openDate && !letter.opened && (
                    <span className="ltCardCountdown"> · {timeUntil(letter.openDate)}</span>
                  )}
                </div>
              </div>
              <div className={`ltCardStatus ${letter.opened ? "ltStatusOpened" : "ltStatusSealed"}`}>
                {letter.opened ? "Opened" : "Sealed"}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
              No letters yet. Write one to your future self.
            </div>
          )}
        </div>

        {selected && (
          <div className="ltDetail">
            <div className="ltDetailSection">
              <label className="ltLabel">Title</label>
              <input className="ltInput" value={selected.title}
                onChange={e => save(selectedId, { ...selected, title: e.target.value })} />
            </div>

            <div className="ltDetailRow">
              <div className="ltDetailSection" style={{ flex: 1 }}>
                <label className="ltLabel">Written On</label>
                <input type="date" className="ltInput" value={selected.writtenDate || ""}
                  onChange={e => save(selectedId, { ...selected, writtenDate: e.target.value })} />
              </div>
              <div className="ltDetailSection" style={{ flex: 1 }}>
                <label className="ltLabel">Open On</label>
                <input type="date" className="ltInput" value={selected.openDate || ""}
                  onChange={e => save(selectedId, { ...selected, openDate: e.target.value })} />
              </div>
            </div>

            {!selected.opened && (
              <div className="ltDetailSection">
                <label className="ltLabel">Current Mood</label>
                <input className="ltInput" value={selected.mood || ""}
                  onChange={e => save(selectedId, { ...selected, mood: e.target.value })}
                  placeholder="How are you feeling right now?" />
              </div>
            )}

            <div className="ltDetailSection">
              <label className="ltLabel">Your Letter</label>
              {selected.opened || !selected.openDate ? (
                <textarea className="ltTextarea" value={selected.body || ""} rows={8}
                  onChange={e => save(selectedId, { ...selected, body: e.target.value })}
                  placeholder="Write to your future self…" />
              ) : (
                <div className="ltSealed">
                  <div className="ltSealedIcon">🔒</div>
                  <div className="ltSealedText">
                    This letter is sealed until {new Date(selected.openDate + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
                  </div>
                  {canOpen(selected) && (
                    <button className="btn btnPrimary" onClick={() => openLetter(selectedId)} type="button">
                      Open Letter
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="ltDetailSection">
              <label className="ltLabel">Goals & Hopes</label>
              <textarea className="ltTextarea" value={selected.goals || ""} rows={3}
                onChange={e => save(selectedId, { ...selected, goals: e.target.value })}
                placeholder="What do you hope to have achieved by the time you read this?" />
            </div>

            <button className="btn ltDeleteBtn" onClick={() => deleteLetter(selectedId)} type="button">
              Delete Letter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
