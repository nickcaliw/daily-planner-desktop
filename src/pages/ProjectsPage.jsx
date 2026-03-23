import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.projectsApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const STATUS_OPTIONS = ["active", "paused", "completed", "archived"];
const STATUS_COLORS = { active: "#4caf50", paused: "#ff9800", completed: "#5B7CF5", archived: "#607d8b" };
const STATUS_LABELS = { active: "Active", paused: "Paused", completed: "Done", archived: "Archived" };

function progressPct(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter(t => t.done).length;
  return Math.round((done / tasks.length) * 100);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("active");
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setProjects(await api.list() || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => { if (api) api.save(id, data); }, 300);
  }, []);

  const addProject = async () => {
    const id = genId();
    const data = {
      name: "New Project",
      description: "",
      status: "active",
      color: "#5B7CF5",
      deadline: "",
      tasks: [],
      notes: "",
    };
    if (api) await api.save(id, data);
    await refresh();
    setSelectedId(id);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteProject = async (id) => {
    if (api) await api.delete(id);
    if (selectedId === id) setSelectedId(null);
    setConfirmDelete(false);
    refresh();
  };

  const selected = projects.find(p => p.id === selectedId);

  const filtered = projects.filter(p => {
    if (filter === "all") return true;
    return (p.status || "active") === filter;
  });

  const addTask = () => {
    if (!selected) return;
    const tasks = [...(selected.tasks || []), { id: genId(), text: "", done: false }];
    save(selectedId, { ...selected, tasks });
  };

  const updateTask = (taskId, patch) => {
    if (!selected) return;
    const tasks = (selected.tasks || []).map(t => t.id === taskId ? { ...t, ...patch } : t);
    save(selectedId, { ...selected, tasks });
  };

  const deleteTask = (taskId) => {
    if (!selected) return;
    const tasks = (selected.tasks || []).filter(t => t.id !== taskId);
    save(selectedId, { ...selected, tasks });
  };

  return (
    <div className="projPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Projects</h1>
          <div className="weekBadge">{projects.filter(p => (p.status || "active") === "active").length} active</div>
        </div>
        <div className="nav">
          <div className="projFilterRow">
            {["active", "paused", "completed", "all"].map(f => (
              <button key={f} className={`tabBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)} type="button">
                {f === "all" ? "All" : STATUS_LABELS[f] || f}
              </button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addProject} type="button">+ New Project</button>
        </div>
      </div>

      <div className="projBody">
        <div className="projList">
          {filtered.map(proj => {
            const pct = progressPct(proj.tasks);
            const taskCount = (proj.tasks || []).length;
            const doneCount = (proj.tasks || []).filter(t => t.done).length;
            return (
              <button
                key={proj.id}
                className={`projCard ${proj.id === selectedId ? "projCardActive" : ""}`}
                onClick={() => setSelectedId(proj.id === selectedId ? null : proj.id)}
                type="button"
              >
                <div className="projCardHeader">
                  <div className="projCardColor" style={{ background: proj.color || "#5B7CF5" }} />
                  <div className="projCardInfo">
                    <div className="projCardName">{proj.name}</div>
                    <div className="projCardMeta">
                      <span className="projStatusBadge" style={{ color: STATUS_COLORS[proj.status || "active"] }}>
                        {STATUS_LABELS[proj.status || "active"]}
                      </span>
                      {proj.deadline && (
                        <span className="projDeadline">
                          Due {new Date(proj.deadline + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {taskCount > 0 && (
                  <div className="projCardProgress">
                    <div className="projProgressBar">
                      <div className="projProgressFill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="projProgressLabel">{doneCount}/{taskCount} tasks</div>
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="emptyState">
                <div className="emptyStateIcon">📁</div>
                <div className="emptyStateTitle">No {filter === "all" ? "" : filter} projects yet</div>
                <div className="emptyStateSub">Projects help you organize tasks and track progress toward bigger goals. Click "+ New Project" to kick one off.</div>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="projDetail">
            <div className="projDetailSection">
              <label className="projLabel">Project Name</label>
              <input className="projInput" value={selected.name}
                onChange={e => save(selectedId, { ...selected, name: e.target.value })} />
            </div>

            <div className="projDetailSection">
              <label className="projLabel">Description</label>
              <textarea className="projTextarea" value={selected.description || ""} rows={2}
                onChange={e => save(selectedId, { ...selected, description: e.target.value })}
                placeholder="What is this project about?" />
            </div>

            <div className="projDetailRow">
              <div className="projDetailSection" style={{ flex: 1 }}>
                <label className="projLabel">Status</label>
                <select className="projSelect" value={selected.status || "active"}
                  onChange={e => save(selectedId, { ...selected, status: e.target.value })}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="projDetailSection" style={{ flex: 1 }}>
                <label className="projLabel">Deadline</label>
                <input type="date" className="projInput" value={selected.deadline || ""}
                  onChange={e => save(selectedId, { ...selected, deadline: e.target.value })} />
              </div>
            </div>

            <div className="projDetailSection">
              <div className="projTasksHeader">
                <label className="projLabel">Tasks</label>
                <button className="btn" onClick={addTask} type="button">+ Add Task</button>
              </div>
              <div className="projTaskList">
                {(selected.tasks || []).map(task => (
                  <div key={task.id} className={`projTask ${task.done ? "projTaskDone" : ""}`}>
                    <button
                      className={`projTaskCheck ${task.done ? "projTaskCheckOn" : ""}`}
                      onClick={() => updateTask(task.id, { done: !task.done })}
                      type="button"
                    >
                      {task.done ? "✓" : ""}
                    </button>
                    <input
                      className="projTaskInput"
                      value={task.text}
                      onChange={e => updateTask(task.id, { text: e.target.value })}
                      placeholder="Task description…"
                    />
                    <button className="projTaskDelete" onClick={() => deleteTask(task.id)} type="button">×</button>
                  </div>
                ))}
                {(!selected.tasks || selected.tasks.length === 0) && (
                  <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>
                    No tasks yet. Click + Add Task to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="projDetailSection">
              <label className="projLabel">Notes</label>
              <textarea className="projTextarea" value={selected.notes || ""} rows={3}
                onChange={e => save(selectedId, { ...selected, notes: e.target.value })}
                placeholder="Project notes…" />
            </div>

            <button className="btn projDeleteBtn" onClick={() => setConfirmDelete(true)} type="button">
              Delete Project
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Project"
        message={`Delete "${selected?.name || "this project"}" and all its tasks? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteProject(selectedId)}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
