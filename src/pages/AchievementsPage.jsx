import { useEffect, useState, useMemo } from "react";
import { HABITS } from "../lib/constants.js";
import { ymd, addDays, parseYMD } from "../lib/dates.js";

/* ──────────────────── helpers ──────────────────── */

function consecutiveDaysWithHabit(allData) {
  const sorted = Object.keys(allData || {}).sort();
  let best = 0, run = 0;
  for (let i = 0; i < sorted.length; i++) {
    const entry = allData[sorted[i]];
    const habits = entry?.habits || {};
    const anyDone = HABITS.some((h) => habits[h]);
    if (anyDone) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

function allHabitsDoneStreak(allData) {
  const sorted = Object.keys(allData || {}).sort();
  let best = 0, run = 0;
  for (const k of sorted) {
    const habits = allData[k]?.habits || {};
    const allDone = HABITS.every((h) => habits[h]);
    if (allDone) { run++; if (run > best) best = run; }
    else run = 0;
  }
  return best;
}

function journalStreak(entries) {
  if (!entries || !entries.length) return 0;
  const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = parseYMD(dates[i - 1]);
    const cur = parseYMD(dates[i]);
    const diff = (prev - cur) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function waterGoalStreak(waterLogs) {
  if (!waterLogs || !waterLogs.length) return 0;
  const sorted = [...waterLogs].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0;
  for (const log of sorted) {
    if (log.glasses >= log.goal && log.goal > 0) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

function sleepTrackingStreak(sleepLogs) {
  if (!sleepLogs || !sleepLogs.length) return 0;
  const sorted = [...sleepLogs].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { run = 1; best = 1; continue; }
    const prev = parseYMD(sorted[i - 1].date);
    const cur = parseYMD(sorted[i].date);
    const diff = (cur - prev) / 86400000;
    if (diff === 1) { run++; if (run > best) best = run; }
    else run = 1;
  }
  return best;
}

function totalFocusHours(sessions) {
  if (!sessions || !sessions.length) return 0;
  return sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
}

function plannerDaysUsed(allData) {
  let count = 0;
  for (const k of Object.keys(allData || {})) {
    const e = allData[k];
    if (e?.grateful || e?.goal || e?.notes || (e?.top3 && e.top3.some(Boolean))) count++;
  }
  return count;
}

function daysWithRating(allData, minRating) {
  let count = 0;
  for (const k of Object.keys(allData || {})) {
    if ((allData[k]?.rating || 0) >= minRating) count++;
  }
  return count;
}

/* ──────────────────── achievement definitions ──────────────────── */

const ACHIEVEMENTS = [
  // ── Consistency ──
  { id: "habit_streak_7", title: "Week Warrior", description: "Complete at least one habit for 7 consecutive days", icon: "🔥", category: "Consistency",
    check: (d) => ({ current: d.habitStreak, target: 7 }) },
  { id: "habit_streak_30", title: "Unstoppable", description: "Complete at least one habit for 30 consecutive days", icon: "💪", category: "Consistency",
    check: (d) => ({ current: d.habitStreak, target: 30 }) },
  { id: "perfect_day_7", title: "Perfect Week", description: "Complete ALL habits for 7 consecutive days", icon: "⭐", category: "Consistency",
    check: (d) => ({ current: d.allHabitsStreak, target: 7 }) },
  { id: "journal_streak_7", title: "Dear Diary", description: "Write journal entries 7 days in a row", icon: "📝", category: "Consistency",
    check: (d) => ({ current: d.journalStreakVal, target: 7 }) },
  { id: "planner_30", title: "Planning Pro", description: "Use the planner for 30 different days", icon: "📅", category: "Consistency",
    check: (d) => ({ current: d.plannerDays, target: 30 }) },

  // ── Focus ──
  { id: "focus_10", title: "Getting Started", description: "Complete 10 focus sessions", icon: "🎯", category: "Focus",
    check: (d) => ({ current: d.focusCount, target: 10 }) },
  { id: "focus_50", title: "Laser Focus", description: "Complete 50 focus sessions", icon: "🔬", category: "Focus",
    check: (d) => ({ current: d.focusCount, target: 50 }) },
  { id: "focus_100", title: "Focus Master", description: "Complete 100 focus sessions", icon: "🧠", category: "Focus",
    check: (d) => ({ current: d.focusCount, target: 100 }) },
  { id: "focus_hours_10", title: "Deep Thinker", description: "Accumulate 10 hours of focused work", icon: "⏱️", category: "Focus",
    check: (d) => ({ current: Math.round(d.focusHours * 10) / 10, target: 10 }) },
  { id: "focus_hours_50", title: "Time Lord", description: "Accumulate 50 hours of focused work", icon: "⌛", category: "Focus",
    check: (d) => ({ current: Math.round(d.focusHours * 10) / 10, target: 50 }) },

  // ── Wellness ──
  { id: "water_streak_7", title: "Hydration Hero", description: "Hit your water goal 7 days in a row", icon: "💧", category: "Wellness",
    check: (d) => ({ current: d.waterStreak, target: 7 }) },
  { id: "water_streak_30", title: "Water Champion", description: "Hit your water goal 30 days in a row", icon: "🌊", category: "Wellness",
    check: (d) => ({ current: d.waterStreak, target: 30 }) },
  { id: "meditation_30", title: "Inner Peace", description: "Complete 30 meditation sessions", icon: "🧘", category: "Wellness",
    check: (d) => ({ current: d.meditationCount, target: 30 }) },
  { id: "meditation_100", title: "Zen Master", description: "Complete 100 meditation sessions", icon: "☯️", category: "Wellness",
    check: (d) => ({ current: d.meditationCount, target: 100 }) },
  { id: "sleep_streak_7", title: "Sleep Scholar", description: "Track your sleep for 7 consecutive days", icon: "😴", category: "Wellness",
    check: (d) => ({ current: d.sleepStreak, target: 7 }) },
  { id: "sleep_streak_30", title: "Dream Keeper", description: "Track your sleep for 30 consecutive days", icon: "🌙", category: "Wellness",
    check: (d) => ({ current: d.sleepStreak, target: 30 }) },

  // ── Knowledge ──
  { id: "knowledge_10", title: "Curious Mind", description: "Add 10 entries to the Knowledge Vault", icon: "📚", category: "Knowledge",
    check: (d) => ({ current: d.knowledgeCount, target: 10 }) },
  { id: "knowledge_50", title: "Walking Library", description: "Add 50 entries to the Knowledge Vault", icon: "🏛️", category: "Knowledge",
    check: (d) => ({ current: d.knowledgeCount, target: 50 }) },
  { id: "knowledge_100", title: "Knowledge Sage", description: "Add 100 entries to the Knowledge Vault", icon: "🦉", category: "Knowledge",
    check: (d) => ({ current: d.knowledgeCount, target: 100 }) },

  // ── Fitness ──
  { id: "workout_10", title: "Gym Regular", description: "Log 10 workouts", icon: "🏋️", category: "Fitness",
    check: (d) => ({ current: d.workoutCount, target: 10 }) },
  { id: "workout_50", title: "Iron Will", description: "Log 50 workouts", icon: "🥇", category: "Fitness",
    check: (d) => ({ current: d.workoutCount, target: 50 }) },
  { id: "workout_100", title: "Century Club", description: "Log 100 workouts", icon: "💯", category: "Fitness",
    check: (d) => ({ current: d.workoutCount, target: 100 }) },
  { id: "workout_200", title: "Absolute Beast", description: "Log 200 workouts", icon: "🦁", category: "Fitness",
    check: (d) => ({ current: d.workoutCount, target: 200 }) },

  // ── Growth ──
  { id: "goal_first", title: "Goal Getter", description: "Complete your first goal", icon: "🎉", category: "Growth",
    check: (d) => ({ current: d.goalsCompleted, target: 1 }) },
  { id: "goal_5", title: "Achiever", description: "Complete 5 goals", icon: "🏆", category: "Growth",
    check: (d) => ({ current: d.goalsCompleted, target: 5 }) },
  { id: "goal_10", title: "Dream Chaser", description: "Complete 10 goals", icon: "🚀", category: "Growth",
    check: (d) => ({ current: d.goalsCompleted, target: 10 }) },
  { id: "journal_30", title: "Reflective Soul", description: "Write 30 journal entries", icon: "✍️", category: "Growth",
    check: (d) => ({ current: d.journalCount, target: 30 }) },
  { id: "journal_100", title: "Wordsmith", description: "Write 100 journal entries", icon: "📖", category: "Growth",
    check: (d) => ({ current: d.journalCount, target: 100 }) },
  { id: "five_star_7", title: "Living the Dream", description: "Rate 7 days with 5 stars", icon: "🌟", category: "Growth",
    check: (d) => ({ current: d.fiveStarDays, target: 7 }) },
  { id: "planner_100", title: "Life Architect", description: "Use the planner for 100 different days", icon: "🏗️", category: "Growth",
    check: (d) => ({ current: d.plannerDays, target: 100 }) },
];

const CATEGORIES = ["Consistency", "Focus", "Wellness", "Knowledge", "Fitness", "Growth"];

const CATEGORY_ICONS = {
  Consistency: "🔁",
  Focus: "🎯",
  Wellness: "💚",
  Knowledge: "📚",
  Fitness: "🏋️",
  Growth: "🌱",
};

/* ──────────────────── component ──────────────────── */

export default function AchievementsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = ymd(new Date());
      const farPast = "2020-01-01";
      const farFuture = "2099-12-31";

      const [allEntries, focusSessions, waterLogs, sleepLogs, meditationLogs, journalEntries, knowledgeEntries, goals, workoutDates] =
        await Promise.all([
          window.plannerApi?.getAll?.() ?? {},
          window.focusApi?.getRange?.(farPast, farFuture).catch(() => []) ?? [],
          window.waterApi?.range?.(farPast, farFuture).catch(() => []) ?? [],
          window.sleepApi?.range?.(farPast, farFuture).catch(() => []) ?? [],
          window.meditationApi?.range?.(farPast, farFuture).catch(() => []) ?? [],
          window.journalApi?.list?.().catch(() => []) ?? [],
          window.knowledgeApi?.list?.().catch(() => []) ?? [],
          window.goalsApi?.list?.().catch(() => []) ?? [],
          window.workoutApi?.allDates?.().catch(() => []) ?? [],
        ]);

      if (cancelled) return;

      setData({
        habitStreak: consecutiveDaysWithHabit(allEntries),
        allHabitsStreak: allHabitsDoneStreak(allEntries),
        journalStreakVal: journalStreak(journalEntries),
        journalCount: journalEntries.length,
        plannerDays: plannerDaysUsed(allEntries),
        focusCount: focusSessions.length,
        focusHours: totalFocusHours(focusSessions),
        waterStreak: waterGoalStreak(waterLogs),
        meditationCount: meditationLogs.length,
        sleepStreak: sleepTrackingStreak(sleepLogs),
        knowledgeCount: knowledgeEntries.length,
        workoutCount: workoutDates.length,
        goalsCompleted: goals.filter((g) => g.completed || g.status === "completed").length,
        fiveStarDays: daysWithRating(allEntries, 5),
      });
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    return ACHIEVEMENTS.map((ach) => {
      const { current, target } = ach.check(data);
      const unlocked = current >= target;
      const pct = Math.min(100, Math.round((current / target) * 100));
      return { ...ach, current, target, unlocked, pct };
    });
  }, [data]);

  const unlockedCount = results.filter((r) => r.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  const filtered = filterCat === "All" ? results : results.filter((r) => r.category === filterCat);

  if (loading) {
    return (
      <div className="achPage">
        <div className="achLoading">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="achPage">
      {/* Header */}
      <div className="achHeader">
        <div className="achHeaderLeft">
          <h1 className="achTitle">Achievements</h1>
          <p className="achSubtitle">Track your milestones and celebrate your progress</p>
        </div>
        <div className="achSummaryBadge">
          <span className="achSummaryIcon">🏆</span>
          <div className="achSummaryText">
            <span className="achSummaryCount">{unlockedCount}/{totalCount}</span>
            <span className="achSummaryLabel">Unlocked</span>
          </div>
          <div className="achSummaryBar">
            <div className="achSummaryBarFill" style={{ width: `${Math.round((unlockedCount / totalCount) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="achFilters">
        <button className={`achFilterBtn ${filterCat === "All" ? "achFilterActive" : ""}`} onClick={() => setFilterCat("All")}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`achFilterBtn ${filterCat === cat ? "achFilterActive" : ""}`} onClick={() => setFilterCat(cat)}>
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Grid by category */}
      {filterCat === "All" ? (
        CATEGORIES.map((cat) => {
          const catResults = results.filter((r) => r.category === cat);
          if (!catResults.length) return null;
          return (
            <div key={cat} className="achCatSection">
              <h2 className="achCatTitle">{CATEGORY_ICONS[cat]} {cat}</h2>
              <div className="achGrid">
                {catResults.map((ach) => (
                  <AchievementCard key={ach.id} ach={ach} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="achGrid">
          {filtered.map((ach) => (
            <AchievementCard key={ach.id} ach={ach} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ ach }) {
  const { unlocked, pct, current, target, icon, title, description } = ach;

  return (
    <div className={`achCard ${unlocked ? "achCardUnlocked" : "achCardLocked"}`}>
      <div className="achCardIcon">{icon}</div>
      <div className="achCardBody">
        <div className="achCardTitle">{title}</div>
        <div className="achCardDesc">{description}</div>
        {unlocked ? (
          <div className="achCardEarned">Earned</div>
        ) : (
          <div className="achCardProgress">
            <div className="achProgressBar">
              <div className="achProgressFill" style={{ width: `${pct}%` }} />
            </div>
            <div className="achProgressLabel">{current}/{target} ({pct}%)</div>
          </div>
        )}
      </div>
    </div>
  );
}
