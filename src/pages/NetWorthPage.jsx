import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const ASSET_CATEGORIES = ["Checking", "Savings", "Investments", "Retirement (401k/IRA)", "Property", "Crypto", "Other"];
const LIABILITY_CATEGORIES = ["Credit Cards", "Student Loans", "Mortgage", "Car Loan", "Other"];

const fmt = (n) => {
  const num = Number(n) || 0;
  const neg = num < 0;
  const abs = Math.abs(num);
  const str = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return neg ? `-$${str}` : `$${str}`;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function NetWorthPage() {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const saveTimer = useRef(null);

  /* ── Load ── */
  const refresh = useCallback(async () => {
    if (!api) { setLoading(false); return; }
    const all = await api.list("networth");
    const a = [];
    const l = [];
    (all || []).forEach((item) => {
      if (item.side === "asset") a.push(item);
      else if (item.side === "liability") l.push(item);
    });
    setAssets(a);
    setLiabilities(l);

    const snaps = await api.list("networth_snapshot");
    setSnapshots((snaps || []).sort((x, y) => (x.monthKey || "").localeCompare(y.monthKey || "")));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Debounced save ── */
  const debouncedSave = useCallback((id, data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (api) api.save(id, "networth", data);
    }, 300);
  }, []);

  /* ── Helpers ── */
  const updateAsset = useCallback((id, patch) => {
    setAssets((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const updated = { ...a, ...patch };
      debouncedSave(id, { name: updated.name, value: updated.value, category: updated.category, side: "asset" });
      return updated;
    }));
  }, [debouncedSave]);

  const updateLiability = useCallback((id, patch) => {
    setLiabilities((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l, ...patch };
      debouncedSave(id, { name: updated.name, value: updated.value, category: updated.category, side: "liability" });
      return updated;
    }));
  }, [debouncedSave]);

  const addAsset = useCallback(async () => {
    const id = genId();
    const data = { name: "", value: "", category: "Checking", side: "asset" };
    if (api) await api.save(id, "networth", data);
    await refresh();
  }, [refresh]);

  const addLiability = useCallback(async () => {
    const id = genId();
    const data = { name: "", value: "", category: "Credit Cards", side: "liability" };
    if (api) await api.save(id, "networth", data);
    await refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (id) => {
    if (api) await api.delete(id);
    setConfirmDelete(null);
    refresh();
  }, [refresh]);

  /* ── Totals ── */
  const totalAssets = useMemo(() => assets.reduce((s, a) => s + (Number(a.value) || 0), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + (Number(l.value) || 0), 0), [liabilities]);
  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  /* ── Snapshot ── */
  const saveSnapshot = useCallback(async () => {
    const key = getMonthKey(new Date());
    // Find existing snapshot for this month to overwrite
    const existing = snapshots.find((s) => s.monthKey === key);
    const id = existing ? existing.id : genId();
    const data = {
      monthKey: key,
      totalAssets,
      totalLiabilities,
      netWorth,
      savedAt: new Date().toISOString(),
    };
    if (api) await api.save(id, "networth_snapshot", data);
    refresh();
  }, [totalAssets, totalLiabilities, netWorth, snapshots, refresh]);

  /* ── Chart data (last 12) ── */
  const chartData = useMemo(() => {
    const last12 = snapshots.slice(-12);
    if (!last12.length) return [];
    const maxAbs = Math.max(...last12.map((s) => Math.abs(s.netWorth || 0)), 1);
    return last12.map((s) => {
      const [y, m] = (s.monthKey || "").split("-");
      return {
        label: `${MONTH_LABELS[Number(m) - 1] || "?"} ${y ? y.slice(2) : ""}`,
        value: s.netWorth || 0,
        pct: Math.abs(s.netWorth || 0) / maxAbs * 100,
      };
    });
  }, [snapshots]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="nwPage">
        <style>{styles}</style>
        <div className="topbar"><div className="topbarLeft"><h1 className="pageTitle">Net Worth</h1></div></div>
        <div className="nwContent" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
          <div style={{ color: "var(--muted)", fontSize: 15 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="nwPage">
      <style>{styles}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Net Worth</h1>
        </div>
        <div className="topbarRight">
          <span className={`nwHeroValue ${netWorth < 0 ? "nwNeg" : ""}`}>{fmt(netWorth)}</span>
        </div>
      </div>

      <div className="nwContent">
        {/* Summary Bar */}
        <div className="nwSummaryBar">
          <div className="nwSummaryItem">
            <span className="nwSummaryLabel">Total Assets</span>
            <span className="nwSummaryVal nwPositive">{fmt(totalAssets)}</span>
          </div>
          <span className="nwSummaryOp">&minus;</span>
          <div className="nwSummaryItem">
            <span className="nwSummaryLabel">Total Liabilities</span>
            <span className="nwSummaryVal nwNegative">{fmt(totalLiabilities)}</span>
          </div>
          <span className="nwSummaryOp">=</span>
          <div className="nwSummaryItem">
            <span className="nwSummaryLabel">Net Worth</span>
            <span className={`nwSummaryVal ${netWorth >= 0 ? "nwPositive" : "nwNegative"}`}>{fmt(netWorth)}</span>
          </div>
        </div>

        {/* Two Columns */}
        <div className="nwColumns">
          {/* Assets */}
          <div className="nwCard">
            <div className="nwCardHeader">
              <h2 className="nwCardTitle">Assets</h2>
              <span className="nwCardTotal nwPositive">{fmt(totalAssets)}</span>
            </div>
            <div className="nwList">
              {assets.map((a) => (
                <div className="nwRow" key={a.id}>
                  <input
                    className="nwNameInput"
                    value={a.name || ""}
                    placeholder="Account name"
                    onChange={(e) => updateAsset(a.id, { name: e.target.value })}
                  />
                  <select
                    className="nwCatSelect"
                    value={a.category || "Other"}
                    onChange={(e) => updateAsset(a.id, { category: e.target.value })}
                  >
                    {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="nwValWrap">
                    <span className="nwDollar">$</span>
                    <input
                      className="nwValInput"
                      type="number"
                      min="0"
                      step="0.01"
                      value={a.value ?? ""}
                      placeholder="0.00"
                      onChange={(e) => updateAsset(a.id, { value: e.target.value })}
                    />
                  </div>
                  <button className="nwDelBtn" title="Delete" onClick={() => setConfirmDelete(a.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="nwRowTotal">
              <span>Total</span>
              <span className="nwPositive">{fmt(totalAssets)}</span>
            </div>
            <button className="nwAddBtn" onClick={addAsset}>+ Add Asset</button>
          </div>

          {/* Liabilities */}
          <div className="nwCard">
            <div className="nwCardHeader">
              <h2 className="nwCardTitle">Liabilities</h2>
              <span className="nwCardTotal nwNegative">{fmt(totalLiabilities)}</span>
            </div>
            <div className="nwList">
              {liabilities.map((l) => (
                <div className="nwRow" key={l.id}>
                  <input
                    className="nwNameInput"
                    value={l.name || ""}
                    placeholder="Account name"
                    onChange={(e) => updateLiability(l.id, { name: e.target.value })}
                  />
                  <select
                    className="nwCatSelect"
                    value={l.category || "Other"}
                    onChange={(e) => updateLiability(l.id, { category: e.target.value })}
                  >
                    {LIABILITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="nwValWrap">
                    <span className="nwDollar">$</span>
                    <input
                      className="nwValInput"
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.value ?? ""}
                      placeholder="0.00"
                      onChange={(e) => updateLiability(l.id, { value: e.target.value })}
                    />
                  </div>
                  <button className="nwDelBtn" title="Delete" onClick={() => setConfirmDelete(l.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="nwRowTotal">
              <span>Total</span>
              <span className="nwNegative">{fmt(totalLiabilities)}</span>
            </div>
            <button className="nwAddBtn" onClick={addLiability}>+ Add Liability</button>
          </div>
        </div>

        {/* History Chart */}
        <div className="nwCard nwChartCard">
          <div className="nwCardHeader">
            <h2 className="nwCardTitle">Net Worth History</h2>
            <button className="nwSnapshotBtn" onClick={saveSnapshot}>Save Snapshot</button>
          </div>
          {chartData.length === 0 ? (
            <div className="nwChartEmpty">No snapshots yet. Click "Save Snapshot" to record this month.</div>
          ) : (
            <div className="nwChart">
              {chartData.map((d, i) => (
                <div className="nwBar" key={i} title={`${d.label}: ${fmt(d.value)}`}>
                  <div className="nwBarLabel">{fmt(d.value)}</div>
                  <div className="nwBarTrack">
                    <div
                      className={`nwBarFill ${d.value >= 0 ? "nwBarPos" : "nwBarNeg"}`}
                      style={{ height: `${Math.max(d.pct, 4)}%` }}
                    />
                  </div>
                  <div className="nwBarMonth">{d.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Account"
        message="This will permanently remove this account entry."
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && deleteItem(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

const styles = `
.nwPage {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.nwContent {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Summary Bar ── */
.nwSummaryBar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: var(--paper, #fbf7f0);
  border: 1px solid var(--border, #e5ddd0);
  border-radius: 12px;
  padding: 18px 28px;
}
.nwSummaryItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.nwSummaryLabel {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted, #998f7d);
}
.nwSummaryVal {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.nwSummaryOp {
  font-size: 22px;
  font-weight: 300;
  color: var(--muted, #998f7d);
  margin: 0 4px;
}
.nwPositive { color: #27ae60; }
.nwNegative { color: #e74c3c; }
.nwNeg { color: #e74c3c; }

/* ── Hero value in topbar ── */
.nwHeroValue {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text, #3d3527);
}

/* ── Columns ── */
.nwColumns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ── Card ── */
.nwCard {
  background: var(--paper, #fbf7f0);
  border: 1px solid var(--border, #e5ddd0);
  border-radius: 12px;
  padding: 18px 20px;
}
.nwCardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.nwCardTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text, #3d3527);
  margin: 0;
}
.nwCardTotal {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ── Row ── */
.nwList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nwRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border, #e5ddd0);
}
.nwNameInput {
  flex: 1;
  min-width: 0;
  border: 1px solid transparent;
  background: transparent;
  font-size: 14px;
  color: var(--text, #3d3527);
  padding: 5px 8px;
  border-radius: 6px;
  font-family: inherit;
  transition: border-color 0.15s;
}
.nwNameInput:focus {
  outline: none;
  border-color: #5B7CF5;
  background: var(--bg, #f6f1e8);
}
.nwCatSelect {
  width: 130px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text, #3d3527);
  background: var(--bg, #f6f1e8);
  border: 1px solid var(--border, #e5ddd0);
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
}
.nwCatSelect:focus {
  outline: none;
  border-color: #5B7CF5;
}
.nwValWrap {
  display: flex;
  align-items: center;
  background: var(--bg, #f6f1e8);
  border: 1px solid var(--border, #e5ddd0);
  border-radius: 6px;
  padding: 0 8px;
  width: 130px;
  transition: border-color 0.15s;
}
.nwValWrap:focus-within {
  border-color: #5B7CF5;
}
.nwDollar {
  font-size: 13px;
  color: var(--muted, #998f7d);
  margin-right: 2px;
}
.nwValInput {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: var(--text, #3d3527);
  padding: 5px 0;
  font-variant-numeric: tabular-nums;
}
.nwValInput:focus { outline: none; }
.nwValInput::-webkit-inner-spin-button,
.nwValInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.nwDelBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted, #998f7d);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.nwDelBtn:hover { color: #e74c3c; background: rgba(231,76,60,0.08); }

/* ── Row Total ── */
.nwRowTotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text, #3d3527);
  border-top: 2px solid var(--border, #e5ddd0);
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

/* ── Add Button ── */
.nwAddBtn {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  border: 1px dashed var(--border, #e5ddd0);
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-family: inherit;
  color: var(--muted, #998f7d);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.nwAddBtn:hover {
  color: #5B7CF5;
  border-color: #5B7CF5;
  background: rgba(91,124,245,0.04);
}

/* ── Chart ── */
.nwChartCard { margin-top: 0; }
.nwSnapshotBtn {
  padding: 6px 14px;
  font-size: 13px;
  font-family: inherit;
  font-weight: 600;
  color: #fff;
  background: #5B7CF5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.nwSnapshotBtn:hover { background: #4a6ae0; }
.nwChartEmpty {
  text-align: center;
  padding: 32px 16px;
  color: var(--muted, #998f7d);
  font-size: 14px;
}
.nwChart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 220px;
  padding-top: 10px;
}
.nwBar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}
.nwBarLabel {
  font-size: 10px;
  font-weight: 600;
  color: var(--text, #3d3527);
  margin-bottom: 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.nwBarTrack {
  flex: 1;
  width: 100%;
  max-width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 6px 6px 0 0;
  overflow: hidden;
  background: var(--bg, #f6f1e8);
}
.nwBarFill {
  width: 100%;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}
.nwBarPos { background: #27ae60; }
.nwBarNeg { background: #e74c3c; }
.nwBarMonth {
  font-size: 11px;
  color: var(--muted, #998f7d);
  margin-top: 6px;
  white-space: nowrap;
}
`;
