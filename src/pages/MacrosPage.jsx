import { useCallback, useEffect, useMemo, useState } from "react";
import { ymd, addDays } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.plannerApi : null;

const MACRO_COLORS = {
  calories: "#F59E0B",
  protein: "#EF4444",
  carbs: "#3B82F6",
  fat: "#8B5CF6",
};

const MACRO_LABELS = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};

const MACRO_UNITS = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
};

function extractNutrition(entry) {
  const n = entry?.nutrition;
  if (!n) return null;
  const cal = Number(n.calories) || 0;
  const pro = Number(n.protein) || 0;
  const carb = Number(n.carbs) || 0;
  const fatVal = Number(n.fat) || 0;
  if (cal === 0 && pro === 0 && carb === 0 && fatVal === 0) return null;
  return { calories: cal, protein: pro, carbs: carb, fat: fatVal };
}

export default function MacrosPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  const [allEntries, setAllEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week"); // "week" | "month"

  const load = useCallback(async () => {
    setLoading(true);
    if (api) {
      const entries = await api.getAll();
      setAllEntries(entries || {});
    } else {
      setAllEntries({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build an array of { date, ...macros } for the selected range
  const rangeDays = useMemo(() => {
    if (!allEntries) return [];
    const count = view === "week" ? 7 : 30;
    const days = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = ymd(addDays(today, -i));
      const n = extractNutrition(allEntries[d]);
      days.push({
        date: d,
        calories: n?.calories ?? 0,
        protein: n?.protein ?? 0,
        carbs: n?.carbs ?? 0,
        fat: n?.fat ?? 0,
        hasData: !!n,
      });
    }
    return days;
  }, [allEntries, today, view]);

  // Today's macros
  const todayMacros = useMemo(() => {
    if (!allEntries) return null;
    return extractNutrition(allEntries[todayStr]);
  }, [allEntries, todayStr]);

  // Averages for the range (only days with data)
  const averages = useMemo(() => {
    const withData = rangeDays.filter(d => d.hasData);
    if (withData.length === 0) return null;
    const sums = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const d of withData) {
      sums.calories += d.calories;
      sums.protein += d.protein;
      sums.carbs += d.carbs;
      sums.fat += d.fat;
    }
    const n = withData.length;
    return {
      calories: Math.round(sums.calories / n),
      protein: Math.round(sums.protein / n),
      carbs: Math.round(sums.carbs / n),
      fat: Math.round(sums.fat / n),
      daysWithData: n,
    };
  }, [rangeDays]);

  // Max calories for chart scaling
  const maxCal = useMemo(() => {
    if (rangeDays.length === 0) return 1;
    return Math.max(...rangeDays.map(d => d.calories), 1);
  }, [rangeDays]);

  // Macro ratio for donut (protein/carbs/fat by calories: P*4, C*4, F*9)
  const donutData = useMemo(() => {
    if (!averages || (averages.protein === 0 && averages.carbs === 0 && averages.fat === 0)) return null;
    const pCal = averages.protein * 4;
    const cCal = averages.carbs * 4;
    const fCal = averages.fat * 9;
    const total = pCal + cCal + fCal;
    if (total === 0) return null;
    return {
      protein: { pct: Math.round((pCal / total) * 100), cal: pCal },
      carbs: { pct: Math.round((cCal / total) * 100), cal: cCal },
      fat: { pct: Math.round((fCal / total) * 100), cal: fCal },
      total,
    };
  }, [averages]);

  // Recent days table (last 14 days with data, newest first)
  const recentDays = useMemo(() => {
    if (!allEntries) return [];
    const days = [];
    for (let i = 0; i < 60; i++) {
      const d = ymd(addDays(today, -i));
      const n = extractNutrition(allEntries[d]);
      if (n) {
        days.push({ date: d, ...n });
        if (days.length >= 14) break;
      }
    }
    return days;
  }, [allEntries, today]);

  // Format short date label for chart
  const shortDate = (dateStr) => {
    const [, m, d] = dateStr.split("-");
    return `${Number(m)}/${Number(d)}`;
  };

  // Donut CSS conic-gradient
  const donutGradient = useMemo(() => {
    if (!donutData) return "conic-gradient(#e5e7eb 0deg 360deg)";
    const pEnd = (donutData.protein.pct / 100) * 360;
    const cEnd = pEnd + (donutData.carbs.pct / 100) * 360;
    return `conic-gradient(
      ${MACRO_COLORS.protein} 0deg ${pEnd}deg,
      ${MACRO_COLORS.carbs} ${pEnd}deg ${cEnd}deg,
      ${MACRO_COLORS.fat} ${cEnd}deg 360deg
    )`;
  }, [donutData]);

  if (loading) {
    return (
      <div className="macrosPage">
        <div className="topbar"><div className="topbarLeft"><h1 className="pageTitle">Macros</h1></div></div>
        <div className="loadingMsg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="macrosPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Macros</h1>
        </div>
        <div className="nav">
          <button className={`tabBtn ${view === "week" ? "active" : ""}`} onClick={() => setView("week")} type="button">Week</button>
          <button className={`tabBtn ${view === "month" ? "active" : ""}`} onClick={() => setView("month")} type="button">Month</button>
        </div>
      </div>

      <div className="macrosContent">
        {/* Today's Summary Cards */}
        <div className="macrosSection">
          <h2 className="macrosSectionTitle">Today</h2>
          <div className="macrosSummary">
            {["calories", "protein", "carbs", "fat"].map(key => {
              const val = todayMacros ? todayMacros[key] : 0;
              return (
                <div className="macrosCard" key={key}>
                  <div className="macrosCardCircle" style={{
                    borderColor: MACRO_COLORS[key],
                    color: MACRO_COLORS[key],
                  }}>
                    <span className="macrosCardValue">{val}</span>
                    <span className="macrosCardUnit">{MACRO_UNITS[key]}</span>
                  </div>
                  <div className="macrosCardLabel">{MACRO_LABELS[key]}</div>
                </div>
              );
            })}
          </div>
          {!todayMacros && (
            <div className="macrosEmpty">No nutrition data logged for today.</div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="macrosSection">
          <h2 className="macrosSectionTitle">
            Daily Calories ({view === "week" ? "Last 7 Days" : "Last 30 Days"})
          </h2>
          <div className="macrosChart">
            <div className="macrosChartBars">
              {rangeDays.map(d => (
                <div className="macrosChartCol" key={d.date} style={{
                  flex: view === "month" ? "1 1 0" : undefined,
                  width: view === "week" ? `${100 / 7}%` : undefined,
                }}>
                  <div className="macrosChartBarWrap">
                    <div
                      className="macrosChartBar"
                      style={{
                        height: `${Math.max((d.calories / maxCal) * 100, d.hasData ? 2 : 0)}%`,
                        backgroundColor: d.date === todayStr ? MACRO_COLORS.calories : "#d4a853",
                        opacity: d.hasData ? 1 : 0.2,
                      }}
                      title={`${d.date}: ${d.calories} kcal`}
                    />
                  </div>
                  {(view === "week" || rangeDays.indexOf(d) % 5 === 0) && (
                    <div className="macrosChartLabel">{shortDate(d.date)}</div>
                  )}
                  {view === "week" && d.hasData && (
                    <div className="macrosChartVal">{d.calories}</div>
                  )}
                </div>
              ))}
            </div>
            {averages && (
              <div className="macrosChartAvgLine" style={{
                bottom: `${(averages.calories / maxCal) * 100}%`,
              }}>
                <span className="macrosChartAvgLabel">avg {averages.calories}</span>
              </div>
            )}
          </div>
        </div>

        {/* Averages + Donut row */}
        <div className="macrosRow">
          {/* Averages */}
          <div className="macrosSection macrosAvgSection">
            <h2 className="macrosSectionTitle">
              {view === "week" ? "Weekly" : "Monthly"} Averages
              {averages ? ` (${averages.daysWithData} day${averages.daysWithData !== 1 ? "s" : ""} tracked)` : ""}
            </h2>
            {averages ? (
              <div className="macrosAvgGrid">
                {["calories", "protein", "carbs", "fat"].map(key => (
                  <div className="macrosAvgItem" key={key}>
                    <div className="macrosAvgDot" style={{ backgroundColor: MACRO_COLORS[key] }} />
                    <div className="macrosAvgInfo">
                      <span className="macrosAvgVal">{averages[key]} {MACRO_UNITS[key]}</span>
                      <span className="macrosAvgLabel">{MACRO_LABELS[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="macrosEmpty">No data in this range.</div>
            )}
          </div>

          {/* Donut */}
          <div className="macrosSection macrosDonutSection">
            <h2 className="macrosSectionTitle">Macro Breakdown</h2>
            {donutData ? (
              <div className="macrosDonutWrap">
                <div className="macrosDonut" style={{ background: donutGradient }}>
                  <div className="macrosDonutHole">
                    <span className="macrosDonutTotal">{averages?.calories}</span>
                    <span className="macrosDonutTotalLabel">avg kcal</span>
                  </div>
                </div>
                <div className="macrosDonutLegend">
                  {["protein", "carbs", "fat"].map(key => (
                    <div className="macrosDonutLegendItem" key={key}>
                      <div className="macrosDonutLegendDot" style={{ backgroundColor: MACRO_COLORS[key] }} />
                      <span>{MACRO_LABELS[key]}: {donutData[key].pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="macrosEmpty">No macro data to display.</div>
            )}
          </div>
        </div>

        {/* Recent Days Table */}
        <div className="macrosSection">
          <h2 className="macrosSectionTitle">Recent Days</h2>
          {recentDays.length > 0 ? (
            <div className="macrosTableWrap">
              <table className="macrosTable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ color: MACRO_COLORS.calories }}>Calories</th>
                    <th style={{ color: MACRO_COLORS.protein }}>Protein</th>
                    <th style={{ color: MACRO_COLORS.carbs }}>Carbs</th>
                    <th style={{ color: MACRO_COLORS.fat }}>Fat</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDays.map(d => (
                    <tr key={d.date}>
                      <td className="macrosTableDate">{d.date}</td>
                      <td>{d.calories} kcal</td>
                      <td>{d.protein}g</td>
                      <td>{d.carbs}g</td>
                      <td>{d.fat}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="macrosEmpty">No nutrition data logged yet.</div>
          )}
        </div>
      </div>

      <style>{`
        .macrosPage {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .macrosTopbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 28px 12px;
          border-bottom: 1px solid #e8e0d4;
          flex-shrink: 0;
        }
        .macrosTitle {
          font-size: 22px;
          font-weight: 700;
          color: #3d3529;
          margin: 0;
        }
        .macrosToggle {
          display: flex;
          gap: 0;
          background: #ece6da;
          border-radius: 8px;
          overflow: hidden;
        }
        .macrosToggleBtn {
          padding: 6px 16px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #8c7e6a;
          cursor: pointer;
          transition: all 0.15s;
        }
        .macrosToggleBtn.active {
          background: #5B7CF5;
          color: #fff;
        }
        .macrosContent {
          flex: 1;
          overflow-y: auto;
          padding: 20px 28px 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .macrosLoading {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          font-size: 15px;
          color: #8c7e6a;
        }
        .macrosSection {
          background: #fbf7f0;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e8e0d4;
        }
        .macrosSectionTitle {
          font-size: 14px;
          font-weight: 700;
          color: #5a4e3e;
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .macrosEmpty {
          font-size: 13px;
          color: #a89a86;
          text-align: center;
          padding: 8px 0;
        }

        /* Summary Cards */
        .macrosSummary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .macrosCard {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .macrosCardCircle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 4px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
        }
        .macrosCardValue {
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
        }
        .macrosCardUnit {
          font-size: 11px;
          font-weight: 500;
          opacity: 0.7;
        }
        .macrosCardLabel {
          font-size: 13px;
          font-weight: 600;
          color: #5a4e3e;
        }

        /* Bar Chart */
        .macrosChart {
          position: relative;
          background: #fff;
          border-radius: 8px;
          padding: 16px 12px 8px;
          border: 1px solid #ece6da;
        }
        .macrosChartBars {
          display: flex;
          align-items: flex-end;
          height: 180px;
          gap: 2px;
        }
        .macrosChartCol {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        .macrosChartBarWrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 150px;
        }
        .macrosChartBar {
          width: 70%;
          max-width: 36px;
          min-width: 4px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s;
        }
        .macrosChartLabel {
          font-size: 10px;
          color: #8c7e6a;
          margin-top: 4px;
          white-space: nowrap;
        }
        .macrosChartVal {
          font-size: 10px;
          font-weight: 600;
          color: #5a4e3e;
          margin-top: 1px;
        }
        .macrosChartAvgLine {
          position: absolute;
          left: 12px;
          right: 12px;
          border-top: 2px dashed rgba(91, 124, 245, 0.4);
          pointer-events: none;
        }
        .macrosChartAvgLabel {
          position: absolute;
          right: 0;
          top: -16px;
          font-size: 10px;
          font-weight: 600;
          color: #5B7CF5;
        }

        /* Row: Averages + Donut */
        .macrosRow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .macrosAvgGrid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .macrosAvgItem {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .macrosAvgDot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .macrosAvgInfo {
          display: flex;
          flex-direction: column;
        }
        .macrosAvgVal {
          font-size: 16px;
          font-weight: 700;
          color: #3d3529;
        }
        .macrosAvgLabel {
          font-size: 12px;
          color: #8c7e6a;
        }

        /* Donut */
        .macrosDonutWrap {
          display: flex;
          align-items: center;
          gap: 24px;
          justify-content: center;
        }
        .macrosDonut {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .macrosDonutHole {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fbf7f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .macrosDonutTotal {
          font-size: 18px;
          font-weight: 700;
          color: #3d3529;
        }
        .macrosDonutTotalLabel {
          font-size: 10px;
          color: #8c7e6a;
        }
        .macrosDonutLegend {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .macrosDonutLegendItem {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5a4e3e;
        }
        .macrosDonutLegendDot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Table */
        .macrosTableWrap {
          overflow-x: auto;
        }
        .macrosTable {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .macrosTable th {
          text-align: left;
          padding: 8px 12px;
          font-weight: 600;
          font-size: 12px;
          border-bottom: 2px solid #e8e0d4;
          white-space: nowrap;
        }
        .macrosTable td {
          padding: 8px 12px;
          border-bottom: 1px solid #ece6da;
          color: #3d3529;
        }
        .macrosTableDate {
          font-weight: 600;
          color: #5a4e3e;
        }
        .macrosTable tbody tr:hover {
          background: #f6f1e8;
        }
      `}</style>
    </div>
  );
}
