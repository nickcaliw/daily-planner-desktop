import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.budgetApi : null;

function useDragReorder(items, onReorder) {
  const dragIdx = useRef(null);
  const overIdx = useRef(null);

  const onDragStart = (idx) => (e) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.target) e.target.style.opacity = "0.5";
  };

  const onDragEnd = (e) => {
    if (e.target) e.target.style.opacity = "1";
    if (dragIdx.current !== null && overIdx.current !== null && dragIdx.current !== overIdx.current) {
      const next = [...items];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(overIdx.current, 0, moved);
      onReorder(next);
    }
    dragIdx.current = null;
    overIdx.current = null;
  };

  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    overIdx.current = idx;
  };

  return { onDragStart, onDragEnd, onDragOver };
}
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const DEFAULT_CATEGORIES = [
  { id: genId(), name: "Housing", budgeted: "", spent: "", icon: "home" },
  { id: genId(), name: "Groceries", budgeted: "", spent: "", icon: "cart" },
  { id: genId(), name: "Transportation", budgeted: "", spent: "", icon: "car" },
  { id: genId(), name: "Dining Out", budgeted: "", spent: "", icon: "food" },
  { id: genId(), name: "Entertainment", budgeted: "", spent: "", icon: "fun" },
  { id: genId(), name: "Subscriptions", budgeted: "", spent: "", icon: "sub" },
  { id: genId(), name: "Health", budgeted: "", spent: "", icon: "health" },
  { id: genId(), name: "Savings", budgeted: "", spent: "", icon: "save" },
];

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function addMonths(key, n) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n);
  return getMonthKey(d);
}

