import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HABITS, HOURS, defaultEntry } from "./lib/constants.js";
import { ymd, addDays, startOfWeekMonday, formatRange, isoWeekYear } from "./lib/dates.js";
import { defaultHabits, progressFor, currentStreakEndingOn, bestStreakForHabit } from "./lib/habits.js";
import { useWeekData } from "./hooks/useDb.js";
import AutoGrowTextarea from "./components/AutoGrowTextarea.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StarRating from "./components/StarRating.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import WorkoutsPage from "./pages/WorkoutsPage.jsx";
import HabitsPage from "./pages/HabitsPage.jsx";
import JournalPage from "./pages/JournalPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import WeeklyReviewPage from "./pages/WeeklyReviewPage.jsx";
import BodyStatsPage from "./pages/BodyStatsPage.jsx";
import FinancesPage from "./pages/FinancesPage.jsx";
import FocusTimerPage from "./pages/FocusTimerPage.jsx";
import SleepTrackerPage from "./pages/SleepTrackerPage.jsx";
import VisionBoardPage from "./pages/VisionBoardPage.jsx";
import WaterTrackerPage from "./pages/WaterTrackerPage.jsx";
import MeditationPage from "./pages/MeditationPage.jsx";
import ScoreboardPage from "./pages/ScoreboardPage.jsx";
import AffirmationsPage from "./pages/AffirmationsPage.jsx";
import SupplementsPage from "./pages/SupplementsPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import KnowledgeVaultPage from "./pages/KnowledgeVaultPage.jsx";
import MealPlannerPage from "./pages/MealPlannerPage.jsx";
import AchievementsPage from "./pages/AchievementsPage.jsx";
import DaysSincePage from "./pages/DaysSincePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import LifeAreasPage from "./pages/LifeAreasPage.jsx";
import LettersPage from "./pages/LettersPage.jsx";
import LifeTimelinePage from "./pages/LifeTimelinePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import MacrosPage from "./pages/MacrosPage.jsx";
import CareerPage from "./pages/CareerPage.jsx";
import BibleStudyPage from "./pages/BibleStudyPage.jsx";
import RoutinesPage from "./pages/RoutinesPage.jsx";
import MoodTrackerPage from "./pages/MoodTrackerPage.jsx";
import FastingTrackerPage from "./pages/FastingTrackerPage.jsx";
import BudgetPage from "./pages/BudgetPage.jsx";
import NetWorthPage from "./pages/NetWorthPage.jsx";
import SideHustlesPage from "./pages/SideHustlesPage.jsx";
import NetworkingPage from "./pages/NetworkingPage.jsx";
import PrayerJournalPage from "./pages/PrayerJournalPage.jsx";
import ScriptureMemoryPage from "./pages/ScriptureMemoryPage.jsx";
import SermonNotesPage from "./pages/SermonNotesPage.jsx";
import BucketListPage from "./pages/BucketListPage.jsx";
import SkillsTrackerPage from "./pages/SkillsTrackerPage.jsx";
import RelationshipTrackerPage from "./pages/RelationshipTrackerPage.jsx";
import ChallengesPage from "./pages/ChallengesPage.jsx";
import PeoplePage from "./pages/PeoplePage.jsx";
import DateIdeasPage from "./pages/DateIdeasPage.jsx";
import GiftIdeasPage from "./pages/GiftIdeasPage.jsx";
import CleaningSchedulePage from "./pages/CleaningSchedulePage.jsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";


