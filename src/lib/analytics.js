/**
 * Life Wrapped / Analytics Foundation
 * Computes aggregate stats from planner entries for use in reports and year-end summaries.
 */
import { HABITS } from "./constants.js";

/**
 * Compute analytics from an array/object of planner entries.
 * @param {Object} entries - { "2026-01-01": { habits, rating, ... }, ... }
 * @returns {Object} analytics summary
 */
export function computeAnalytics(entries) {
  const dates = Object.keys(entries).sort();
  if (dates.length === 0) return null;

  let totalDays = dates.length;
  let totalRating = 0, ratingCount = 0;
  let totalHabitsDone = 0, totalHabitsTotal = 0;
  let bestDay = null, bestDayRating = 0;
  let perfectHabitDays = 0;
  let journalDays = 0;
  let goalDays = 0;
  let gratefulDays = 0;
  const habitCounts = {};
  const ratingsByMonth = {};
  let currentStreak = 0, bestStreak = 0;

  for (const h of HABITS) habitCounts[h] = 0;

  for (const dateStr of dates) {
    const e = entries[dateStr];
    if (!e) continue;

    // Rating
    if (e.rating) {
      totalRating += e.rating;
      ratingCount++;
      if (e.rating > bestDayRating) {
        bestDayRating = e.rating;
        bestDay = dateStr;
      }
      const month = dateStr.slice(0, 7);
      if (!ratingsByMonth[month]) ratingsByMonth[month] = { sum: 0, count: 0 };
      ratingsByMonth[month].sum += e.rating;
      ratingsByMonth[month].count++;
    }

    // Habits
    let dayDone = 0;
    for (const h of HABITS) {
      totalHabitsTotal++;
      if (e.habits?.[h]) {
        totalHabitsDone++;
        dayDone++;
        habitCounts[h] = (habitCounts[h] || 0) + 1;
      }
    }
    if (dayDone === HABITS.length) perfectHabitDays++;

    // Streak (any active day = has goal or grateful or habits)
    const active = dayDone > 0 || e.goal || e.grateful;
    if (active) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
    else currentStreak = 0;

    // Content
    if (e.goal) goalDays++;
    if (e.grateful) gratefulDays++;
  }

  // Top habits (sorted by completion count)
  const topHabits = Object.entries(habitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: totalDays ? Math.round((count / totalDays) * 100) : 0 }));

  // Monthly averages
  const monthlyRatings = Object.entries(ratingsByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { sum, count }]) => ({ month, avg: (sum / count).toFixed(1) }));

  return {
    totalDays,
    dateRange: { start: dates[0], end: dates[dates.length - 1] },
    avgRating: ratingCount ? (totalRating / ratingCount).toFixed(1) : null,
    bestDay: bestDay ? { date: bestDay, rating: bestDayRating } : null,
    habitsPct: totalHabitsTotal ? Math.round((totalHabitsDone / totalHabitsTotal) * 100) : 0,
    perfectHabitDays,
    topHabits,
    bestStreak,
    goalDays,
    gratefulDays,
    monthlyRatings,
  };
}
