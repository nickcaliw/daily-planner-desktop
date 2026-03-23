export const HABITS = [
  "Sleep Hygiene [7-8]",
  "Hydration | Wellness Shot",
  "Fasted Aerobic Exercise",
  "Sunlight Exposure",
  "Meditation | Breath Work",
  "Cold Exposure | Face Care",
  "Day Planning | Task Managing",
  "Daily Devotion | Self-Reflection",
  "Deep Work [$$]",
  "Creatine | Supplements",
  "Strength Training | Hevy Tracking",
  "Macro Goals | MyFP Tracking",
  "Daily Weigh In",
  "Reading [30 mins]",
  "Dopamine Control",
];

export const HOURS = [
  "7AM","8AM","9AM","10AM","11AM","12PM",
  "1PM","2PM","3PM","4PM","5PM","6PM",
  "7PM","8PM","9PM","10PM","11PM","12AM",
];

export function defaultEntry(dateStr) {
  return {
    date: dateStr,
    tab: "planner",
    grateful: "",
    feel: "",
    goal: "",
    agenda: HOURS.reduce((acc, h) => ((acc[h] = ""), acc), {}),
    top3: ["", "", ""],
    notes: "",
    wins: ["", "", ""],
    rating: 3,
    habits: HABITS.reduce((acc, h) => ((acc[h] = false), acc), {}),
    nutrition: { calories: "", protein: "", carbs: "", fat: "" },
    weightAm: "",
    weightPm: "",
    journal: "",
  };
}
