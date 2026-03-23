import { useCallback, useEffect, useRef, useState } from "react";

const goalsApi = typeof window !== "undefined" ? window.goalsApi : null;
const journalApi = typeof window !== "undefined" ? window.journalApi : null;
const plannerApi = typeof window !== "undefined" ? window.plannerApi : null;

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const CATEGORY_COLORS = {
  milestone: "#5B7CF5",
  achievement: "#4caf50",
  personal: "#e91e63",
  career: "#ff9800",
  health: "#00bcd4",
  other: "#607d8b",
};
const CATEGORIES = Object.keys(CATEGORY_COLORS);

// We store timeline events in the settings API as a JSON blob
const settingsApi = typeof window !== "undefined" ? window.settingsApi : null;

export default function LifeTimelinePage() {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const saveTimer = useRef(null);

  const refresh = useCallback(async () => {
    if (!settingsApi) return;
    const raw = await settingsApi.get("timeline_events");
    if (raw) {
      try { setEvents(JSON.parse(raw)); } catch { setEvents([]); }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveAll = useCallback((evts) => {
    setEvents(evts);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (settingsApi) settingsApi.set("timeline_events", JSON.stringify(evts));
    }, 300);
  }, []);

  const addEvent = () => {
    const id = genId();
    const today = new Date().toISOString().split("T")[0];
    const evt = { id, date: today, title: "New Event", description: "", category: "milestone" };
    const updated = [...events, evt].sort((a, b) => b.date.localeCompare(a.date));
    saveAll(updated);
    setEditingId(id);
  };

  const updateEvent = (id, patch) => {
    const updated = events.map(e => e.id === id ? { ...e, ...patch } : e)
      .sort((a, b) => b.date.localeCompare(a.date));
    saveAll(updated);
  };

  const deleteEvent = (id) => {
    saveAll(events.filter(e => e.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const filtered = filter === "all" ? events : events.filter(e => e.category === filter);

  // Group events by year
  const grouped = {};
  for (const evt of filtered) {
    const year = evt.date?.slice(0, 4) || "Unknown";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(evt);
  }
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="tlPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Life Timeline</h1>
          <div className="weekBadge">{events.length} events</div>
        </div>
        <div className="nav">
          <div className="tlFilterRow">
            <button className={`tabBtn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")} type="button">All</button>
            {CATEGORIES.map(c => (
              <button key={c} className={`tabBtn ${filter === c ? "active" : ""}`}
                onClick={() => setFilter(c)} type="button"
                style={filter === c ? { color: CATEGORY_COLORS[c] } : {}}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addEvent} type="button">+ Add Event</button>
        </div>
      </div>

      <div className="tlBody">
        <div className="tlTimeline">
          {years.map(year => (
            <div key={year} className="tlYear">
              <div className="tlYearLabel">{year}</div>
              <div className="tlEvents">
                {grouped[year].map(evt => {
                  const editing = editingId === evt.id;
                  return (
                    <div key={evt.id} className={`tlEvent ${editing ? "tlEventActive" : ""}`}>
                      <div className="tlEventDot" style={{ background: CATEGORY_COLORS[evt.category] || "#607d8b" }} />
                      <div className="tlEventContent">
                        <div className="tlEventHeader">
                          <div className="tlEventDate">
                            {new Date(evt.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                          <div className="tlEventTitle">{evt.title}</div>
                          <span className="tlEventCat" style={{ color: CATEGORY_COLORS[evt.category] }}>
                            {evt.category}
                          </span>
                          <button className="tlEventEditBtn" onClick={() => setEditingId(editing ? null : evt.id)} type="button">
                            {editing ? "Close" : "Edit"}
                          </button>
                        </div>
                        {evt.description && !editing && (
                          <div className="tlEventDesc">{evt.description}</div>
                        )}
                        {editing && (
                          <div className="tlEventEdit">
                            <input className="tlInput" value={evt.title}
                              onChange={e => updateEvent(evt.id, { title: e.target.value })}
                              placeholder="Event title" />
                            <input type="date" className="tlInput" value={evt.date}
                              onChange={e => updateEvent(evt.id, { date: e.target.value })} />
                            <select className="tlInput" value={evt.category}
                              onChange={e => updateEvent(evt.id, { category: e.target.value })}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                            <textarea className="tlTextarea" value={evt.description || ""} rows={2}
                              onChange={e => updateEvent(evt.id, { description: e.target.value })}
                              placeholder="Description…" />
                            <button className="btn tlDeleteBtn" onClick={() => deleteEvent(evt.id)} type="button">
                              Delete Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>
              No events yet. Add milestones, achievements, and life moments to build your timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
