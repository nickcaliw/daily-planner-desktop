import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.goalsApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const CATEGORIES = ["Health", "Career", "Finance", "Personal", "Learning", "Fitness"];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("active");
  const saveTimer = useRef(null);

  const refresh = useCallback(async () => {
    if (api) setGoals(await api.list() || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const selected = goals.find(g => g.id === selectedId) || null;

  const save = useCallback((id, data) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { if (api) api.save(id, data); }, 300);
  }, []);

  const createGoal = async () => {
    const id = genId();
    const data = { title: "New Goal", description: "", category: "Personal", targetDate: "", status: "active", milestones: [] };
    if (api) await api.save(id, data);
    await refresh();
    setSelectedId(id);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteGoal = async () => {
    if (!selectedId) return;
    if (api) await api.delete(selectedId);
    setSelectedId(null);
    setConfirmDelete(false);
    refresh();
  };

  const addMilestone = () => {
    if (!selected) return;
    const ms = [...(selected.milestones || []), { id: genId(), title: "", done: false }];
    save(selectedId, { ...selected, milestones: ms });
  };

  const updateMilestone = (msId, patch) => {
    if (!selected) return;
    const ms = (selected.milestones || []).map(m => m.id === msId ? { ...m, ...patch } : m);
    save(selectedId, { ...selected, milestones: ms });
  };

  const deleteMilestone = (msId) => {
    if (!selected) return;
    const ms = (selected.milestones || []).filter(m => m.id !== msId);
    save(selectedId, { ...selected, milestones: ms });
  };

  const addCorrection = () => {
    if (!selected) return;
    const cc = [...(selected.corrections || []), { id: genId(), problem: "", fix: "", resolved: false }];
    save(selectedId, { ...selected, corrections: cc });
  };

  const updateCorrection = (ccId, patch) => {
    if (!selected) return;
    const cc = (selected.corrections || []).map(c => c.id === ccId ? { ...c, ...patch } : c);
    save(selectedId, { ...selected, corrections: cc });
  };

  const deleteCorrection = (ccId) => {
    if (!selected) return;
    const cc = (selected.corrections || []).filter(c => c.id !== ccId);
    save(selectedId, { ...selected, corrections: cc });
  };

  const filtered = goals.filter(g => {
    if (filter === "active") return g.status !== "completed";
    if (filter === "completed") return g.status === "completed";
    return true;
  });

  const progress = selected?.milestones?.length
    ? Math.round((selected.milestones.filter(m => m.done).length / selected.milestones.length) * 100)
    : 0;

  return (
    <div className="goalsPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Goals</h1>
          <div className="weekBadge">{goals.filter(g => g.status !== "completed").length} active</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={createGoal}>+ New Goal</button>
        </div>
      </div>

      <div className="goalsBody">
        <div className="goalsList">
          <div className="goalsFilterRow">
            {["active", "completed", "all"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">{f}</button>
            ))}
          </div>
          <div className="goalsEntries">
            {filtered.map(g => {
              const pct = g.milestones?.length
                ? Math.round((g.milestones.filter(m => m.done).length / g.milestones.length) * 100) : 0;
              return (
                <button key={g.id} className={`goalCard ${g.id === selectedId ? "goalCardActive" : ""}`}
                  onClick={() => setSelectedId(g.id)} type="button">
                  <div className="goalCardTop">
                    <div className="goalCardTitle">{g.title}</div>
                    <div className="goalCardCat">{g.category}</div>
                  </div>
                  {g.milestones?.length > 0 && (
                    <div className="progressBar" style={{ height: 5, marginTop: 8 }}>
                      <div className="progressFill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {g.targetDate && <div className="goalCardDate">Target: {g.targetDate}</div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="goalEditor">
          {selected ? (
            <div className="goalEditorInner">
              <div className="goalEditorHeader">
                <input className="ntTitleInput" value={selected.title}
                  onChange={e => save(selectedId, { ...selected, title: e.target.value })}
                  placeholder="Goal title…" />
                <button className="ntDeleteBtn" onClick={() => setConfirmDelete(true)} title="Delete goal" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              <div className="goalFields">
                <div className="goalFieldRow">
                  <label className="label">Category</label>
                  <select className="goalSelect" value={selected.category}
                    onChange={e => save(selectedId, { ...selected, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="goalFieldRow">
                  <label className="label">Target Date</label>
                  <input type="date" className="goalDateInput" value={selected.targetDate || ""}
                    onChange={e => save(selectedId, { ...selected, targetDate: e.target.value })} />
                </div>
                <div className="goalFieldRow">
                  <label className="label">Status</label>
                  <select className="goalSelect" value={selected.status}
                    onChange={e => save(selectedId, { ...selected, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="goalDescSection">
                <label className="label">Description</label>
                <textarea className="goalDescArea" value={selected.description || ""}
                  onChange={e => save(selectedId, { ...selected, description: e.target.value })}
                  placeholder="Describe your goal…" />
              </div>

              <div className="goalMilestones">
                <div className="goalMsHeader">
                  <div className="label" style={{ marginBottom: 0 }}>Milestones</div>
                  {progress > 0 && <span className="goalMsPct">{progress}%</span>}
                  <button className="miniBtn" onClick={addMilestone} type="button">+ Add</button>
                </div>
                {selected.milestones?.length > 0 && (
                  <div className="progressBar" style={{ height: 6, margin: "8px 0 12px" }}>
                    <div className="progressFill" style={{ width: `${progress}%` }} />
                  </div>
                )}
                <div className="goalMsList">
                  {(selected.milestones || []).map(ms => (
                    <div className="goalMsRow" key={ms.id}>
                      <button className={`check ${ms.done ? "on" : ""}`} type="button"
                        onClick={() => updateMilestone(ms.id, { done: !ms.done })}>
                        {ms.done ? "✓" : ""}
                      </button>
                      <input className="goalMsInput" value={ms.title}
                        onChange={e => updateMilestone(ms.id, { title: e.target.value })}
                        placeholder="Milestone…" />
                      <button className="goalMsDel" onClick={() => deleteMilestone(ms.id)} type="button">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="goalCorrections">
                <div className="goalMsHeader">
                  <div className="label" style={{ marginBottom: 0 }}>Course Corrections</div>
                  <button className="miniBtn" onClick={addCorrection} type="button">+ Add</button>
                </div>
                <div className="goalCcList">
                  {(selected.corrections || []).map(cc => (
                    <div className={`goalCcRow ${cc.resolved ? "goalCcResolved" : ""}`} key={cc.id}>
                      <div className="goalCcFields">
                        <div className="goalCcField">
                          <div className="goalCcFieldLabel">What's going wrong</div>
                          <textarea className="goalCcInput" value={cc.problem}
                            onChange={e => updateCorrection(cc.id, { problem: e.target.value })}
                            placeholder="I keep skipping…" rows={2} />
                        </div>
                        <div className="goalCcField">
                          <div className="goalCcFieldLabel">How to fix it</div>
                          <textarea className="goalCcInput" value={cc.fix}
                            onChange={e => updateCorrection(cc.id, { fix: e.target.value })}
                            placeholder="Instead, I will…" rows={2} />
                        </div>
                      </div>
                      <div className="goalCcActions">
                        <button className={`goalCcResolveBtn ${cc.resolved ? "goalCcResolveBtnDone" : ""}`} type="button"
                          onClick={() => updateCorrection(cc.id, { resolved: !cc.resolved })}
                          title={cc.resolved ? "Mark unresolved" : "Mark resolved"}>
                          {cc.resolved ? "✓" : "○"}
                        </button>
                        <button className="goalMsDel" onClick={() => deleteCorrection(cc.id)} type="button">×</button>
                      </div>
                    </div>
                  ))}
                  {(!selected.corrections || selected.corrections.length === 0) && (
                    <div style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>
                      No course corrections yet. Click + Add to identify something to improve.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="ntPlaceholder">
              <div className="ntPlaceholderText">Select a goal or create a new one</div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Goal"
        message={`Delete "${selected?.title || "this goal"}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={deleteGoal}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
