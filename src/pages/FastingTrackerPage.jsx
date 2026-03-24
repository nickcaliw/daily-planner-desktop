import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ymd, addDays } from "../lib/dates.js";

const api = typeof window !== "undefined" ? window.settingsApi : null;

const FAST_TYPES = [
  { label: "16:8", fastHours: 16, eatHours: 8 },
  { label: "18:6", fastHours: 18, eatHours: 6 },
  { label: "20:4", fastHours: 20, eatHours: 4 },
  { label: "24hr", fastHours: 24, eatHours: 0 },
  { label: "Custom", fastHours: 16, eatHours: 8 },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatHM(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatTimeOfDay(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getMonday(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

export default function FastingTrackerPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymd(today), [today]);

  // Active fast state
  const [activeFast, setActiveFast] = useState(null); // { startTime, fastTypeIdx, customHours }
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  // Fast type selection
  const [fastTypeIdx, setFastTypeIdx] = useState(0);
  const [customHours, setCustomHours] = useState(16);

  // History
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedType = FAST_TYPES[fastTypeIdx];
  const targetSeconds = useMemo(() => {
    if (activeFast) {
      const idx = activeFast.fastTypeIdx;
      const hrs = idx === 4 ? activeFast.customHours : FAST_TYPES[idx].fastHours;
      return hrs * 3600;
    }
    return (fastTypeIdx === 4 ? customHours : selectedType.fastHours) * 3600;
  }, [activeFast, fastTypeIdx, customHours, selectedType]);

  const progressPct = useMemo(() => {
    if (targetSeconds === 0) return 0;
    return Math.min(100, (elapsed / targetSeconds) * 100);
  }, [elapsed, targetSeconds]);

  // Load active fast from storage
  useEffect(() => {
    if (!api) { setLoading(false); return; }
    api.get("fast_active").then(val => {
      if (val) {
        try {
          const data = JSON.parse(val);
          setActiveFast(data);
          setFastTypeIdx(data.fastTypeIdx ?? 0);
          if (data.customHours) setCustomHours(data.customHours);
        } catch { /* ignore */ }
      }
      setLoading(false);
    });
  }, []);

  // Timer tick
  useEffect(() => {
    if (activeFast) {
      const tick = () => {
        const now = Date.now();
        const startMs = new Date(activeFast.startTime).getTime();
        setElapsed(Math.floor((now - startMs) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [activeFast]);

  // Load week + month history
  const loadHistory = useCallback(async () => {
    if (!api) return;
    const monday = getMonday(today);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = ymd(addDays(monday, i));
      const raw = await api.get(`fast_${d}`);
      if (raw) {
        try { week.push({ date: d, ...JSON.parse(raw) }); } catch { week.push({ date: d }); }
      } else {
        week.push({ date: d });
      }
    }
    setWeekData(week);

    const month = [];
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < 31; i++) {
      const d = addDays(firstOfMonth, i);
      if (d.getMonth() !== today.getMonth()) break;
      const dStr = ymd(d);
      const raw = await api.get(`fast_${dStr}`);
      if (raw) {
        try { month.push({ date: dStr, ...JSON.parse(raw) }); } catch { /* skip */ }
      }
    }
    setMonthData(month);
  }, [today]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Start fast
  const startFast = useCallback(async () => {
    const data = {
      startTime: new Date().toISOString(),
      fastTypeIdx,
      customHours: fastTypeIdx === 4 ? customHours : undefined,
    };
    setActiveFast(data);
    if (api) await api.set("fast_active", JSON.stringify(data));
  }, [fastTypeIdx, customHours]);

  // Stop / complete fast
  const stopFast = useCallback(async () => {
    if (!activeFast) return;
    const startMs = new Date(activeFast.startTime).getTime();
    const durationSec = Math.floor((Date.now() - startMs) / 1000);
    const idx = activeFast.fastTypeIdx;
    const targetHrs = idx === 4 ? (activeFast.customHours || 16) : FAST_TYPES[idx].fastHours;
    const targetSec = targetHrs * 3600;
    const completed = durationSec >= targetSec;
    const dateKey = ymd(new Date(activeFast.startTime));

    const record = {
      startTime: activeFast.startTime,
      endTime: new Date().toISOString(),
      durationSec,
      targetHrs,
      type: FAST_TYPES[idx].label,
      completed,
    };

    if (api) {
      await api.set(`fast_${dateKey}`, JSON.stringify(record));
      await api.set("fast_active", "");
    }
    setActiveFast(null);
    setElapsed(0);
    loadHistory();
  }, [activeFast, loadHistory]);

  // Computed stats
  const stats = useMemo(() => {
    const completedFasts = monthData.filter(d => d.durationSec);
    const totalFasts = completedFasts.length;
    const avgDuration = totalFasts > 0
      ? completedFasts.reduce((sum, d) => sum + (d.durationSec || 0), 0) / totalFasts
      : 0;
    const longestFast = completedFasts.reduce((max, d) => Math.max(max, d.durationSec || 0), 0);

    // Streak: consecutive days with completed fasts going backward from today
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = ymd(addDays(today, -i));
      const entry = monthData.find(e => e.date === d) || weekData.find(e => e.date === d);
      if (entry && entry.completed) streak++;
      else if (i === 0 && activeFast) streak++; // count today if active
      else break;
    }

    return { avgDuration, longestFast, totalFasts, streak };
  }, [monthData, weekData, today, activeFast]);

  // Time calculations for active fast display
  const startDate = activeFast ? new Date(activeFast.startTime) : null;
  const targetEndDate = startDate ? new Date(startDate.getTime() + targetSeconds * 1000) : null;
  const remaining = Math.max(0, targetSeconds - elapsed);

  // SVG circle timer
  const circleRadius = 90;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleDashoffset = circleCircumference - (progressPct / 100) * circleCircumference;

  return (
    <div className="fastPage">
      <style>{`
        .fastPage {
          height: 100vh;
          overflow-y: auto;
          background: var(--bg, #f6f1e8);
        }
        .fastContent {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Timer Section */
        .fastTimerSection {
          background: var(--paper, #fbf7f0);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .fastTimerCircle {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 0 auto 20px;
        }
        .fastTimerCircle svg {
          transform: rotate(-90deg);
          width: 220px;
          height: 220px;
        }
        .fastTimerCircle .fastTimerBg {
          fill: none;
          stroke: #e8e0d4;
          stroke-width: 10;
        }
        .fastTimerCircle .fastTimerProgress {
          fill: none;
          stroke: #5B7CF5;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }
        .fastTimerCircle .fastTimerProgressDone {
          stroke: #4CAF50;
        }
        .fastTimerInner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .fastTimerTime {
          font-size: 32px;
          font-weight: 700;
          color: #3a3226;
          font-variant-numeric: tabular-nums;
          letter-spacing: 1px;
        }
        .fastTimerLabel {
          font-size: 12px;
          color: #8a7e6b;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fastTimerPct {
          font-size: 14px;
          color: #5B7CF5;
          font-weight: 600;
          margin-top: 4px;
        }

        /* Type selector */
        .fastTypeSelector {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .fastTypeBtn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1.5px solid #d6cbb8;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #5c5040;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fastTypeBtn:hover {
          border-color: #5B7CF5;
          color: #5B7CF5;
        }
        .fastTypeBtnActive {
          background: #5B7CF5;
          color: #fff;
          border-color: #5B7CF5;
        }
        .fastCustomInput {
          width: 60px;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1.5px solid #d6cbb8;
          font-size: 13px;
          text-align: center;
          background: #fff;
          margin-left: 4px;
        }
        .fastCustomInput:focus {
          outline: none;
          border-color: #5B7CF5;
        }
        .fastCustomLabel {
          font-size: 12px;
          color: #8a7e6b;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Buttons */
        .fastBtnRow {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
        }
        .fastStartBtn {
          padding: 12px 36px;
          border-radius: 24px;
          border: none;
          background: #5B7CF5;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fastStartBtn:hover {
          background: #4a6be4;
          transform: translateY(-1px);
        }
        .fastStopBtn {
          padding: 12px 36px;
          border-radius: 24px;
          border: none;
          background: #e74c3c;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fastStopBtn:hover {
          background: #c0392b;
          transform: translateY(-1px);
        }

        /* Windows */
        .fastWindows {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 16px;
        }
        .fastWindow {
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 13px;
          text-align: center;
        }
        .fastWindowFasting {
          background: rgba(91,124,245,0.1);
          color: #5B7CF5;
        }
        .fastWindowEating {
          background: rgba(76,175,80,0.1);
          color: #4CAF50;
        }
        .fastWindowHrs {
          font-size: 22px;
          font-weight: 700;
          display: block;
        }
        .fastWindowLabel {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        /* Status section */
        .fastStatusSection {
          background: var(--paper, #fbf7f0);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .fastStatusTitle {
          font-size: 15px;
          font-weight: 600;
          color: #3a3226;
          margin-bottom: 16px;
        }
        .fastStatusGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .fastStatusItem {
          text-align: center;
        }
        .fastStatusValue {
          font-size: 16px;
          font-weight: 700;
          color: #3a3226;
        }
        .fastStatusLabel {
          font-size: 11px;
          color: #8a7e6b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* Weekly history */
        .fastWeekSection {
          background: var(--paper, #fbf7f0);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .fastWeekTitle {
          font-size: 15px;
          font-weight: 600;
          color: #3a3226;
          margin-bottom: 16px;
        }
        .fastWeekBars {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          align-items: end;
        }
        .fastWeekDay {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .fastWeekBarWrap {
          width: 100%;
          height: 80px;
          background: #ece6da;
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }
        .fastWeekBar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 6px;
          transition: height 0.3s ease;
        }
        .fastWeekBarGreen {
          background: #4CAF50;
        }
        .fastWeekBarYellow {
          background: #FFC107;
        }
        .fastWeekBarGray {
          background: #c4baa8;
        }
        .fastWeekLabel {
          font-size: 11px;
          color: #8a7e6b;
          font-weight: 500;
        }
        .fastWeekHrs {
          font-size: 10px;
          color: #5c5040;
          font-weight: 600;
        }

        /* Stats */
        .fastStatsSection {
          background: var(--paper, #fbf7f0);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .fastStatsTitle {
          font-size: 15px;
          font-weight: 600;
          color: #3a3226;
          margin-bottom: 16px;
        }
        .fastStatsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 16px;
        }
        .fastStatCard {
          text-align: center;
          padding: 16px 8px;
          background: rgba(91,124,245,0.05);
          border-radius: 12px;
        }
        .fastStatValue {
          font-size: 22px;
          font-weight: 700;
          color: #5B7CF5;
        }
        .fastStatLabel {
          font-size: 11px;
          color: #8a7e6b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .fastIdleMsg {
          color: #8a7e6b;
          font-size: 14px;
          margin-top: 8px;
        }
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Fasting Tracker</h1>
        </div>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading...</div>
      ) : (
        <div className="fastContent">
          {/* Timer Section */}
          <div className="fastTimerSection">
            {/* Fast type selector */}
            {!activeFast && (
              <div className="fastTypeSelector">
                {FAST_TYPES.map((t, i) => (
                  <button
                    key={t.label}
                    className={`fastTypeBtn ${fastTypeIdx === i ? "fastTypeBtnActive" : ""}`}
                    onClick={() => setFastTypeIdx(i)}
                  >
                    {t.label}
                  </button>
                ))}
                {fastTypeIdx === 4 && (
                  <span className="fastCustomLabel">
                    <input
                      type="number"
                      className="fastCustomInput"
                      value={customHours}
                      min={1}
                      max={48}
                      onChange={e => setCustomHours(Math.max(1, Math.min(48, Number(e.target.value) || 1)))}
                    />
                    hrs
                  </span>
                )}
              </div>
            )}

            {/* Circular timer */}
            <div className="fastTimerCircle">
              <svg viewBox="0 0 220 220">
                <circle className="fastTimerBg" cx="110" cy="110" r={circleRadius} />
                <circle
                  className={`fastTimerProgress ${progressPct >= 100 ? "fastTimerProgressDone" : ""}`}
                  cx="110"
                  cy="110"
                  r={circleRadius}
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={activeFast ? circleDashoffset : circleCircumference}
                />
              </svg>
              <div className="fastTimerInner">
                {activeFast ? (
                  <>
                    <div className="fastTimerTime">{formatHM(elapsed)}</div>
                    <div className="fastTimerLabel">elapsed</div>
                    <div className="fastTimerPct">{Math.round(progressPct)}%</div>
                  </>
                ) : (
                  <>
                    <div className="fastTimerTime">
                      {pad(fastTypeIdx === 4 ? customHours : selectedType.fastHours)}:00:00
                    </div>
                    <div className="fastTimerLabel">target</div>
                  </>
                )}
              </div>
            </div>

            {/* Windows display */}
            <div className="fastWindows">
              <div className="fastWindow fastWindowFasting">
                <span className="fastWindowHrs">
                  {activeFast
                    ? (FAST_TYPES[activeFast.fastTypeIdx]?.label === "Custom"
                        ? activeFast.customHours
                        : FAST_TYPES[activeFast.fastTypeIdx]?.fastHours)
                    : (fastTypeIdx === 4 ? customHours : selectedType.fastHours)}
                </span>
                <span className="fastWindowLabel">Fasting window (hrs)</span>
              </div>
              <div className="fastWindow fastWindowEating">
                <span className="fastWindowHrs">
                  {activeFast
                    ? (FAST_TYPES[activeFast.fastTypeIdx]?.label === "Custom"
                        ? Math.max(0, 24 - (activeFast.customHours || 16))
                        : FAST_TYPES[activeFast.fastTypeIdx]?.eatHours)
                    : (fastTypeIdx === 4 ? Math.max(0, 24 - customHours) : selectedType.eatHours)}
                </span>
                <span className="fastWindowLabel">Eating window (hrs)</span>
              </div>
            </div>

            {/* Start/Stop buttons */}
            <div className="fastBtnRow">
              {activeFast ? (
                <button className="fastStopBtn" onClick={stopFast}>
                  Stop Fast
                </button>
              ) : (
                <button className="fastStartBtn" onClick={startFast}>
                  Start Fast
                </button>
              )}
            </div>

            {!activeFast && (
              <div className="fastIdleMsg">Select a fasting type and press Start</div>
            )}
          </div>

          {/* Today's Status */}
          {activeFast && (
            <div className="fastStatusSection">
              <div className="fastStatusTitle">Today's Status</div>
              <div className="fastStatusGrid">
                <div className="fastStatusItem">
                  <div className="fastStatusValue">
                    {startDate ? formatTimeOfDay(startDate) : "--"}
                  </div>
                  <div className="fastStatusLabel">Start Time</div>
                </div>
                <div className="fastStatusItem">
                  <div className="fastStatusValue">
                    {targetEndDate ? formatTimeOfDay(targetEndDate) : "--"}
                  </div>
                  <div className="fastStatusLabel">Target End</div>
                </div>
                <div className="fastStatusItem">
                  <div className="fastStatusValue">
                    {remaining > 0 ? formatHM(remaining) : "Done!"}
                  </div>
                  <div className="fastStatusLabel">Remaining</div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly History */}
          <div className="fastWeekSection">
            <div className="fastWeekTitle">This Week</div>
            <div className="fastWeekBars">
              {weekData.map((day, i) => {
                const hasFast = !!day.durationSec;
                const durationHrs = hasFast ? day.durationSec / 3600 : 0;
                const targetHrs = day.targetHrs || 16;
                const pct = hasFast ? Math.min(100, (durationHrs / targetHrs) * 100) : 0;
                const isCompleted = day.completed;
                const barClass = !hasFast
                  ? "fastWeekBarGray"
                  : isCompleted
                    ? "fastWeekBarGreen"
                    : "fastWeekBarYellow";

                return (
                  <div className="fastWeekDay" key={day.date || i}>
                    <div className="fastWeekHrs">
                      {hasFast ? `${durationHrs.toFixed(1)}h` : ""}
                    </div>
                    <div className="fastWeekBarWrap">
                      <div
                        className={`fastWeekBar ${barClass}`}
                        style={{ height: `${hasFast ? Math.max(8, pct) : 8}%` }}
                      />
                    </div>
                    <div className="fastWeekLabel">{DAY_LABELS[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="fastStatsSection">
            <div className="fastStatsTitle">Monthly Stats</div>
            <div className="fastStatsGrid">
              <div className="fastStatCard">
                <div className="fastStatValue">
                  {stats.avgDuration > 0
                    ? `${(stats.avgDuration / 3600).toFixed(1)}h`
                    : "--"}
                </div>
                <div className="fastStatLabel">Avg Duration</div>
              </div>
              <div className="fastStatCard">
                <div className="fastStatValue">
                  {stats.longestFast > 0
                    ? `${(stats.longestFast / 3600).toFixed(1)}h`
                    : "--"}
                </div>
                <div className="fastStatLabel">Longest Fast</div>
              </div>
              <div className="fastStatCard">
                <div className="fastStatValue">{stats.totalFasts}</div>
                <div className="fastStatLabel">Total Fasts</div>
              </div>
              <div className="fastStatCard">
                <div className="fastStatValue">
                  {stats.streak > 0 ? `${stats.streak}d` : "--"}
                </div>
                <div className="fastStatLabel">Streak</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
