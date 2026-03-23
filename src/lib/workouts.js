/**
 * Aesthetic Hypertrophy Program
 * 6 days/week, each muscle 2x weekly
 * Mapped: Mon=Day1, Tue=Day2, ... Sun=Day7
 */

export const PROGRAM_NAME = "Aesthetic Hypertrophy Program";
export const PROGRAM_GOAL = "Build Mass While Reaching Sub-12% Body Fat";

// dayOfWeek: 1=Mon ... 7=Sun (matches JS getDay() remapped)
export const WORKOUT_DAYS = [
  {
    dayOfWeek: 1,
    label: "Day 1",
    title: "Push",
    subtitle: "Upper Chest Focus",
    notes: "Only final isolation set to failure.",
    exercises: [
      { name: "Incline Bench Press (Barbell)", sets: 4, reps: "6–8" },
      { name: "Bench Press (Dumbbell)", sets: 3, reps: "8–10" },
      { name: "Cable Fly Crossovers", sets: 3, reps: "12–15" },
      { name: "Overhead Press (Dumbbell)", sets: 3, reps: "8–10" },
      { name: "Lateral Raise (Dumbbell)", sets: 4, reps: "15–20" },
      { name: "Triceps Pushdown", sets: 3, reps: "10–15" },
    ],
  },
  {
    dayOfWeek: 2,
    label: "Day 2",
    title: "Pull",
    subtitle: "Lat Width",
    notes: "Drive elbows down, full lat stretch.",
    exercises: [
      { name: "Pull Up", sets: 4, reps: "6–10" },
      { name: "Lat Pulldown (Cable)", sets: 3, reps: "8–12" },
      { name: "Iso-Lateral Row (Machine)", sets: 3, reps: "8–12" },
      { name: "Dumbbell Row", sets: 3, reps: "10 each side" },
      { name: "Hammer Curl (Dumbbell)", sets: 3, reps: "10–12" },
      { name: "Bicep Curl (Dumbbell)", sets: 3, reps: "12–15" },
    ],
  },
  {
    dayOfWeek: 3,
    label: "Day 3",
    title: "Legs",
    subtitle: "Quad Dominant",
    notes: "Slow controlled eccentrics.",
    exercises: [
      { name: "Squat (Barbell)", sets: 4, reps: "6–8" },
      { name: "Leg Press (Machine)", sets: 3, reps: "10–12" },
      { name: "Leg Extension (Machine)", sets: 4, reps: "12–15" },
      { name: "Romanian Deadlift (Barbell)", sets: 3, reps: "8–10" },
      { name: "Standing Calf Raise", sets: 4, reps: "12–20" },
    ],
  },
  {
    dayOfWeek: 4,
    label: "Day 4",
    title: "Rest",
    subtitle: "Recovery",
    notes: "20–30 min LISS cardio (incline treadmill, Zone 2) optional.",
    exercises: [],
  },
  {
    dayOfWeek: 5,
    label: "Day 5",
    title: "Push",
    subtitle: "Shoulder Dominant",
    notes: "Maximum lateral delt tension.",
    exercises: [
      { name: "Overhead Press (Barbell)", sets: 4, reps: "6–8" },
      { name: "Incline Bench Press (Dumbbell)", sets: 3, reps: "8–10" },
      { name: "Chest Press (Machine)", sets: 3, reps: "10–12" },
      { name: "Lateral Raise (Machine)", sets: 4, reps: "15–20" },
      { name: "Single Arm Lateral Raise (Cable)", sets: 3, reps: "15–20" },
      { name: "Triceps Rope Pushdown", sets: 3, reps: "12–15" },
    ],
  },
  {
    dayOfWeek: 6,
    label: "Day 6",
    title: "Pull",
    subtitle: "Thickness + Arms",
    notes: "Slow negatives. Controlled form.",
    exercises: [
      { name: "Bent Over Row (Barbell)", sets: 4, reps: "6–8" },
      { name: "Seated Row (Machine)", sets: 3, reps: "8–12" },
      { name: "Lat Pulldown (Machine)", sets: 3, reps: "10–12" },
      { name: "Bicep Curl (Barbell)", sets: 3, reps: "8–10" },
      { name: "Concentration Curl", sets: 3, reps: "12–15" },
    ],
  },
  {
    dayOfWeek: 7,
    label: "Day 7",
    title: "Legs",
    subtitle: "Hamstring / Glute Focus",
    notes: "Full hamstring stretch on every rep.",
    exercises: [
      { name: "Romanian Deadlift (Dumbbell)", sets: 4, reps: "8–10" },
      { name: "Seated Leg Curl (Machine)", sets: 4, reps: "10–15" },
      { name: "Hip Thrust (Barbell)", sets: 3, reps: "8–12" },
      { name: "Lunge (Dumbbell)", sets: 3, reps: "10 each leg" },
      { name: "Seated Calf Raise", sets: 4, reps: "12–20" },
    ],
  },
];

export const VOLUME_TARGETS = {
  Chest: "14–16 sets",
  Back: "18–20 sets",
  Quads: "14–16 sets",
  Hamstrings: "12–15 sets",
  "Lateral Delts": "18–22 sets",
  Arms: "14–18 sets",
};

/**
 * Get the workout template for a given date.
 * Monday=1 ... Sunday=7
 */
export function getWorkoutForDate(date) {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon...
  const dow = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun
  return WORKOUT_DAYS.find((w) => w.dayOfWeek === dow) || null;
}

/**
 * Create empty log structure for a workout template.
 * Each exercise gets an array of { weight: "", reps: "" } per target set.
 */
export function createEmptyLog(template) {
  if (!template || !template.exercises.length) return null;
  return {
    completed: false,
    exercises: template.exercises.map((ex) => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" })),
    })),
  };
}
