import { ymd, addDays } from "./dates.js";

/**
 * Analyze historical data and surface interesting patterns/correlations.
 * Returns an array of { emoji, text, type } insight objects.
 */
export function generateSmartInsights(allEntries, sleepRange, waterRange, meditationRange, focusRange, habits) {
  const insights = [];
  if (!allEntries || typeof allEntries !== "object") return insights;

  const dates = Object.keys(allEntries).sort();
  if (dates.length < 7) return insights; // Need at least a week of data

  const last30 = dates.slice(-30);
  const last7 = dates.slice(-7);

  // ── Habit Patterns ──
  if (habits && habits.length > 0) {
    // Find best and worst habits
    const habitCounts = {};
    for (const h of habits) habitCounts[h] = 0;
    for (const d of last30) {
      const e = allEntries[d];
      if (!e?.habits) continue;
      for (const h of habits) if (e.habits[h]) habitCounts[h]++;
    }
    const sorted = Object.entries(habitCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0) {
      const bestHabit = sorted[0];
      const pct = Math.round((bestHabit[1] / last30.length) * 100);
      insights.push({ emoji: "🏆", text: `Your most consistent habit is "${bestHabit[0]}" at ${pct}% over the last ${last30.length} days.`, type: "pattern" });
    }
    if (sorted.length > 1) {
      const worstHabit = sorted[sorted.length - 1];
      if (worstHabit[1] < last30.length * 0.3) {
        const pct = Math.round((worstHabit[1] / last30.length) * 100);
        insights.push({ emoji: "📉", text: `"${worstHabit[0]}" needs attention — only ${pct}% completion rate.`, type: "action" });
      }
    }

    // Habit completion trend (improving or declining)
    if (last30.length >= 14) {
      const firstHalf = last30.slice(0, Math.floor(last30.length / 2));
      const secondHalf = last30.slice(Math.floor(last30.length / 2));
      const avgFirst = firstHalf.reduce((s, d) => {
        const e = allEntries[d];
        if (!e?.habits) return s;
        return s + habits.filter(h => e.habits[h]).length;
      }, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, d) => {
        const e = allEntries[d];
        if (!e?.habits) return s;
        return s + habits.filter(h => e.habits[h]).length;
      }, 0) / secondHalf.length;
      if (avgSecond > avgFirst * 1.15) {
        insights.push({ emoji: "📈", text: `Your habit completion is trending up — you're building momentum!`, type: "good" });
      } else if (avgSecond < avgFirst * 0.85) {
        insights.push({ emoji: "⚠️", text: `Habit completion has dipped recently. Try focusing on your top 3 habits.`, type: "action" });
      }
    }
  }

  // ── Sleep & Performance Correlation ──
  if (sleepRange && Object.keys(sleepRange).length >= 7) {
    const sleepDays = Object.entries(sleepRange).filter(([, v]) => v?.hours);
    if (sleepDays.length >= 5) {
      const goodSleepDays = sleepDays.filter(([, v]) => parseFloat(v.hours) >= 7);
      const badSleepDays = sleepDays.filter(([, v]) => parseFloat(v.hours) < 6);

      // Check habit completion after good vs bad sleep
      if (goodSleepDays.length >= 3 && badSleepDays.length >= 2 && habits?.length > 0) {
        const avgHabitsGoodSleep = goodSleepDays.reduce((s, [d]) => {
          const nextDay = ymd(addDays(new Date(d + "T12:00:00"), 1));
          const e = allEntries[nextDay];
          if (!e?.habits) return s;
          return s + habits.filter(h => e.habits[h]).length / habits.length;
        }, 0) / goodSleepDays.length;

        const avgHabitsBadSleep = badSleepDays.reduce((s, [d]) => {
          const nextDay = ymd(addDays(new Date(d + "T12:00:00"), 1));
          const e = allEntries[nextDay];
          if (!e?.habits) return s;
          return s + habits.filter(h => e.habits[h]).length / habits.length;
        }, 0) / badSleepDays.length;

        if (avgHabitsGoodSleep > avgHabitsBadSleep * 1.2) {
          const diff = Math.round((avgHabitsGoodSleep - avgHabitsBadSleep) * 100);
          insights.push({ emoji: "😴", text: `You complete ${diff}% more habits on days after 7+ hours of sleep.`, type: "pattern" });
        }
      }

      // Average sleep
      const avgSleep = sleepDays.reduce((s, [, v]) => s + parseFloat(v.hours), 0) / sleepDays.length;
      if (avgSleep < 6.5) {
        insights.push({ emoji: "🛌", text: `Your average sleep is ${avgSleep.toFixed(1)}h — aim for 7-8 hours for better performance.`, type: "action" });
      } else if (avgSleep >= 7.5) {
        insights.push({ emoji: "💤", text: `Great sleep average of ${avgSleep.toFixed(1)}h — keep it consistent!`, type: "good" });
      }
    }
  }

  // ── Meditation Impact ──
  if (meditationRange && Object.keys(meditationRange).length >= 5 && habits?.length > 0) {
    const medDays = Object.entries(meditationRange).filter(([, v]) => (v?.minutes || v?.duration || 0) > 0);
    const noMedDays = Object.keys(allEntries).filter(d => {
      const m = meditationRange[d];
      return !m || (m.minutes || m.duration || 0) === 0;
    }).slice(-30);

    if (medDays.length >= 3 && noMedDays.length >= 3) {
      const ratingMed = medDays.reduce((s, [d]) => {
        const e = allEntries[d];
        return s + (e?.rating || 0);
      }, 0) / medDays.length;

      const ratingNoMed = noMedDays.slice(0, 10).reduce((s, d) => {
        const e = allEntries[d];
        return s + (e?.rating || 0);
      }, 0) / Math.min(noMedDays.length, 10);

      if (ratingMed > ratingNoMed + 0.3) {
        insights.push({ emoji: "🧘", text: `You rate your days ${(ratingMed - ratingNoMed).toFixed(1)} stars higher on days you meditate.`, type: "pattern" });
      }
    }
  }

  // ── Rating Trends ──
  const ratedDays = last30.filter(d => allEntries[d]?.rating && allEntries[d].rating > 0);
  if (ratedDays.length >= 7) {
    const avgRating = ratedDays.reduce((s, d) => s + allEntries[d].rating, 0) / ratedDays.length;
    const bestDay = ratedDays.reduce((best, d) => allEntries[d].rating > (allEntries[best]?.rating || 0) ? d : best, ratedDays[0]);
    const bestDayName = new Date(bestDay + "T12:00:00").toLocaleDateString(undefined, { weekday: "long" });

    if (avgRating >= 4) {
      insights.push({ emoji: "⭐", text: `Your average day rating is ${avgRating.toFixed(1)}/5 — you're thriving!`, type: "good" });
    }

    // Day-of-week analysis
    const dayTotals = {};
    const dayCounts = {};
    for (const d of ratedDays) {
      const dow = new Date(d + "T12:00:00").getDay();
      dayTotals[dow] = (dayTotals[dow] || 0) + allEntries[d].rating;
      dayCounts[dow] = (dayCounts[dow] || 0) + 1;
    }
    const dayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    let bestDow = -1, bestDowAvg = 0;
    let worstDow = -1, worstDowAvg = 5;
    for (const [dow, total] of Object.entries(dayTotals)) {
      const avg = total / dayCounts[dow];
      if (avg > bestDowAvg && dayCounts[dow] >= 2) { bestDowAvg = avg; bestDow = Number(dow); }
      if (avg < worstDowAvg && dayCounts[dow] >= 2) { worstDowAvg = avg; worstDow = Number(dow); }
    }
    if (bestDow >= 0 && bestDowAvg - worstDowAvg > 0.5) {
      insights.push({ emoji: "📊", text: `${dayNames[bestDow]} are your best days (avg ${bestDowAvg.toFixed(1)}★). ${dayNames[worstDow]} tend to be tougher.`, type: "pattern" });
    }
  }

  // ── Nutrition Patterns ──
  const nutritionDays = last30.filter(d => {
    const n = allEntries[d]?.nutrition;
    return n && (Number(n.calories) > 0);
  });
  if (nutritionDays.length >= 7) {
    const avgCal = nutritionDays.reduce((s, d) => s + Number(allEntries[d].nutrition.calories), 0) / nutritionDays.length;
    const avgProtein = nutritionDays.reduce((s, d) => s + (Number(allEntries[d].nutrition.protein) || 0), 0) / nutritionDays.length;

    if (avgProtein < 100) {
      insights.push({ emoji: "🥩", text: `Average protein is ${Math.round(avgProtein)}g/day. Aim for 120-150g for muscle maintenance.`, type: "action" });
    }
    if (avgCal > 0) {
      insights.push({ emoji: "🍽️", text: `You're averaging ${Math.round(avgCal)} calories/day over the last ${nutritionDays.length} tracked days.`, type: "pattern" });
    }
  }

  // ── Consistency Score ──
  if (last30.length >= 14) {
    const activeDays = last30.filter(d => {
      const e = allEntries[d];
      if (!e) return false;
      let signals = 0;
      if (e.goal) signals++;
      if (e.grateful) signals++;
      if (e.habits && habits) {
        const done = habits.filter(h => e.habits[h]).length;
        if (done > habits.length * 0.5) signals++;
      }
      if (e.rating) signals++;
      return signals >= 2;
    });
    const consistency = Math.round((activeDays.length / last30.length) * 100);
    if (consistency >= 80) {
      insights.push({ emoji: "🔥", text: `${consistency}% consistency over the last ${last30.length} days — elite level discipline!`, type: "good" });
    } else if (consistency >= 50) {
      insights.push({ emoji: "💪", text: `${consistency}% active days this month. Push for 80% next week!`, type: "action" });
    }
  }

  // ── Weight Trend ──
  const weightDays = last30.filter(d => allEntries[d]?.weightAm);
  if (weightDays.length >= 5) {
    const first = Number(allEntries[weightDays[0]].weightAm);
    const last = Number(allEntries[weightDays[weightDays.length - 1]].weightAm);
    const diff = last - first;
    if (Math.abs(diff) >= 1) {
      const direction = diff < 0 ? "lost" : "gained";
      insights.push({ emoji: "⚖️", text: `You've ${direction} ${Math.abs(diff).toFixed(1)} lbs over the last ${weightDays.length} weigh-ins.`, type: "pattern" });
    }
  }

  // Limit to top 5 most useful insights
  return insights.slice(0, 5);
}
