import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "subscriptions";
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const CATEGORIES = ["Entertainment", "Software", "Health", "Music", "News", "Cloud", "Other"];
const CATEGORY_COLORS = {
  Entertainment: "#e91e63",
  Software: "#5B7CF5",
  Health: "#4caf50",
  Music: "#9c27b0",
  News: "#ff9800",
  Cloud: "#00bcd4",
  Other: "#607d8b",
};

const CYCLES = ["monthly", "yearly"];

function monthlyEquivalent(cost, cycle) {
  const c = Number(cost) || 0;
  return cycle === "yearly" ? c / 12 : c;
}

function formatCurrency(n) {
  return "$" + Number(n || 0).toFixed(2);
}

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("cost"); // "cost" | "name" | "date"
  const [confirmDelete, setConfirmDelete] = useState(null);
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems(await api.list(COLLECTION) || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((id, data) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => { if (api) api.save(id, COLLECTION, data); }, 300);
  }, []);

  const addItem = async () => {
    const id = genId();
    const data = {
      name: "New Subscription",
      cost: 0,
      cycle: "monthly",
      category: "Other",
      nextBilling: "",
      active: true,
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
  };

  const deleteItem = async (id) => {
    if (api) await api.delete(id);
    setConfirmDelete(null);
    refresh();
  };

  const activeItems = useMemo(() => items.filter(i => i.active !== false), [items]);

  const monthlyTotal = useMemo(() =>
    activeItems.reduce((sum, i) => sum + monthlyEquivalent(i.cost, i.cycle), 0),
    [activeItems]
  );

  const yearlyTotal = useMemo(() => monthlyTotal * 12, [monthlyTotal]);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sortBy === "cost") return copy.sort((a, b) => monthlyEquivalent(b.cost, b.cycle) - monthlyEquivalent(a.cost, a.cycle));
    if (sortBy === "name") return copy.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortBy === "date") return copy.sort((a, b) => (a.nextBilling || "9999").localeCompare(b.nextBilling || "9999"));
    return copy;
  }, [items, sortBy]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    for (const item of activeItems) {
      const cat = item.category || "Other";
      map[cat] = (map[cat] || 0) + monthlyEquivalent(item.cost, item.cycle);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activeItems]);

  const maxCategoryVal = useMemo(() =>
    categoryBreakdown.length > 0 ? Math.max(...categoryBreakdown.map(c => c[1])) : 1,
    [categoryBreakdown]
  );

  return (
    <div className="subsPage">
      <style>{`
        .subsPage{display:flex;flex-direction:column;height:100%;overflow:hidden;}
        .subsContent{flex:1;overflow-y:auto;padding:0 24px 40px;}

        /* Summary cards */
        .subsSummary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}
        .subsSummaryCard{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:18px 20px;text-align:center;}
        .subsSummaryLabel{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
        .subsSummaryValue{font-size:24px;font-weight:700;color:var(--text);}
        .subsSummaryValueAccent{color:var(--accent);}

        /* Table */
        .subsTable{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:28px;}
        .subsTable th{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;text-align:left;border-bottom:1.5px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:1;}
        .subsTable td{padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .subsTable tr:last-child td{border-bottom:none;}
        .subsTableRow{transition:background .1s;}
        .subsTableRow:hover{background:rgba(91,124,245,.04);}

        .subsInput{border:1.5px solid transparent;border-radius:6px;padding:5px 8px;font-size:13px;background:transparent;color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;width:100%;}
        .subsInput:focus{border-color:var(--accent);background:var(--bg);}
        .subsInputCost{width:80px;text-align:right;}
        .subsSelect{border:1.5px solid transparent;border-radius:6px;padding:5px 8px;font-size:13px;background:transparent;color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;cursor:pointer;}
        .subsSelect:focus{border-color:var(--accent);background:var(--bg);}
        .subsDateInput{border:1.5px solid transparent;border-radius:6px;padding:5px 8px;font-size:13px;background:transparent;color:var(--text);font-family:inherit;outline:none;transition:border-color .15s;}
        .subsDateInput:focus{border-color:var(--accent);background:var(--bg);}

        .subsToggle{width:38px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .2s;padding:0;}
        .subsToggleActive{background:#4caf50;}
        .subsTogglePaused{background:#bdbdbd;}
        .subsToggleDot{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
        .subsToggleDotActive{left:20px;}
        .subsToggleDotPaused{left:2px;}

        .subsDeleteBtn{background:none;border:none;color:var(--muted);cursor:pointer;padding:4px 8px;border-radius:6px;font-size:16px;line-height:1;transition:color .15s,background .15s;}
        .subsDeleteBtn:hover{color:#e53935;background:rgba(229,57,53,.08);}

        .subsPausedRow{opacity:.5;}

        .subsCatDot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0;}
        .subsCatCell{display:flex;align-items:center;}

        /* Category breakdown */
        .subsBreakdown{background:var(--paper);border-radius:12px;border:1.5px solid var(--border);padding:20px 24px;}
        .subsBreakdownTitle{font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px;}
        .subsBarRow{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .subsBarLabel{font-size:12px;font-weight:600;color:var(--text);width:100px;flex-shrink:0;text-align:right;}
        .subsBarTrack{flex:1;height:22px;background:var(--bg);border-radius:6px;overflow:hidden;}
        .subsBarFill{height:100%;border-radius:6px;transition:width .3s ease;min-width:2px;}
        .subsBarAmount{font-size:12px;font-weight:600;color:var(--muted);width:70px;flex-shrink:0;}

        /* Sort row */
        .subsSortRow{display:flex;gap:4px;}

        /* Empty state */
        .subsEmpty{text-align:center;padding:60px 0;color:var(--muted);font-size:15px;}

        .subsMonthlyEquiv{font-size:11px;color:var(--muted);margin-top:1px;}
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Subscriptions</h1>
          <div className="weekBadge">{formatCurrency(monthlyTotal)}/mo</div>
        </div>
        <div className="nav">
          <div className="subsSortRow">
            {[["cost", "Cost"], ["name", "Name"], ["date", "Date"]].map(([key, label]) => (
              <button key={key} className={`tabBtn ${sortBy === key ? "active" : ""}`}
                onClick={() => setSortBy(key)} type="button">{label}</button>
            ))}
          </div>
          <button className="btn btnPrimary" onClick={addItem} type="button">+ Add</button>
        </div>
      </div>

      <div className="subsContent">
        {/* Summary cards */}
        <div className="subsSummary">
          <div className="subsSummaryCard">
            <div className="subsSummaryLabel">Monthly Total</div>
            <div className="subsSummaryValue subsSummaryValueAccent">{formatCurrency(monthlyTotal)}</div>
          </div>
          <div className="subsSummaryCard">
            <div className="subsSummaryLabel">Yearly Total</div>
            <div className="subsSummaryValue">{formatCurrency(yearlyTotal)}</div>
          </div>
          <div className="subsSummaryCard">
            <div className="subsSummaryLabel">Subscriptions</div>
            <div className="subsSummaryValue">{activeItems.length}</div>
          </div>
        </div>

        {/* Subscription table */}
        {items.length > 0 ? (
          <table className="subsTable">
            <thead>
              <tr>
                <th>Service</th>
                <th>Cost</th>
                <th>Cycle</th>
                <th>Category</th>
                <th>Next Billing</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(item => {
                const isPaused = item.active === false;
                const monthly = monthlyEquivalent(item.cost, item.cycle);
                return (
                  <tr key={item.id} className={`subsTableRow ${isPaused ? "subsPausedRow" : ""}`}>
                    <td>
                      <input className="subsInput" value={item.name || ""}
                        onChange={e => save(item.id, { ...item, name: e.target.value })}
                        placeholder="Service name" />
                    </td>
                    <td>
                      <input type="number" className="subsInput subsInputCost" value={item.cost ?? ""}
                        onChange={e => save(item.id, { ...item, cost: e.target.value === "" ? "" : Number(e.target.value) })}
                        placeholder="0.00" min="0" step="0.01" />
                      {item.cycle === "yearly" && item.cost > 0 && (
                        <div className="subsMonthlyEquiv">{formatCurrency(monthly)}/mo</div>
                      )}
                    </td>
                    <td>
                      <select className="subsSelect" value={item.cycle || "monthly"}
                        onChange={e => save(item.id, { ...item, cycle: e.target.value })}>
                        {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="subsCatCell">
                        <span className="subsCatDot" style={{ background: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other }} />
                        <select className="subsSelect" value={item.category || "Other"}
                          onChange={e => save(item.id, { ...item, category: e.target.value })}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>
                      <input type="date" className="subsDateInput" value={item.nextBilling || ""}
                        onChange={e => save(item.id, { ...item, nextBilling: e.target.value })} />
                    </td>
                    <td>
                      <button type="button" className={`subsToggle ${isPaused ? "subsTogglePaused" : "subsToggleActive"}`}
                        onClick={() => save(item.id, { ...item, active: !!isPaused })}
                        title={isPaused ? "Paused — click to activate" : "Active — click to pause"}>
                        <span className={`subsToggleDot ${isPaused ? "subsToggleDotPaused" : "subsToggleDotActive"}`} />
                      </button>
                    </td>
                    <td>
                      <button type="button" className="subsDeleteBtn" onClick={() => setConfirmDelete(item.id)}
                        title="Delete subscription">&#x2715;</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="subsEmpty">
            No subscriptions yet. Click <strong>+ Add</strong> to start tracking.
          </div>
        )}

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="subsBreakdown">
            <div className="subsBreakdownTitle">Spending by Category</div>
            {categoryBreakdown.map(([cat, amount]) => (
              <div className="subsBarRow" key={cat}>
                <div className="subsBarLabel">{cat}</div>
                <div className="subsBarTrack">
                  <div className="subsBarFill"
                    style={{
                      width: `${(amount / maxCategoryVal) * 100}%`,
                      background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other,
                    }} />
                </div>
                <div className="subsBarAmount">{formatCurrency(amount)}/mo</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Subscription"
        message="This will permanently remove this subscription. Continue?"
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && deleteItem(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