export default function FinancesPage() {
  const [month, setMonth] = useState(() => getMonthKey(new Date()));
  const [data, setData] = useState(null);
  const saveTimer = useRef(null);

  const load = useCallback(async () => {
    if (api) {
      const d = await api.get(month);
      setData(d || { income: "", categories: DEFAULT_CATEGORIES.map(c => ({ ...c, id: genId() })) });
    } else {
      setData({ income: "", categories: DEFAULT_CATEGORIES.map(c => ({ ...c, id: genId() })) });
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback((patch) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { if (api) api.save(month, next); }, 300);
      return next;
    });
  }, [month]);

  const updateCategory = (id, field, value) => {
    if (!data) return;
    const cats = data.categories.map(c => c.id === id ? { ...c, [field]: value } : c);
    save({ categories: cats });
  };

  const addCategory = () => {
    if (!data) return;
    const cats = [...data.categories, { id: genId(), name: "", budgeted: "", spent: "", icon: "other" }];
    save({ categories: cats });
  };

  const deleteCategory = (id) => {
    if (!data) return;
    const cats = data.categories.filter(c => c.id !== id);
    save({ categories: cats });
  };

  const { onDragStart, onDragEnd, onDragOver } = useDragReorder(
    data?.categories || [],
    (reordered) => save({ categories: reordered })
  );

  // Totals
  const totalBudgeted = data?.categories?.reduce((s, c) => s + (Number(c.budgeted) || 0), 0) || 0;
  const totalSpent = data?.categories?.reduce((s, c) => s + (Number(c.spent) || 0), 0) || 0;
  const income = Number(data?.income) || 0;
  const remaining = income - totalSpent;
  const budgetRemaining = totalBudgeted - totalSpent;

  return (
    <div className="finPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Finances</h1>
          <div className="weekBadge">{formatMonth(month)}</div>
        </div>
        <div className="nav">
          <button className="btn" onClick={() => setMonth(m => addMonths(m, -1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="btn" onClick={() => setMonth(m => addMonths(m, 1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          <button className="btn btnPrimary" onClick={() => setMonth(getMonthKey(new Date()))}>This Month</button>
        </div>
      </div>

      {data && (
        <div className="finContent">
          {/* Summary cards */}
          <div className="finSummary">
            <div className="finSummaryCard">
              <div className="finSummaryLabel">Income</div>
              <div className="finSummaryInputWrap">
                <span className="finCurrency">$</span>
                <input type="number" className="finSummaryInput" value={data.income || ""}
                  onChange={e => save({ income: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="finSummaryCard">
              <div className="finSummaryLabel">Budgeted</div>
              <div className="finSummaryValue">${totalBudgeted.toLocaleString()}</div>
            </div>
            <div className="finSummaryCard">
              <div className="finSummaryLabel">Spent</div>
              <div className="finSummaryValue finSpent">${totalSpent.toLocaleString()}</div>
            </div>
            <div className="finSummaryCard">
              <div className="finSummaryLabel">Remaining</div>
              <div className={`finSummaryValue ${remaining >= 0 ? "finPositive" : "finNegative"}`}>
                ${Math.abs(remaining).toLocaleString()}{remaining < 0 ? " over" : ""}
              </div>
            </div>
          </div>

          {/* Overall progress */}
          {totalBudgeted > 0 && (
            <div className="finProgressSection">
              <div className="finProgressHeader">
                <span className="finProgressLabel">
                  Budget used: ${totalSpent.toLocaleString()} of ${totalBudgeted.toLocaleString()}
                </span>
                <span className={`finProgressPct ${totalSpent > totalBudgeted ? "finNegative" : ""}`}>
                  {Math.round((totalSpent / totalBudgeted) * 100)}%
                </span>
              </div>
              <div className="progressBar" style={{ height: 8 }}>
                <div className="progressFill" style={{
                  width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
                  background: totalSpent > totalBudgeted ? "#d32f2f" : undefined,
                }} />
              </div>
            </div>
          )}

          {/* Category list */}
          <div className="finCategories">
            <div className="finCatHeader">
              <span className="finCatHeaderGrip"></span>
              <span className="finCatHeaderName">Category</span>
              <span className="finCatHeaderNum">Budgeted</span>
              <span className="finCatHeaderNum">Spent</span>
              <span className="finCatHeaderNum">Remaining</span>
              <span className="finCatHeaderDel"></span>
            </div>
            {data.categories.map((cat, idx) => {
              const b = Number(cat.budgeted) || 0;
              const s = Number(cat.spent) || 0;
              const r = b - s;
              const pct = b > 0 ? Math.min((s / b) * 100, 100) : 0;
              const over = s > b && b > 0;
              return (
                <div className="finCatRow" key={cat.id}
                  draggable
                  onDragStart={onDragStart(idx)}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver(idx)}>
                  <div className="finCatGrip" title="Drag to reorder">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/>
                      <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                      <circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/>
                    </svg>
                  </div>
                  <div className="finCatName">
                    <input className="finCatNameInput" value={cat.name}
                      onChange={e => updateCategory(cat.id, "name", e.target.value)}
                      placeholder="Category name…" />
                    {b > 0 && (
                      <div className="progressBar" style={{ height: 4, marginTop: 4 }}>
                        <div className="progressFill" style={{
                          width: `${pct}%`,
                          background: over ? "#d32f2f" : undefined,
                        }} />
                      </div>
                    )}
                  </div>
                  <div className="finCatCell">
                    <span className="finCellDollar">$</span>
                    <input type="number" className="finCatInput" value={cat.budgeted || ""}
                      onChange={e => updateCategory(cat.id, "budgeted", e.target.value)}
                      placeholder="0" />
                  </div>
                  <div className="finCatCell">
                    <span className="finCellDollar">$</span>
                    <input type="number" className="finCatInput" value={cat.spent || ""}
                      onChange={e => updateCategory(cat.id, "spent", e.target.value)}
                      placeholder="0" />
                  </div>
                  <div className="finCatRemaining">
                    <span className={r >= 0 ? "finPositive" : "finNegative"}>
                      ${Math.abs(r).toLocaleString()}
                      {r < 0 ? " over" : ""}
                    </span>
                  </div>
                  <button className="finCatDel" onClick={() => deleteCategory(cat.id)} type="button"
                    title="Remove category">×</button>
                </div>
              );
            })}
          </div>

          <button className="btn finAddBtn" onClick={addCategory} type="button">+ Add Category</button>
        </div>
      )}
    </div>
  );
}
