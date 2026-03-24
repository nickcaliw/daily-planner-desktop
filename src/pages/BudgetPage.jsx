import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const api = typeof window !== "undefined" ? window.settingsApi : null;

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const CATEGORY_ICONS = {
  housing: "🏠", groceries: "🛒", dining: "🍽️", transport: "🚗",
  entertainment: "🎬", subscriptions: "📦", health: "💊", shopping: "🛍️",
  savings: "💰", other: "📁",
};

const DEFAULT_CATEGORIES = [
  { id: genId(), name: "Housing", icon: "housing", budgeted: 0, spent: 0 },
  { id: genId(), name: "Groceries", icon: "groceries", budgeted: 0, spent: 0 },
  { id: genId(), name: "Dining", icon: "dining", budgeted: 0, spent: 0 },
  { id: genId(), name: "Transport", icon: "transport", budgeted: 0, spent: 0 },
  { id: genId(), name: "Entertainment", icon: "entertainment", budgeted: 0, spent: 0 },
  { id: genId(), name: "Subscriptions", icon: "subscriptions", budgeted: 0, spent: 0 },
  { id: genId(), name: "Health", icon: "health", budgeted: 0, spent: 0 },
  { id: genId(), name: "Shopping", icon: "shopping", budgeted: 0, spent: 0 },
  { id: genId(), name: "Savings", icon: "savings", budgeted: 0, spent: 0 },
  { id: genId(), name: "Other", icon: "other", budgeted: 0, spent: 0 },
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

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function BudgetPage() {
  const [month, setMonth] = useState(() => getMonthKey(new Date()));
  const [targets, setTargets] = useState(null);   // { income, savingsGoal, categories }
  const [actuals, setActuals] = useState(null);    // { categories: { [id]: spent } }
  const saveTargetsTimer = useRef(null);
  const saveActualsTimer = useRef(null);

  // Load budget targets
  const loadTargets = useCallback(async () => {
    if (!api) {
      setTargets({ income: 0, savingsGoal: 0, categories: DEFAULT_CATEGORIES.map(c => ({ ...c, id: genId() })) });
      return;
    }
    const raw = await api.get("budget_targets");
    if (raw) {
      try {
        setTargets(JSON.parse(raw));
      } catch {
        setTargets({ income: 0, savingsGoal: 0, categories: DEFAULT_CATEGORIES.map(c => ({ ...c, id: genId() })) });
      }
    } else {
      setTargets({ income: 0, savingsGoal: 0, categories: DEFAULT_CATEGORIES.map(c => ({ ...c, id: genId() })) });
    }
  }, []);

  // Load actual spending for current month
  const loadActuals = useCallback(async () => {
    if (!api) { setActuals({ categories: {} }); return; }
    const raw = await api.get(`budget_actual_${month}`);
    if (raw) {
      try { setActuals(JSON.parse(raw)); } catch { setActuals({ categories: {} }); }
    } else {
      setActuals({ categories: {} });
    }
  }, [month]);

  useEffect(() => { loadTargets(); }, [loadTargets]);
  useEffect(() => { loadActuals(); }, [loadActuals]);

  // Save helpers with debounce
  const saveTargets = useCallback((next) => {
    setTargets(next);
    if (saveTargetsTimer.current) clearTimeout(saveTargetsTimer.current);
    saveTargetsTimer.current = setTimeout(() => {
      if (api) api.set("budget_targets", JSON.stringify(next));
    }, 300);
  }, []);

  const saveActuals = useCallback((next) => {
    setActuals(next);
    if (saveActualsTimer.current) clearTimeout(saveActualsTimer.current);
    saveActualsTimer.current = setTimeout(() => {
      if (api) api.set(`budget_actual_${month}`, JSON.stringify(next));
    }, 300);
  }, [month]);

  // Category CRUD
  const updateTargetField = (id, field, value) => {
    if (!targets) return;
    const cats = targets.categories.map(c => c.id === id ? { ...c, [field]: value } : c);
    saveTargets({ ...targets, categories: cats });
  };

  const updateSpent = (id, value) => {
    if (!actuals) return;
    const next = { ...actuals, categories: { ...actuals.categories, [id]: value } };
    saveActuals(next);
  };

  const addCategory = () => {
    if (!targets) return;
    const cat = { id: genId(), name: "", icon: "other", budgeted: 0, spent: 0 };
    saveTargets({ ...targets, categories: [...targets.categories, cat] });
  };

  const removeCategory = (id) => {
    if (!targets) return;
    saveTargets({ ...targets, categories: targets.categories.filter(c => c.id !== id) });
    if (actuals?.categories?.[id] !== undefined) {
      const { [id]: _, ...rest } = actuals.categories;
      saveActuals({ ...actuals, categories: rest });
    }
  };

  // Computed totals
  const totals = useMemo(() => {
    if (!targets) return { income: 0, totalBudget: 0, totalSpent: 0, remaining: 0 };
    const income = Number(targets.income) || 0;
    const totalBudget = targets.categories.reduce((s, c) => s + (Number(c.budgeted) || 0), 0);
    const totalSpent = targets.categories.reduce((s, c) => {
      const spent = Number(actuals?.categories?.[c.id]) || 0;
      return s + spent;
    }, 0);
    return { income, totalBudget, totalSpent, remaining: income - totalSpent };
  }, [targets, actuals]);

  const savingsProgress = useMemo(() => {
    if (!targets) return { goal: 0, actual: 0, pct: 0 };
    const goal = Number(targets.savingsGoal) || 0;
    const actual = totals.income - totals.totalSpent;
    const pct = goal > 0 ? Math.min((Math.max(actual, 0) / goal) * 100, 100) : 0;
    return { goal, actual, pct };
  }, [targets, totals]);

  if (!targets || !actuals) return null;

  return (
    <div className="budgPage">
      <style>{CSS}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Budget</h1>
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

      <div className="budgContent">
        {/* Summary cards */}
        <div className="budgSummary">
          <div className="budgCard">
            <div className="budgCardLabel">Monthly Income</div>
            <div className="budgCardInputWrap">
              <span className="budgCurrency">$</span>
              <input
                type="number"
                className="budgCardInput"
                value={targets.income || ""}
                onChange={e => saveTargets({ ...targets, income: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="budgCard">
            <div className="budgCardLabel">Total Budget</div>
            <div className="budgCardValue">${fmt(totals.totalBudget)}</div>
          </div>
          <div className="budgCard">
            <div className="budgCardLabel">Total Spent</div>
            <div className="budgCardValue budgSpent">${fmt(totals.totalSpent)}</div>
          </div>
          <div className="budgCard">
            <div className="budgCardLabel">Remaining</div>
            <div className={`budgCardValue ${totals.remaining >= 0 ? "budgPositive" : "budgNegative"}`}>
              ${fmt(Math.abs(totals.remaining))}{totals.remaining < 0 ? " over" : ""}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        {totals.totalBudget > 0 && (
          <div className="budgOverallProgress">
            <div className="budgProgressHeader">
              <span className="budgProgressLabel">
                Budget used: ${fmt(totals.totalSpent)} of ${fmt(totals.totalBudget)}
              </span>
              <span className={`budgProgressPct ${totals.totalSpent > totals.totalBudget ? "budgNegative" : ""}`}>
                {Math.round((totals.totalSpent / totals.totalBudget) * 100)}%
              </span>
            </div>
            <div className="budgBar">
              <div
                className="budgBarFill"
                style={{
                  width: `${Math.min((totals.totalSpent / totals.totalBudget) * 100, 100)}%`,
                  background: totals.totalSpent > totals.totalBudget ? "#d32f2f" : "#4caf50",
                }}
              />
            </div>
          </div>
        )}

        {/* Budget vs Actual table */}
        <div className="budgTable">
          <div className="budgTableHeader">
            <span className="budgHeaderIcon"></span>
            <span className="budgHeaderName">Category</span>
            <span className="budgHeaderNum">Budget</span>
            <span className="budgHeaderNum">Spent</span>
            <span className="budgHeaderNum">Remaining</span>
            <span className="budgHeaderProgress">Progress</span>
            <span className="budgHeaderDel"></span>
          </div>
          {targets.categories.map(cat => {
            const budgeted = Number(cat.budgeted) || 0;
            const spent = Number(actuals.categories?.[cat.id]) || 0;
            const rem = budgeted - spent;
            const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const over = spent > budgeted && budgeted > 0;

            return (
              <div className="budgRow" key={cat.id}>
                <span className="budgRowIcon">{CATEGORY_ICONS[cat.icon] || "📁"}</span>
                <div className="budgRowName">
                  <input
                    className="budgNameInput"
                    value={cat.name}
                    onChange={e => updateTargetField(cat.id, "name", e.target.value)}
                    placeholder="Category name…"
                  />
                </div>
                <div className="budgRowCell">
                  <span className="budgCellDollar">$</span>
                  <input
                    type="number"
                    className="budgCellInput"
                    value={cat.budgeted || ""}
                    onChange={e => updateTargetField(cat.id, "budgeted", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="budgRowCell">
                  <span className="budgCellDollar">$</span>
                  <input
                    type="number"
                    className="budgCellInput"
                    value={actuals.categories?.[cat.id] || ""}
                    onChange={e => updateSpent(cat.id, e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="budgRowRemaining">
                  <span className={rem >= 0 ? "budgPositive" : "budgNegative"}>
                    ${fmt(Math.abs(rem))}{rem < 0 ? " over" : ""}
                  </span>
                </div>
                <div className="budgRowProgress">
                  <div className="budgBar budgBarSmall">
                    <div
                      className="budgBarFill"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: over ? "#d32f2f" : "#4caf50",
                      }}
                    />
                  </div>
                  {budgeted > 0 && (
                    <span className={`budgRowPct ${over ? "budgNegative" : ""}`}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
                <button className="budgRowDel" onClick={() => removeCategory(cat.id)} title="Remove category">×</button>
              </div>
            );
          })}
        </div>

        <button className="btn budgAddBtn" onClick={addCategory} type="button">+ Add Category</button>

        {/* Savings Goal Section */}
        <div className="budgSavingsSection">
          <h2 className="budgSavingsTitle">Savings Goal</h2>
          <div className="budgSavingsContent">
            <div className="budgSavingsInputGroup">
              <label className="budgSavingsLabel">Monthly Savings Target</label>
              <div className="budgSavingsInputWrap">
                <span className="budgCurrency">$</span>
                <input
                  type="number"
                  className="budgSavingsInput"
                  value={targets.savingsGoal || ""}
                  onChange={e => saveTargets({ ...targets, savingsGoal: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="budgSavingsStats">
              <div className="budgSavingsStat">
                <span className="budgSavingsStatLabel">Target</span>
                <span className="budgSavingsStatValue">${fmt(savingsProgress.goal)}</span>
              </div>
              <div className="budgSavingsStat">
                <span className="budgSavingsStatLabel">Actual Savings</span>
                <span className={`budgSavingsStatValue ${savingsProgress.actual >= 0 ? "budgPositive" : "budgNegative"}`}>
                  ${fmt(Math.abs(savingsProgress.actual))}{savingsProgress.actual < 0 ? " deficit" : ""}
                </span>
              </div>
            </div>
            {savingsProgress.goal > 0 && (
              <div className="budgSavingsBar">
                <div className="budgProgressHeader">
                  <span className="budgProgressLabel">
                    Savings progress: ${fmt(Math.max(savingsProgress.actual, 0))} of ${fmt(savingsProgress.goal)}
                  </span>
                  <span className={`budgProgressPct ${savingsProgress.actual < savingsProgress.goal ? "" : "budgPositive"}`}>
                    {Math.round(savingsProgress.pct)}%
                  </span>
                </div>
                <div className="budgBar">
                  <div
                    className="budgBarFill"
                    style={{
                      width: `${savingsProgress.pct}%`,
                      background: savingsProgress.actual >= savingsProgress.goal ? "#4caf50" : "#5B7CF5",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.budgPage {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.budgContent {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 48px;
}

/* Summary cards */
.budgSummary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.budgCard {
  background: #fbf7f0;
  border: 1px solid #e8e0d4;
  border-radius: 12px;
  padding: 16px 20px;
}
.budgCardLabel {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #998a76;
  margin-bottom: 8px;
}
.budgCardValue {
  font-size: 24px;
  font-weight: 700;
  color: #3e3529;
}
.budgCardInputWrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.budgCurrency {
  font-size: 20px;
  font-weight: 600;
  color: #998a76;
}
.budgCardInput {
  font-size: 24px;
  font-weight: 700;
  color: #3e3529;
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-family: inherit;
}
.budgCardInput::-webkit-inner-spin-button,
.budgCardInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.budgSpent { color: #e57a3a; }
.budgPositive { color: #4caf50; }
.budgNegative { color: #d32f2f; }

/* Overall progress */
.budgOverallProgress {
  margin-bottom: 24px;
  background: #fbf7f0;
  border: 1px solid #e8e0d4;
  border-radius: 12px;
  padding: 16px 20px;
}
.budgProgressHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.budgProgressLabel {
  font-size: 13px;
  color: #998a76;
  font-weight: 500;
}
.budgProgressPct {
  font-size: 13px;
  font-weight: 700;
  color: #3e3529;
}

/* Progress bars */
.budgBar {
  height: 8px;
  background: #eae3d8;
  border-radius: 4px;
  overflow: hidden;
}
.budgBarSmall {
  height: 6px;
  flex: 1;
}
.budgBarFill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  background: #4caf50;
}

/* Table */
.budgTable {
  background: #fbf7f0;
  border: 1px solid #e8e0d4;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.budgTableHeader {
  display: grid;
  grid-template-columns: 36px 1fr 100px 100px 100px 140px 32px;
  gap: 8px;
  padding: 10px 16px;
  background: #f2ece2;
  border-bottom: 1px solid #e8e0d4;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #998a76;
  align-items: center;
}
.budgHeaderNum {
  text-align: right;
}
.budgRow {
  display: grid;
  grid-template-columns: 36px 1fr 100px 100px 100px 140px 32px;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #eee8de;
  align-items: center;
  transition: background 0.15s;
}
.budgRow:last-child { border-bottom: none; }
.budgRow:hover { background: #f9f4ec; }
.budgRowIcon {
  font-size: 18px;
  text-align: center;
}
.budgRowName {
  min-width: 0;
}
.budgNameInput {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #3e3529;
  outline: none;
  font-family: inherit;
  padding: 4px 0;
}
.budgNameInput::placeholder { color: #c4b8a8; }
.budgRowCell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}
.budgCellDollar {
  font-size: 13px;
  color: #998a76;
  font-weight: 500;
}
.budgCellInput {
  width: 70px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #3e3529;
  text-align: right;
  outline: none;
  font-family: inherit;
  padding: 4px 0;
}
.budgCellInput::-webkit-inner-spin-button,
.budgCellInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.budgCellInput:focus {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #5B7CF533;
}
.budgRowRemaining {
  text-align: right;
  font-size: 14px;
  font-weight: 600;
}
.budgRowProgress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.budgRowPct {
  font-size: 11px;
  font-weight: 600;
  color: #998a76;
  min-width: 32px;
  text-align: right;
}
.budgRowDel {
  background: none;
  border: none;
  color: #c4b8a8;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.budgRowDel:hover {
  color: #d32f2f;
  background: #fdecea;
}

/* Add button */
.budgAddBtn {
  margin-bottom: 32px;
}

/* Savings Goal */
.budgSavingsSection {
  background: #fbf7f0;
  border: 1px solid #e8e0d4;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 32px;
}
.budgSavingsTitle {
  font-size: 16px;
  font-weight: 700;
  color: #3e3529;
  margin: 0 0 16px;
}
.budgSavingsContent {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.budgSavingsInputGroup {
  display: flex;
  align-items: center;
  gap: 12px;
}
.budgSavingsLabel {
  font-size: 13px;
  font-weight: 500;
  color: #998a76;
  white-space: nowrap;
}
.budgSavingsInputWrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #e8e0d4;
  border-radius: 8px;
  padding: 6px 12px;
}
.budgSavingsInput {
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  color: #3e3529;
  outline: none;
  width: 120px;
  font-family: inherit;
}
.budgSavingsInput::-webkit-inner-spin-button,
.budgSavingsInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.budgSavingsStats {
  display: flex;
  gap: 32px;
}
.budgSavingsStat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.budgSavingsStatLabel {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #998a76;
}
.budgSavingsStatValue {
  font-size: 20px;
  font-weight: 700;
  color: #3e3529;
}
.budgSavingsBar {
  margin-top: 4px;
}
`;
