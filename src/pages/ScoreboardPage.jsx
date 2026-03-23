import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";

const scoreboardApi = typeof window !== "undefined" ? window.scoreboardApi : null;

const AREAS = [
  "Health & Fitness",
  "Career & Work",
  "Finances",
  "Relationships",
  "Personal Growth",
  "Mental Health",
  "Spirituality",
  "Fun & Recreation",
];

const DEFAULT_SCORES = () => Object.fromEntries(AREAS.map(a => [a, 5]));

function radarPoint(index, score, cx, cy, radius) {
  const angle = (index / 8) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + (score / 10) * radius * Math.cos(angle),
    y: cy + (score / 10) * radius * Math.sin(angle),
  };
}

function RadarChart({ scores }) {
  const cx = 150, cy = 150, radius = 120;
  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <svg className="sbRadar" viewBox="0 0 300 300" width="300" height="300">
      {/* Grid */}
      {gridLevels.map((level, li) => (
        <polygon
          key={li}
          points={AREAS.map((_, i) => { const p = radarPoint(i, level, cx, cy, radius); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="var(--border)" strokeWidth="1" opacity={0.5}
        />
      ))}
      {/* Axes */}
      {AREAS.map((_, i) => {
        const p = radarPoint(i, 10, cx, cy, radius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" opacity={0.3} />;
      })}
      {/* Score polygon */}
      <polygon
        points={AREAS.map((area, i) => { const p = radarPoint(i, scores[area] || 0, cx, cy, radius); return `${p.x},${p.y}`; }).join(" ")}
        fill="var(--accent)" fillOpacity={0.25} stroke="var(--accent)" strokeWidth="2"
      />
      {/* Dots */}
      {AREAS.map((area, i) => {
        const p = radarPoint(i, scores[area] || 0, cx, cy, radius);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent)" />;
      })}
      {/* Labels */}
      {AREAS.map((area, i) => {
        const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (radius + 20) * Math.cos(angle);
        const ly = cy + (radius + 20) * Math.sin(angle);
        let anchor = "middle";
        if (lx < cx - 10) anchor = "end";
        else if (lx > cx + 10) anchor = "start";
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="9" fill="var(--muted)">
            {area}
          </text>
        );
      })}
    </svg>
  );
}

export default function ScoreboardPage() {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const wsStr = useMemo(() => ymd(weekStart), [weekStart]);

  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [prevScores, setPrevScores] = useState(null);
  const debounceRef = useRef(null);

  const weekLabel = useMemo(() => {
    const s = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const e = addDays(weekStart, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${s} — ${e}`;
  }, [weekStart]);

  useEffect(() => {
    if (!scoreboardApi) return;
    scoreboardApi.get(wsStr).then(data => {
      setScores(data?.scores || DEFAULT_SCORES());
    });
    scoreboardApi.get(ymd(addDays(weekStart, -7))).then(data => {
      setPrevScores(data?.scores || null);
    });
  }, [wsStr, weekStart]);

  const saveScores = useCallback(next => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (scoreboardApi) scoreboardApi.save(wsStr, { scores: next });
    }, 300);
  }, [wsStr]);

  const updateScore = useCallback((area, value) => {
    setScores(prev => {
      const next = { ...prev, [area]: value };
      saveScores(next);
      return next;
    });
  }, [saveScores]);

  const overall = useMemo(() => {
    const vals = AREAS.map(a => scores[a] || 0);
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }, [scores]);

  const goPrev = () => setWeekStart(d => addDays(d, -7));
  const goNext = () => setWeekStart(d => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(today));

  return (
    <div className="sbPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Personal Scoreboard</h1>
          <div className="weekBadge">{weekLabel}</div>
        </div>
        <div className="nav">
          <button className="btn" onClick={goPrev} aria-label="Previous week">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="btn" onClick={goNext} aria-label="Next week">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          <button className="btn btnPrimary" onClick={goToday}>This Week</button>
        </div>
      </div>

      <div className="sbContent">
        <div className="sbLeft">
          <div className="sbOverall">
            <div className="sbOverallValue">{overall}</div>
            <div className="sbOverallLabel">Overall Score / 10</div>
          </div>
          <div className="sbChart">
            <RadarChart scores={scores} />
          </div>
        </div>

        <div className="sbRight">
          <div className="sbSliders">
            {AREAS.map(area => {
              const val = scores[area] || 5;
              const prev = prevScores?.[area];
              const diff = prev != null ? val - prev : null;
              return (
                <div className="sbSliderRow" key={area}>
                  <div className="sbSliderLabel">{area}</div>
                  <input type="range" min="1" max="10" value={val} onChange={e => updateScore(area, Number(e.target.value))} />
                  <div className="sbSliderValue">{val}</div>
                  {diff != null && diff !== 0 && (
                    <div className={`sbTrend ${diff > 0 ? "sbTrendUp" : "sbTrendDown"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