function PlaceholderPage({ title }) {
  return (
    <div className="placeholderPage">
      <div className="placeholderIcon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </div>
      <div className="placeholderTitle">{title}</div>
      <div className="placeholderSub">Coming soon</div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [plannerView, setPlannerView] = useState("3day"); // "3day" or "week"
  const [searchOpen, setSearchOpen] = useState(false);
  const [weightUnit, setWeightUnit] = useState("lbs");
  const todayStr = useMemo(() => ymd(new Date()), []);

  // Load saved weight unit preference
  useEffect(() => {
    window.settingsApi.get("weightUnit").then((saved) => {
      if (saved) setWeightUnit(saved);
    });
  }, []);
  const toggleWeightUnit = () => {
    const next = weightUnit === "lbs" ? "kg" : "lbs";
    setWeightUnit(next);
    window.settingsApi.set("weightUnit", next);
  };

  // Keyboard shortcuts
  const PAGE_SHORTCUTS = useMemo(() => ({
    "1": "dashboard", "2": "planner", "3": "calendar", "4": "habits",
    "5": "workouts", "6": "journal", "7": "goals", "8": "knowledge", "9": "focus",
  }), []);

  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        return;
      }
      if (meta && e.key === "j") {
        e.preventDefault();
        setActivePage("journal");
        return;
      }
      if (meta && e.key === "n") {
        e.preventDefault();
        setActivePage("notes");
        return;
      }
      if (meta && e.key === "d") {
        e.preventDefault();
        setActivePage("dashboard");
        return;
      }
      if (meta && PAGE_SHORTCUTS[e.key]) {
        e.preventDefault();
        setActivePage(PAGE_SHORTCUTS[e.key]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [PAGE_SHORTCUTS]);

  const { weekData, allData, loading, saveDay } = useWeekData(weekStart);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { weekNumber, weekYear } = useMemo(() => isoWeekYear(weekStart), [weekStart]);

  const bestByHabit = useMemo(() => {
    const out = {};
    for (const h of HABITS) out[h] = bestStreakForHabit(allData, h);
    return out;
  }, [allData]);

  const updateDay = (dateStr, patch) => {
    if (loading) return; // Don't save until data is loaded
    const current = weekData[dateStr] || defaultEntry(dateStr);
    const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
    saveDay(dateStr, next);
  };

  const weekNutritionAvg = useMemo(() => {
    let count = 0;
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (let i = 0; i < 7; i++) {
      const key = ymd(addDays(weekStart, i));
      const n = weekData[key]?.nutrition;
      if (n && (n.calories || n.protein || n.carbs || n.fat)) {
        count++;
        totals.calories += Number(n.calories) || 0;
        totals.protein += Number(n.protein) || 0;
        totals.carbs += Number(n.carbs) || 0;
        totals.fat += Number(n.fat) || 0;
      }
    }
    if (!count) return null;
    return {
      calories: Math.round(totals.calories / count),
      protein: Math.round(totals.protein / count),
      carbs: Math.round(totals.carbs / count),
      fat: Math.round(totals.fat / count),
      days: count,
    };
  }, [weekData, weekStart]);

  // 3-day view: yesterday, today, tomorrow
  const threeDayDates = useMemo(() => {
    const now = new Date();
    return [addDays(now, -1), now, addDays(now, 1)];
  }, []);

  const goPrevWeek = () => setWeekStart((d) => addDays(d, -7));
  const goNextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));

  const displayDates = plannerView === "3day" ? threeDayDates : weekDates;

  return (
    <div className="appShell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(page) => { setActivePage(page); setSearchOpen(false); }}
      />

      <div className="mainArea">
        {/* Draggable title bar region */}
        <div className="titleBarDrag" />

        <ErrorBoundary key={activePage}>
        {activePage === "dashboard" ? (
          <DashboardPage onNavigate={setActivePage} />
        ) : activePage === "planner" ? (
          <>
            {/* Top bar */}
            <div className="topbar">
              <div className="topbarLeft">
                <h1 className="pageTitle">{plannerView === "3day" ? "Daily Planner" : "Weekly Planner"}</h1>
                <div className="weekBadge">
                  {plannerView === "3day"
                    ? new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                    : `Week ${weekNumber} · ${weekYear}`}
                </div>
              </div>
              <div className="nav">
                <div className="plannerViewToggle">
                  <button
                    className={`plannerViewBtn ${plannerView === "3day" ? "plannerViewBtnActive" : ""}`}
                    onClick={() => setPlannerView("3day")}
                    type="button"
                  >3 Day</button>
                  <button
                    className={`plannerViewBtn ${plannerView === "week" ? "plannerViewBtnActive" : ""}`}
                    onClick={() => setPlannerView("week")}
                    type="button"
                  >Week</button>
                </div>
                {plannerView === "week" && (
                  <>
                    <button className="btn" onClick={goPrevWeek} aria-label="Previous week">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <div className="range">{formatRange(weekStart)}</div>
                    <button className="btn" onClick={goNextWeek} aria-label="Next week">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    </button>
                    <button className="btn btnPrimary" onClick={goToday}>
                      Today
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Weekly nutrition averages */}
            {weekNutritionAvg && (
              <div className="nutritionAvgBar">
                <span className="nutritionAvgLabel">Weekly Avg ({weekNutritionAvg.days}d)</span>
                <span className="nutritionAvgStat"><strong>{weekNutritionAvg.calories}</strong> cal</span>
                <span className="nutritionAvgStat"><strong>{weekNutritionAvg.protein}g</strong> protein</span>
                <span className="nutritionAvgStat"><strong>{weekNutritionAvg.carbs}g</strong> carbs</span>
                <span className="nutritionAvgStat"><strong>{weekNutritionAvg.fat}g</strong> fat</span>
              </div>
            )}

            {/* Week */}
            <div className="weekViewport">
              {loading ? (
                <div className="loadingMsg">Loading…</div>
              ) : (
                <div className={`weekGrid ${plannerView === "3day" ? "threeDayGrid" : ""}`}>
                  {displayDates.map((d) => {
                    const dateStr = ymd(d);
                    const day = weekData[dateStr] || defaultEntry(dateStr);
                    const isToday = dateStr === todayStr;

                    const dayName = plannerView === "3day"
                      ? (dateStr === ymd(addDays(new Date(), -1)) ? "Yesterday"
                        : isToday ? "Today"
                        : "Tomorrow")
                      : d.toLocaleDateString(undefined, { weekday: "long" });
                    const chip = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

                    // Ensure arrays exist (old entries may have different shape)
                    if (!Array.isArray(day.top3)) day.top3 = day.priorities || ["", "", ""];
                    if (!Array.isArray(day.wins)) day.wins = ["", "", ""];

                    const { done, total, pct } = progressFor(day);

                    return (
                      <div className={`dayCol ${isToday ? "isToday" : ""}`} key={dateStr}>
                        <div className="dayHeader">
                          <div className="dayHeaderLeft">
                            <div className="dayName">{dayName}</div>
                            <div className={`dateChip ${isToday ? "chipToday" : ""}`}>{chip}</div>
                          </div>
                          <div className="dayHeaderRight">
                            <button
                              className={`tabBtn ${day.tab === "planner" ? "active" : ""}`}
                              onClick={() => updateDay(dateStr, (cur) => ({ ...cur, tab: "planner" }))}
                              type="button"
                            >
                              Planner
                            </button>
                            <button
                              className={`tabBtn ${day.tab === "habits" ? "active" : ""}`}
                              onClick={() => updateDay(dateStr, (cur) => ({ ...cur, tab: "habits" }))}
                              type="button"
                            >
                              Habits
                            </button>
                            <button
                              className={`tabBtn ${day.tab === "journal" ? "active" : ""}`}
                              onClick={() => updateDay(dateStr, (cur) => ({ ...cur, tab: "journal" }))}
                              type="button"
                            >
                              Journal
                            </button>
                          </div>
                        </div>

                        {day.tab === "planner" ? (
                          <div className="dayBody">
                            <div className="section">
                              <div className="label">Grateful for</div>
                              <AutoGrowTextarea
                                value={day.grateful}
                                onChange={(v) => updateDay(dateStr, (cur) => ({ ...cur, grateful: v }))}
                                placeholder="What am I grateful for?"
                                className="input"
                                rows={1}
                                minHeight={34}
                                maxHeight={160}
                              />
                            </div>

                            <div className="section">
                              <div className="label">How I want to feel</div>
                              <AutoGrowTextarea
                                value={day.feel}
                                onChange={(v) => updateDay(dateStr, (cur) => ({ ...cur, feel: v }))}
                                placeholder="Calm, focused, energized…"
                                className="input"
                                rows={1}
                                minHeight={34}
                                maxHeight={160}
                              />
                            </div>

                            <div className="section">
                              <div className="label">Daily goal</div>
                              <AutoGrowTextarea
                                value={day.goal}
                                onChange={(v) => updateDay(dateStr, (cur) => ({ ...cur, goal: v }))}
                                placeholder="What matters most today?"
                                className="input"
                                rows={1}
                                minHeight={34}
                                maxHeight={160}
                              />
                            </div>

                            <div className="divider" />

                            <div className="section">
                              <div className="label">Agenda</div>
                              <div className="agenda">
                                {HOURS.map((h) => (
                                  <div className="row" key={h}>
                                    <div className="time">{h}</div>
                                    <AutoGrowTextarea
                                      value={day.agenda?.[h] || ""}
                                      onChange={(v) =>
                                        updateDay(dateStr, (cur) => ({
                                          ...cur,
                                          agenda: { ...cur.agenda, [h]: v },
                                        }))
                                      }
                                      placeholder=""
                                      className="input inputSlim"
                                      rows={1}
                                      minHeight={32}
                                      maxHeight={220}
                                      ariaLabel={`${dayName} ${h}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="divider" />

                            <div className="section">
                              <div className="label">Top 3 things to do</div>
                              <div className="list3">
                                {day.top3.map((t, i) => (
                                  <div className="row" key={i}>
                                    <div className="num">{i + 1}.</div>
                                    <AutoGrowTextarea
                                      value={t}
                                      onChange={(v) =>
                                        updateDay(dateStr, (cur) => {
                                          const next = [...cur.top3];
                                          next[i] = v;
                                          return { ...cur, top3: next };
                                        })
                                      }
                                      placeholder=""
                                      className="input inputSlim"
                                      rows={1}
                                      minHeight={32}
                                      maxHeight={200}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="section">
                              <div className="label">Notes</div>
                              <AutoGrowTextarea
                                value={day.notes}
                                onChange={(v) => updateDay(dateStr, (cur) => ({ ...cur, notes: v }))}
                                placeholder="Notes…"
                                className="input inputNotes"
                                rows={5}
                                minHeight={120}
                                maxHeight={420}
                              />
                            </div>

                            <div className="section">
                              <div className="label">Top 3 wins</div>
                              <div className="list3">
                                {day.wins.map((w, i) => (
                                  <div className="row" key={i}>
                                    <div className="num">{i + 1}.</div>
                                    <AutoGrowTextarea
                                      value={w}
                                      onChange={(v) =>
                                        updateDay(dateStr, (cur) => {
                                          const next = [...cur.wins];
                                          next[i] = v;
                                          return { ...cur, wins: next };
                                        })
                                      }
                                      placeholder=""
                                      className="input inputSlim"
                                      rows={1}
                                      minHeight={32}
                                      maxHeight={200}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="divider" />

                            <div className="section">
                              <div className="label">Nutrition</div>
                              <div className="nutritionGrid">
                                {[
                                  { key: "calories", label: "Cal", unit: "" },
                                  { key: "protein", label: "Protein", unit: "g" },
                                  { key: "carbs", label: "Carbs", unit: "g" },
                                  { key: "fat", label: "Fat", unit: "g" },
                                ].map(({ key, label, unit }) => (
                                  <div className="nutritionField" key={key}>
                                    <div className="nutritionLabel">{label}</div>
                                    <div className="nutritionInputWrap">
                                      <input
                                        type="number"
                                        className="nutritionInput"
                                        placeholder="—"
                                        value={day.nutrition?.[key] ?? ""}
                                        onChange={(e) =>
                                          updateDay(dateStr, (cur) => ({
                                            ...cur,
                                            nutrition: {
                                              ...(cur.nutrition || {}),
                                              [key]: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                      {unit && <span className="nutritionUnit">{unit}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="section">
                              <div className="weightHeader">
                                <div className="label" style={{ marginBottom: 0 }}>Weight</div>
                                <button className="weightUnitToggle" onClick={toggleWeightUnit} type="button">
                                  {weightUnit}
                                </button>
                              </div>
                              <div className="weightGrid">
                                {[
                                  { key: "weightAm", label: "AM" },
                                  { key: "weightPm", label: "PM" },
                                ].map(({ key, label }) => {
                                  const val = Number(day[key]) || 0;
                                  const converted = val
                                    ? weightUnit === "lbs"
                                      ? (val / 2.20462).toFixed(1)
                                      : (val * 2.20462).toFixed(1)
                                    : null;
                                  const otherUnit = weightUnit === "lbs" ? "kg" : "lbs";
                                  return (
                                    <div className="weightField" key={key}>
                                      <div className="weightLabel">{label}</div>
                                      <div className="nutritionInputWrap">
                                        <input
                                          type="number"
                                          step="0.1"
                                          className="nutritionInput"
                                          placeholder="—"
                                          value={day[key] ?? ""}
                                          onChange={(e) =>
                                            updateDay(dateStr, (cur) => ({
                                              ...cur,
                                              [key]: e.target.value,
                                            }))
                                          }
                                        />
                                        <span className="nutritionUnit">{weightUnit}</span>
                                      </div>
                                      {converted && (
                                        <div className="weightConversion">
                                          {converted} {otherUnit}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="section rateRow">
                              <div className="label labelInline">Rate my day</div>
                              <StarRating
                                value={day.rating}
                                onChange={(v) =>
                                  updateDay(dateStr, (cur) => ({ ...cur, rating: v }))
                                }
                              />
                            </div>

                            <div className="spacer" />
                          </div>
                        ) : day.tab === "habits" ? (
                          <div className="dayBody">
                            <div className="section">
                              <div className="habitsTop">
                                <div className="label" style={{ marginBottom: 0 }}>
                                  Daily habits
                                </div>
                                <div className="habitsActions">
                                  <button
                                    className="miniBtn"
                                    onClick={() =>
                                      updateDay(dateStr, (cur) => {
                                        const next = { ...(cur.habits || defaultHabits()) };
                                        HABITS.forEach((h) => (next[h] = true));
                                        return { ...cur, habits: next };
                                      })
                                    }
                                    type="button"
                                  >
                                    Mark all
                                  </button>
                                  <button
                                    className="miniBtn"
                                    onClick={() =>
                                      updateDay(dateStr, (cur) => {
                                        const next = { ...(cur.habits || defaultHabits()) };
                                        HABITS.forEach((h) => (next[h] = false));
                                        return { ...cur, habits: next };
                                      })
                                    }
                                    type="button"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              <div className="progressWrap">
                                <div className="progressBar">
                                  <div className="progressFill" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="progressMeta">
                                  <span className="pct">{pct}%</span>
                                  <span className="counts">
                                    {done}/{total}
                                  </span>
                                </div>
                              </div>

                              <div className="habitList">
                                {HABITS.map((h) => {
                                  const checked = !!day.habits?.[h];
                                  const curStreak = currentStreakEndingOn(allData, dateStr, h);
                                  const best = bestByHabit[h] || 0;

                                  return (
                                    <button
                                      key={h}
                                      className={`habitRow ${checked ? "checked" : ""}`}
                                      onClick={() =>
                                        updateDay(dateStr, (cur) => {
                                          const next = { ...(cur.habits || defaultHabits()) };
                                          next[h] = !next[h];
                                          return { ...cur, habits: next };
                                        })
                                      }
                                      type="button"
                                    >
                                      <span className={`check ${checked ? "on" : ""}`}>
                                        {checked ? "✓" : ""}
                                      </span>
                                      <div className="habitMid">
                                        <div className="habitText">{h}</div>
                                        <div className="streakRow">
                                          <span className="streakBadge">🔥 {curStreak}</span>
                                          <span className="bestBadge">🏆 {best}</span>
                                        </div>
                                      </div>
                                      <span className="chev">›</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="hint">
                                Streaks count consecutive days. Miss a day → streak resets.
                              </div>
                            </div>
                          </div>
                        ) : day.tab === "journal" ? (
                          <div className="dayBody">
                            <div className="section">
                              <div className="label">Journal</div>
                              <AutoGrowTextarea
                                value={day.journal || ""}
                                onChange={(v) => updateDay(dateStr, (cur) => ({ ...cur, journal: v }))}
                                placeholder="Write your thoughts..."
                                className="input inputJournal"
                                rows={10}
                                minHeight={300}
                                maxHeight={800}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : activePage === "calendar" ? (
          <CalendarPage
            onGoToDay={(weekStart) => {
              setWeekStart(weekStart);
              setActivePage("planner");
            }}
          />
        ) : activePage === "workouts" ? (
          <WorkoutsPage />
        ) : activePage === "habits" ? (
          <HabitsPage />
        ) : activePage === "journal" ? (
          <JournalPage />
        ) : activePage === "knowledge" ? (
          <KnowledgeVaultPage />
        ) : activePage === "goals" ? (
          <GoalsPage />
        ) : activePage === "review" ? (
          <WeeklyReviewPage />
        ) : activePage === "bodystats" ? (
          <BodyStatsPage />
        ) : activePage === "finances" ? (
          <FinancesPage />
        ) : activePage === "focus" ? (
          <FocusTimerPage />
        ) : activePage === "sleep" ? (
          <SleepTrackerPage />
        ) : activePage === "vision" ? (
          <VisionBoardPage />
        ) : activePage === "water" ? (
          <WaterTrackerPage />
        ) : activePage === "meditation" ? (
          <MeditationPage />
        ) : activePage === "scoreboard" ? (
          <ScoreboardPage />
        ) : activePage === "affirmations" ? (
          <AffirmationsPage />
        ) : activePage === "supplements" ? (
          <SupplementsPage />
        ) : activePage === "report" ? (
          <ReportPage />
        ) : activePage === "meals" ? (
          <MealPlannerPage />
        ) : activePage === "achievements" ? (
          <AchievementsPage />
        ) : activePage === "dayssince" ? (
          <DaysSincePage />
        ) : activePage === "projects" ? (
          <ProjectsPage />
        ) : activePage === "lifeareas" ? (
          <LifeAreasPage />
        ) : activePage === "letters" ? (
          <LettersPage />
        ) : activePage === "timeline" ? (
          <LifeTimelinePage />
        ) : activePage === "macros" ? (
          <MacrosPage />
        ) : activePage === "career" ? (
          <CareerPage />
        ) : activePage === "biblestudy" ? (
          <BibleStudyPage />
        ) : activePage === "routines" ? (
          <RoutinesPage />
        ) : activePage === "mood" ? (
          <MoodTrackerPage />
        ) : activePage === "fasting" ? (
          <FastingTrackerPage />
        ) : activePage === "budget" ? (
          <BudgetPage />
        ) : activePage === "networth" ? (
          <NetWorthPage />
        ) : activePage === "sidehustles" ? (
          <SideHustlesPage />
        ) : activePage === "networking" ? (
          <NetworkingPage />
        ) : activePage === "prayerjournal" ? (
          <PrayerJournalPage />
        ) : activePage === "scripturememory" ? (
          <ScriptureMemoryPage />
        ) : activePage === "sermonnotes" ? (
          <SermonNotesPage />
        ) : activePage === "bucketlist" ? (
          <BucketListPage />
        ) : activePage === "skills" ? (
          <SkillsTrackerPage />
        ) : activePage === "relationships" ? (
          <RelationshipTrackerPage />
        ) : activePage === "challenges" ? (
          <ChallengesPage />
        ) : activePage === "people" ? (
          <PeoplePage />
        ) : activePage === "dateideas" ? (
          <DateIdeasPage />
        ) : activePage === "giftideas" ? (
          <GiftIdeasPage />
        ) : activePage === "cleaning" ? (
          <CleaningSchedulePage />
        ) : activePage === "subscriptions" ? (
          <SubscriptionsPage />
        ) : activePage === "settings" ? (
          <SettingsPage />
        ) : null}
        </ErrorBoundary>
      </div>
    </div>
  );
}
