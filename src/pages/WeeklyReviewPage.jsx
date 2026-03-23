import { useCallback, useEffect, useMemo, useState } from "react";
import { ymd, startOfWeekMonday, addDays } from "../lib/dates.js";
import { HABITS } from "../lib/constants.js";
import { useHabits } from "../hooks/useHabits.js";

const plannerApi = typeof window !== "undefined" ? window.plannerApi : null;
const workoutApi = typeof window !== "undefined" ? window.workoutApi : null;
const reviewApi = typeof window !== "undefined" ? window.reviewApi : null;
const focusApi = typeof window !== "undefined" ? window.focusApi : null;
const sleepApi = typeof window !== "undefined" ? window.sleepApi : null;
const waterApi = typeof window !== "undefined" ? window.waterApi : null;
const meditationApi = typeof window !== "undefined" ? window.meditationApi : null;
const journalApi = typeof window !== "undefined" ? window.journalApi : null;
const goalsApi = typeof window !== "undefined" ? window.goalsApi : null;

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyReviewPage() {
  const { habits: HABITS_LIST } = useHabits();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const wsStr = useMemo(() => ymd(weekStart), [weekStart]);
  const endStr = useMemo(() => ymd(addDays(weekStart, 6)), [weekStart]);

  const [review, setReview] = useState(null);
  const [weekData, setWeekData] = useState({});
  const [workoutData, setWorkoutData] = useState({});
  const [focusData, setFocusData] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [waterData, setWaterData] = useState([]);
  const [medData, setMedData] = useState([]);
  const [journalData, setJournalData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("report");

  const load = useCallback(async () => {
    setLoading(true);
    const promises = [];

    if (reviewApi) promises.push(reviewApi.get(wsStr).then(r => setReview(r || { wins: "", challenges: "", lessons: "", nextWeek: "", rating: 0 })));
    if (plannerApi) promises.push(plannerApi.getRange(wsStr, endStr).then(r => setWeekData(r || {})));
    if (workoutApi) promises.push(workoutApi.getRange(wsStr, endStr).then(r => setWorkoutData(r || {})));
    if (focusApi) promises.push(focusApi.getRange(wsStr, endStr).then(r => setFocusData(r || [])));
    if (sleepApi) promises.push(sleepApi.range(wsStr, endStr).then(r => setSleepData(r || [])));
    if (waterApi) promises.push(waterApi.range(wsStr, endStr).then(r => setWaterData(r || [])));
    if (meditationApi) promises.push(meditationApi.range(wsStr, endStr).then(r => setMedData(r || [])));
    if (journalApi) promises.push(journalApi.list().then(r => setJournalData((r || []).filter(j => j.date >= wsStr && j.date <= endStr))));
    if (goalsApi) promises.push(goalsApi.list().then(r => setGoalsData(r || [])));

    await Promise.allSettled(promises);
    setLoading(false);
  }, [wsStr, endStr]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback((patch) => {
    setReview(prev => {
      const next = { ...prev, ...patch };
      if (reviewApi) reviewApi.save(wsStr, next);
      return next;
    });
  }, [wsStr]);

  // ── Computed stats ──
  const stats = useMemo(() => {
    const entryKeys = Object.keys(weekData);
    const daysLogged = entryKeys.length;

    // Habits
    let habitTotal = 0, habitDone = 0;
    const habitBreakdown = {};
    for (const h of HABITS_LIST) habitBreakdown[h] = { done: 0, total: 0 };
    for (const key of entryKeys) {
      const e = weekData[key];
      if (e?.habits) {
        for (const h of HABITS_LIST) {
          habitTotal++;
          habitBreakdown[h].total++;
          if (e.habits[h]) { habitDone++; habitBreakdown[h].done++; }
        }
      }
    }
    const habitPct = habitTotal ? Math.round((habitDone / habitTotal) * 100) : 0;

    // Ratings
    let ratingSum = 0, ratingCount = 0;
    const dailyRatings = [];
    for (let i = 0; i < 7; i++) {
      const k = ymd(addDays(weekStart, i));
      const r = weekData[k]?.rating;
      dailyRatings.push(r || 0);
      if (r && r > 0) { ratingSum += r; ratingCount++; }
    }
    const avgRating = ratingCount ? (ratingSum / ratingCount).toFixed(1) : "—";

    // Nutrition
    let nutCount = 0;
    let nutTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const key of entryKeys) {
      const n = weekData[key]?.nutrition;
      if (n && (n.calories || n.protein || n.carbs || n.fat)) {
        nutCount++;
        nutTotals.calories += Number(n.calories) || 0;
        nutTotals.protein += Number(n.protein) || 0;
        nutTotals.carbs += Number(n.carbs) || 0;
        nutTotals.fat += Number(n.fat) || 0;
      }
    }
    const nutAvg = nutCount ? {
      calories: Math.round(nutTotals.calories / nutCount),
      protein: Math.round(nutTotals.protein / nutCount),
      carbs: Math.round(nutTotals.carbs / nutCount),
      fat: Math.round(nutTotals.fat / nutCount),
    } : null;

    // Workouts
    const workoutDays = Object.keys(workoutData).filter(k => workoutData[k]?.completed).length;

    // Focus
    const totalFocusMin = focusData.reduce((sum, s) => sum + (s.duration || 0), 0);
    const focusHours = (totalFocusMin / 60).toFixed(1);
    const focusSessions = focusData.length;

    // Sleep
    let sleepTotal = 0;
    for (const s of sleepData) sleepTotal += s.hours || 0;
    const avgSleep = sleepData.length ? (sleepTotal / sleepData.length).toFixed(1) : "—";

    // Water
    let waterGoalMet = 0;
    for (const w of waterData) {
      if ((w.glasses || 0) >= (w.goal || 8)) waterGoalMet++;
    }

    // Meditation
    const medMinutes = medData.reduce((sum, m) => sum + (m.minutes || 0), 0);
    const medSessions = medData.length;

    // Goals
    const activeGoals = goalsData.filter(g => g.status !== "completed").length;
    const completedGoals = goalsData.filter(g => g.status === "completed").length;

    // Auto-pulled planner content
    const allWins = [];
    const allGrateful = [];
    const allGoals = [];
    const allJournals = [];
    for (let i = 0; i < 7; i++) {
      const k = ymd(addDays(weekStart, i));
      const e = weekData[k];
      const dayLabel = DAY_NAMES[i].slice(0, 3);
      if (e) {
        if (e.wins) {
          const wins = e.wins.filter(w => w.trim());
          if (wins.length) allWins.push({ day: dayLabel, items: wins });
        }
        if (e.grateful?.trim()) allGrateful.push({ day: dayLabel, text: e.grateful });
        if (e.goal?.trim()) allGoals.push({ day: dayLabel, text: e.goal });
        if (e.journal?.trim()) allJournals.push({ day: dayLabel, text: e.journal });
      }
    }

    return {
      daysLogged, habitPct, habitDone, habitTotal, habitBreakdown,
      avgRating, dailyRatings,
      nutAvg, nutCount,
      workoutDays,
      focusSessions, focusHours,
      avgSleep, sleepDays: sleepData.length,
      waterGoalMet, waterDays: waterData.length,
      medMinutes, medSessions,
      activeGoals, completedGoals,
      journalDays: journalData.length,
      allWins, allGrateful, allGoals, allJournals,
    };
  }, [HABITS_LIST, weekData, workoutData, focusData, sleepData, waterData, medData, journalData, goalsData, weekStart]);

  // Energy audit
  const energyLevels = review?.energy || {};
  const setEnergy = (day, val) => save({ energy: { ...energyLevels, [day]: Number(val) } });

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const s = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const e = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  }, [weekStart]);

  return (
    <div className="reviewPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Weekly Review</h1>
          <div className="weekBadge">{weekLabel}</div>
        </div>
        <div className="nav">
          <button className="btn" onClick={() => setWeekStart(d => addDays(d, -7))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="btn" onClick={() => setWeekStart(d => addDays(d, 7))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          <button className="btn btnPrimary" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>This Week</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="reviewTabBar">
        <button className={`reviewTab ${activeTab === "report" ? "reviewTabActive" : ""}`} onClick={() => setActiveTab("report")} type="button">
          Report
        </button>
        <button className={`reviewTab ${activeTab === "highlights" ? "reviewTabActive" : ""}`} onClick={() => setActiveTab("highlights")} type="button">
          Highlights
        </button>
        <button className={`reviewTab ${activeTab === "reflect" ? "reviewTabActive" : ""}`} onClick={() => setActiveTab("reflect")} type="button">
          Reflect
        </button>
      </div>

      {loading ? (
        <div className="loadingMsg">Loading week data…</div>
      ) : (
        <div className="reviewContent">

          {/* ═══ REPORT TAB ═══ */}
          {activeTab === "report" && (
            <>
              {/* Overview stat cards */}
              <div className="reportGrid">
                <div className="reportCard">
                  <div className="reportCardIcon">📅</div>
                  <div className="reportCardValue">{stats.daysLogged}</div>
                  <div className="reportCardLabel">Days Logged</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">✅</div>
                  <div className="reportCardValue">{stats.habitPct}%</div>
                  <div className="reportCardLabel">Habit Completion</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">⭐</div>
                  <div className="reportCardValue">{stats.avgRating}</div>
                  <div className="reportCardLabel">Avg Day Rating</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">💪</div>
                  <div className="reportCardValue">{stats.workoutDays}</div>
                  <div className="reportCardLabel">Workouts</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">🎯</div>
                  <div className="reportCardValue">{stats.focusHours}h</div>
                  <div className="reportCardLabel">Focus Time</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">😴</div>
                  <div className="reportCardValue">{stats.avgSleep}h</div>
                  <div className="reportCardLabel">Avg Sleep</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">💧</div>
                  <div className="reportCardValue">{stats.waterGoalMet}/{stats.waterDays}</div>
                  <div className="reportCardLabel">Water Goals Met</div>
                </div>
                <div className="reportCard">
                  <div className="reportCardIcon">🧘</div>
                  <div className="reportCardValue">{stats.medMinutes}m</div>
                  <div className="reportCardLabel">Meditation</div>
                </div>
              </div>

              {/* Day-by-day rating bar */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Daily Ratings</div>
                <div className="reviewRatingBars">
                  {DAY_NAMES.map((day, i) => {
                    const val = stats.dailyRatings[i] || 0;
                    return (
                      <div key={day} className="reviewRatingDay">
                        <div className="reviewRatingBar">
                          <div className="reviewRatingFill" style={{
                            height: `${(val / 5) * 100}%`,
                            background: val >= 4 ? "#4caf50" : val >= 3 ? "#ff9800" : val > 0 ? "#e53935" : "var(--border)",
                          }} />
                        </div>
                        <div className="reviewRatingDayLabel">{day.slice(0, 3)}</div>
                        <div className="reviewRatingVal">{val || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Habits breakdown */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Habits Breakdown</div>
                <div className="reviewHabitList">
                  {HABITS_LIST.map(h => {
                    const b = stats.habitBreakdown[h];
                    const pct = b.total ? Math.round((b.done / b.total) * 100) : 0;
                    return (
                      <div key={h} className="reviewHabitRow">
                        <div className="reviewHabitName">{h}</div>
                        <div className="reviewHabitBar">
                          <div className="progressBar" style={{ height: 8 }}>
                            <div className="progressFill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="reviewHabitPct">{b.done}/{b.total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nutrition */}
              {stats.nutAvg && (
                <div className="reviewSection">
                  <div className="reviewSectionTitle">Nutrition (Avg over {stats.nutCount} days)</div>
                  <div className="reportNutritionGrid">
                    <div className="reportNutItem">
                      <div className="reportNutValue">{stats.nutAvg.calories}</div>
                      <div className="reportNutLabel">Calories</div>
                    </div>
                    <div className="reportNutItem">
                      <div className="reportNutValue">{stats.nutAvg.protein}g</div>
                      <div className="reportNutLabel">Protein</div>
                    </div>
                    <div className="reportNutItem">
                      <div className="reportNutValue">{stats.nutAvg.carbs}g</div>
                      <div className="reportNutLabel">Carbs</div>
                    </div>
                    <div className="reportNutItem">
                      <div className="reportNutValue">{stats.nutAvg.fat}g</div>
                      <div className="reportNutLabel">Fat</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity summary */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Activity</div>
                <div className="reportActivityGrid">
                  <div className="reportActivityItem"><span className="reportActivityValue">{stats.journalDays}</span> journal entries</div>
                  <div className="reportActivityItem"><span className="reportActivityValue">{stats.focusSessions}</span> focus sessions</div>
                  <div className="reportActivityItem"><span className="reportActivityValue">{stats.medSessions}</span> meditation sessions</div>
                  <div className="reportActivityItem"><span className="reportActivityValue">{stats.activeGoals}</span> active goals</div>
                </div>
              </div>
            </>
          )}

          {/* ═══ HIGHLIGHTS TAB ═══ */}
          {activeTab === "highlights" && (
            <>
              {/* Auto-pulled wins */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Wins This Week</div>
                {stats.allWins.length > 0 ? (
                  <div className="reviewAutoList">
                    {stats.allWins.map((w, i) => (
                      <div key={i} className="reviewAutoItem">
                        <span className="reviewAutoDay">{w.day}</span>
                        <div className="reviewAutoContent">
                          {w.items.map((item, j) => <div key={j}>{item}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reviewAutoEmpty">No wins logged this week</div>
                )}
              </div>

              {/* Auto-pulled gratitude */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Gratitude</div>
                {stats.allGrateful.length > 0 ? (
                  <div className="reviewAutoList">
                    {stats.allGrateful.map((g, i) => (
                      <div key={i} className="reviewAutoItem">
                        <span className="reviewAutoDay">{g.day}</span>
                        <div className="reviewAutoContent">{g.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reviewAutoEmpty">No gratitude entries this week</div>
                )}
              </div>

              {/* Auto-pulled daily goals */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Daily Goals</div>
                {stats.allGoals.length > 0 ? (
                  <div className="reviewAutoList">
                    {stats.allGoals.map((g, i) => (
                      <div key={i} className="reviewAutoItem">
                        <span className="reviewAutoDay">{g.day}</span>
                        <div className="reviewAutoContent">{g.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reviewAutoEmpty">No daily goals logged this week</div>
                )}
              </div>

              {/* Auto-pulled journal snippets */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Journal Entries</div>
                {stats.allJournals.length > 0 ? (
                  <div className="reviewAutoList">
                    {stats.allJournals.map((j, i) => (
                      <div key={i} className="reviewAutoItem">
                        <span className="reviewAutoDay">{j.day}</span>
                        <div className="reviewAutoContent reviewAutoSnippet">{j.text.slice(0, 200)}{j.text.length > 200 ? "…" : ""}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reviewAutoEmpty">No journal entries this week</div>
                )}
              </div>
            </>
          )}

          {/* ═══ REFLECT TAB ═══ */}
          {activeTab === "reflect" && review && (
            <>
              <div className="reviewFields">
                <div className="reviewField">
                  <label className="label">Wins this week</label>
                  <textarea className="reviewTextarea" value={review.wins || ""}
                    onChange={e => save({ wins: e.target.value })}
                    placeholder="What went well? What are you proud of?" />
                </div>
                <div className="reviewField">
                  <label className="label">Challenges</label>
                  <textarea className="reviewTextarea" value={review.challenges || ""}
                    onChange={e => save({ challenges: e.target.value })}
                    placeholder="What was hard? What didn't go as planned?" />
                </div>
                <div className="reviewField">
                  <label className="label">Lessons learned</label>
                  <textarea className="reviewTextarea" value={review.lessons || ""}
                    onChange={e => save({ lessons: e.target.value })}
                    placeholder="What did you learn? What would you do differently?" />
                </div>
                <div className="reviewField">
                  <label className="label">Focus for next week</label>
                  <textarea className="reviewTextarea" value={review.nextWeek || ""}
                    onChange={e => save({ nextWeek: e.target.value })}
                    placeholder="What are your priorities for next week?" />
                </div>
              </div>

              {/* Energy Audit */}
              <div className="reviewSection">
                <div className="reviewSectionTitle">Energy Audit</div>
                <div className="reviewEnergyGrid">
                  {DAY_NAMES.map((day, i) => {
                    const val = energyLevels[day] || 0;
                    return (
                      <div key={day} className="reviewEnergyDay">
                        <div className="reviewEnergyDayLabel">{day.slice(0, 3)}</div>
                        <div className="reviewEnergyBar">
                          <div className="reviewEnergyFill" style={{
                            height: `${(val / 10) * 100}%`,
                            background: val >= 7 ? "#4caf50" : val >= 4 ? "#ff9800" : val > 0 ? "#e53935" : "var(--border)",
                          }} />
                        </div>
                        <input type="number" className="reviewEnergyInput" min="0" max="10"
                          value={val || ""} placeholder="—"
                          onChange={e => setEnergy(day, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
                <div className="reviewEnergyFields">
                  <div className="reviewField">
                    <label className="label">What drained your energy?</label>
                    <textarea className="reviewTextarea" value={review.energyDrains || ""}
                      onChange={e => save({ energyDrains: e.target.value })}
                      placeholder="Late nights, stressful meetings, poor diet…" rows={2} />
                  </div>
                  <div className="reviewField">
                    <label className="label">What boosted your energy?</label>
                    <textarea className="reviewTextarea" value={review.energyBoosts || ""}
                      onChange={e => save({ energyBoosts: e.target.value })}
                      placeholder="Exercise, good sleep, time with friends…" rows={2} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
