import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "sidehustles";

const STATUS_OPTIONS = ["Active", "Paused", "Idea"];
const STATUS_COLORS = {
  Active: "#4caf50",
  Paused: "#ff9800",
  Idea: "#607d8b",
};
const CATEGORY_OPTIONS = [
  "Freelance",
  "Content",
  "E-commerce",
  "Investing",
  "Service",
  "Other",
];

function genId() {
  return crypto.randomUUID();
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

function fmt$(n) {
  return "$" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function SideHustlesPage() {
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems((await api.list(COLLECTION)) || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback((id, data) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => {
      if (api) api.save(id, COLLECTION, data);
    }, 300);
  }, []);

  const addHustle = async () => {
    const id = genId();
    const now = monthKey(new Date());
    const data = {
      name: "",
      description: "",
      monthlyRevenue: 0,
      hoursPerWeek: 0,
      status: "Active",
      category: "Freelance",
      revenueHistory: { [now]: 0 },
      createdAt: new Date().toISOString(),
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setExpandedId(id);
  };

  const deleteHustle = async (id) => {
    if (api) await api.delete(id);
    if (expandedId === id) setExpandedId(null);
    setConfirmDelete(null);
    refresh();
  };

  const snapshotRevenue = useCallback(
    (id, item, revenue) => {
      const now = monthKey(new Date());
      const history = { ...(item.revenueHistory || {}), [now]: Number(revenue) };
      save(id, { ...item, monthlyRevenue: Number(revenue), revenueHistory: history });
    },
    [save]
  );

  // Summary calculations
  const activeItems = items.filter((i) => i.status === "Active");
  const totalMonthly = activeItems.reduce(
    (sum, i) => sum + Number(i.monthlyRevenue || 0),
    0
  );
  const totalHours = activeItems.reduce(
    (sum, i) => sum + Number(i.hoursPerWeek || 0),
    0
  );
  const incomePerHour = totalHours > 0 ? totalMonthly / (totalHours * 4.33) : 0;

  // Chart data
  const last6 = getLast6Months();
  const chartData = last6.map((mk) => {
    const total = items.reduce((sum, item) => {
      const hist = item.revenueHistory || {};
      return sum + Number(hist[mk] || 0);
    }, 0);
    return { month: mk, total };
  });
  const chartMax = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="shPage">
      <style>{`
        .shPage {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .shBody {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .shSummaryRow {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .shSummaryCard {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e0dcd4);
          border-radius: 10px;
          padding: 16px 20px;
          flex: 1;
          min-width: 160px;
        }
        .shSummaryLabel {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted, #b5a89a);
          margin-bottom: 4px;
        }
        .shSummaryValue {
          font-size: 24px;
          font-weight: 700;
          color: var(--text, #3a3226);
        }
        .shSummaryValue.shGreen {
          color: #4caf50;
        }
        .shChartSection {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e0dcd4);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .shChartTitle {
          font-size: 14px;
          font-weight: 600;
          color: var(--text, #3a3226);
          margin-bottom: 16px;
        }
        .shChart {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 140px;
        }
        .shBar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
        }
        .shBarFill {
          width: 100%;
          max-width: 48px;
          border-radius: 6px 6px 0 0;
          background: var(--accent, #5B7CF5);
          transition: height 0.3s;
          min-height: 2px;
        }
        .shBarLabel {
          font-size: 11px;
          color: var(--muted, #b5a89a);
          white-space: nowrap;
        }
        .shBarAmount {
          font-size: 11px;
          font-weight: 600;
          color: var(--text, #3a3226);
        }
        .shGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .shCard {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e0dcd4);
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .shCard:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }
        .shCardActive {
          box-shadow: 0 2px 16px rgba(91, 124, 245, 0.12);
          border-color: var(--accent, #5B7CF5);
        }
        .shCardTop {
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .shCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .shCardName {
          font-size: 16px;
          font-weight: 600;
          color: var(--text, #3a3226);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shCardName.shPlaceholder {
          color: var(--muted, #b5a89a);
          font-style: italic;
        }
        .shBadge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 12px;
          color: #fff;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .shCatBadge {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 8px;
          background: var(--bg, #f6f1e8);
          color: var(--muted, #b5a89a);
          flex-shrink: 0;
        }
        .shCardMeta {
          font-size: 13px;
          color: var(--muted, #b5a89a);
          line-height: 1.4;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .shCardRevenue {
          font-size: 20px;
          font-weight: 700;
          color: #4caf50;
          margin-top: 2px;
        }
        .shEditPanel {
          padding: 0 16px 16px;
          border-top: 1px solid var(--border, #e0dcd4);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 14px;
        }
        .shEditRow {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .shEditLabel {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted, #b5a89a);
        }
        .shEditInput, .shEditSelect, .shEditTextarea {
          font-size: 14px;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border, #e0dcd4);
          background: var(--bg, #f6f1e8);
          color: var(--text, #3a3226);
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .shEditInput:focus, .shEditSelect:focus, .shEditTextarea:focus {
          border-color: var(--accent, #5B7CF5);
        }
        .shEditTextarea {
          resize: vertical;
          min-height: 48px;
        }
        .shEditInline {
          display: flex;
          gap: 12px;
        }
        .shEditInline .shEditRow {
          flex: 1;
        }
        .shDeleteBtn {
          align-self: flex-start;
          color: #e53935 !important;
          border-color: #e53935 !important;
          margin-top: 4px;
          font-size: 12px;
        }
        .shDeleteBtn:hover {
          background: #fbe9e7 !important;
        }
        .shEmpty {
          grid-column: 1 / -1;
        }
        .shConfirmOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .shConfirmDialog {
          background: var(--paper, #fbf7f0);
          border-radius: 12px;
          padding: 24px;
          max-width: 360px;
          width: 90%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }
        .shConfirmTitle {
          font-size: 16px;
          font-weight: 600;
          color: var(--text, #3a3226);
          margin-bottom: 8px;
        }
        .shConfirmText {
          font-size: 14px;
          color: var(--muted, #b5a89a);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .shConfirmBtns {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .shConfirmCancel {
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 6px;
          border: 1px solid var(--border, #e0dcd4);
          background: transparent;
          color: var(--text, #3a3226);
          cursor: pointer;
          font-family: inherit;
        }
        .shConfirmDelete {
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 6px;
          border: none;
          background: #e53935;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
        }
        .shConfirmDelete:hover {
          background: #c62828;
        }
        .shIncomeBadge {
          font-size: 13px;
          font-weight: 600;
          color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
          padding: 3px 12px;
          border-radius: 12px;
          margin-left: 8px;
        }
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Side Hustles</h1>
          <span className="shIncomeBadge">{fmt$(totalMonthly)}/mo</span>
        </div>
        <div className="nav">
          <button
            className="btn btnPrimary"
            onClick={addHustle}
            type="button"
          >
            + Add Hustle
          </button>
        </div>
      </div>

      <div className="shBody">
        {/* Summary Cards */}
        <div className="shSummaryRow">
          <div className="shSummaryCard">
            <div className="shSummaryLabel">Monthly Income</div>
            <div className="shSummaryValue shGreen">{fmt$(totalMonthly)}</div>
          </div>
          <div className="shSummaryCard">
            <div className="shSummaryLabel">Hours / Week</div>
            <div className="shSummaryValue">{totalHours.toFixed(1)}</div>
          </div>
          <div className="shSummaryCard">
            <div className="shSummaryLabel">Income / Hour</div>
            <div className="shSummaryValue">{fmt$(Math.round(incomePerHour))}</div>
          </div>
          <div className="shSummaryCard">
            <div className="shSummaryLabel">Active Hustles</div>
            <div className="shSummaryValue">{activeItems.length}</div>
          </div>
        </div>

        {/* Revenue Chart */}
        {items.length > 0 && (
          <div className="shChartSection">
            <div className="shChartTitle">Monthly Revenue (Last 6 Months)</div>
            <div className="shChart">
              {chartData.map((d) => (
                <div className="shBar" key={d.month}>
                  <div className="shBarAmount">
                    {d.total > 0 ? fmt$(d.total) : ""}
                  </div>
                  <div
                    className="shBarFill"
                    style={{
                      height: `${Math.max((d.total / chartMax) * 100, 2)}%`,
                      opacity: d.total > 0 ? 1 : 0.2,
                    }}
                  />
                  <div className="shBarLabel">{monthLabel(d.month)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hustle Cards */}
        <div className="shGrid">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                className={`shCard ${isExpanded ? "shCardActive" : ""}`}
                key={item.id}
              >
                <div
                  className="shCardTop"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div className="shCardHeader">
                    <div
                      className={`shCardName ${!item.name ? "shPlaceholder" : ""}`}
                    >
                      {item.name || "New Hustle"}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="shCatBadge">
                        {item.category || "Other"}
                      </span>
                      <span
                        className="shBadge"
                        style={{
                          background:
                            STATUS_COLORS[item.status] || STATUS_COLORS.Active,
                        }}
                      >
                        {item.status || "Active"}
                      </span>
                    </div>
                  </div>
                  {item.description && (
                    <div className="shCardMeta">{item.description}</div>
                  )}
                  <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginTop: 4 }}>
                    <div className="shCardRevenue">
                      {fmt$(item.monthlyRevenue)}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>/mo</span>
                    </div>
                    {Number(item.hoursPerWeek) > 0 && (
                      <div className="shCardMeta">
                        {item.hoursPerWeek} hrs/wk
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="shEditPanel">
                    <div className="shEditRow">
                      <label className="shEditLabel">Name</label>
                      <input
                        className="shEditInput"
                        value={item.name || ""}
                        onChange={(e) =>
                          save(item.id, { ...item, name: e.target.value })
                        }
                        placeholder="Hustle name"
                      />
                    </div>
                    <div className="shEditRow">
                      <label className="shEditLabel">Description</label>
                      <textarea
                        className="shEditTextarea"
                        value={item.description || ""}
                        rows={2}
                        onChange={(e) =>
                          save(item.id, { ...item, description: e.target.value })
                        }
                        placeholder="What is this hustle about?"
                      />
                    </div>
                    <div className="shEditInline">
                      <div className="shEditRow">
                        <label className="shEditLabel">Monthly Revenue ($)</label>
                        <input
                          className="shEditInput"
                          type="number"
                          min="0"
                          step="1"
                          value={item.monthlyRevenue || 0}
                          onChange={(e) =>
                            snapshotRevenue(item.id, item, e.target.value)
                          }
                        />
                      </div>
                      <div className="shEditRow">
                        <label className="shEditLabel">Hours / Week</label>
                        <input
                          className="shEditInput"
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.hoursPerWeek || 0}
                          onChange={(e) =>
                            save(item.id, {
                              ...item,
                              hoursPerWeek: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="shEditInline">
                      <div className="shEditRow">
                        <label className="shEditLabel">Status</label>
                        <select
                          className="shEditSelect"
                          value={item.status || "Active"}
                          onChange={(e) =>
                            save(item.id, { ...item, status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="shEditRow">
                        <label className="shEditLabel">Category</label>
                        <select
                          className="shEditSelect"
                          value={item.category || "Other"}
                          onChange={(e) =>
                            save(item.id, { ...item, category: e.target.value })
                          }
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      className="btn shDeleteBtn"
                      onClick={() => setConfirmDelete(item.id)}
                      type="button"
                    >
                      Delete Hustle
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="shEmpty">
              <div
                style={{
                  fontSize: 15,
                  color: "var(--muted)",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                No side hustles yet. Click + Add Hustle to start tracking income.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div
          className="shConfirmOverlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="shConfirmDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shConfirmTitle">Delete Hustle?</div>
            <div className="shConfirmText">
              This will permanently remove this side hustle and its revenue
              history. This cannot be undone.
            </div>
            <div className="shConfirmBtns">
              <button
                className="shConfirmCancel"
                onClick={() => setConfirmDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="shConfirmDelete"
                onClick={() => deleteHustle(confirmDelete)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
