import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startOfWeekMonday, addDays, ymd, formatRange } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.lifeAreasApi : null;

const AREAS = [
  { key: "health", label: "Health & Fitness", color: "#4caf50" },
  { key: "career", label: "Career & Work", color: "#5B7CF5" },
  { key: "finance", label: "Finance", color: "#ff9800" },
  { key: "relationships", label: "Relationships", color: "#e91e63" },
  { key: "fun", label: "Fun & Recreation", color: "#9c27b0" },
  { key: "growth", label: "Personal Growth", color: "#00bcd4" },
  { key: "environment", label: "Environment", color: "#795548" },
  { key: "spirituality", label: "Spirituality", color: "#607d8b" },
];

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function BalanceWheel({ scores }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 120;
  const step = 360 / AREAS.length;

  const points = AREAS.map((area, i) => {
    const score = scores[area.key] || 0;
    const r = (score / 10) * maxR;
    const angle = i * step;
    return polarToXY(cx, cy, r, angle);
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} className="balanceWheel">
      {/* Grid circles */}
      {[2, 4, 6, 8, 10].map(n => (
        <circle key={n} cx={cx} cy={cy} r={(n / 10) * maxR}
          fill="none" stroke="var(--border)" strokeWidth={n === 10 ? 1.5 : 0.5} opacity={0.5} />
      ))}
      {/* Spokes */}
      {AREAS.map((area, i) => {
        const end = polarToXY(cx, cy, maxR, i * step);
        return <line key={area.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--border)" strokeWidth={0.5} opacity={0.4} />;
      })}
      {/* Filled polygon */}
      <path d={pathD} fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={2} />
      {/* Dots + labels */}
      {AREAS.map((area, i) => {
        const p = points[i];
        const labelP = polarToXY(cx, cy, maxR + 18, i * step);
        return (
          <g key={area.key}>
            <circle cx={p.x} cy={p.y} r={4} fill={area.color} />
            <text x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fill="var(--text)" opacity={0.7}>
              {area.label.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function LifeAreasPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const saveTimer = useRef(null);

  const weekKey = useMemo(() => ymd(weekStart), [weekStart]);

  const refresh = useCallback(async () => {
    if (!api) return;
    const log = await api.get(weekKey);
    setData(log || { scores: {}, reflections: {} });
    // Load last 12 weeks of history
    const start12 = ymd(addDays(weekStart, -84));
    const hist = await api.range(start12, weekKey);
    setHistory(hist || []);
  }, [weekKey, weekStart]);

  useEffect(() => { refresh(); }, [refresh]);

  const scores = data?.scores || {};
  const reflections = data?.reflections || {};

  const save = useCallback((updated) => {
    setData(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (api) api.save(weekKey, updated);
    }, 400);
  }, [weekKey]);

  const setScore = (key, val) => {
    const s = { ...scores, [key]: Number(val) || 0 };
    save({ ...data, scores: s });
  };

  const setReflection = (key, val) => {
    const r = { ...reflections, [key]: val };
    save({ ...data, reflections: r });
  };

  const avg = useMemo(() => {
    const vals = AREAS.map(a => scores[a.key] || 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    return vals.length ? (sum / vals.length).toFixed(1) : "0.0";
  }, [scores]);

  return (
    <div className="laPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Life Areas</h1>
          <div className="weekBadge">Balance Wheel</div>
        </div>
        <div className="nav">
          <button className="btn" onClick={() => setWeekStart(d => addDays(d, -7))} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="range">{formatRange(weekStart)}</div>
          <button className="btn" onClick={() => setWeekStart(d => addDays(d, 7))} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          <button className="btn btnPrimary" onClick={() => setWeekStart(startOfWeekMonday(new Date()))} type="button">This Week</button>
        </div>
      </div>

      <div className="laBody">
        <div className="laWheelSection">
          <BalanceWheel scores={scores} />
          <div className="laAvg">Average: <strong>{avg}</strong>/10</div>
        </div>

        <div className="laScores">
          {AREAS.map(area => (
            <div key={area.key} className="laScoreRow">
              <div className="laScoreHeader">
                <div className="laScoreColor" style={{ background: area.color }} />
                <div className="laScoreLabel">{area.label}</div>
                <div className="laScoreValue">{scores[area.key] || 0}/10</div>
              </div>
              <input type="range" min="0" max="10" step="1"
                className="laSlider"
                value={scores[area.key] || 0}
                onChange={e => setScore(area.key, e.target.value)}
                style={{ accentColor: area.color }}
              />
              <textarea
                className="laReflection"
                value={reflections[area.key] || ""}
                onChange={e => setReflection(area.key, e.target.value)}
                placeholder={`How is ${area.label.toLowerCase()} going?`}
                rows={1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
