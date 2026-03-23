import { useState } from "react";
import { HABITS as DEFAULT_HABITS } from "../lib/constants.js";

const settingsApi = typeof window !== "undefined" ? window.settingsApi : null;

const STARTER_HABITS = [
  "Morning Routine",
  "Exercise / Workout",
  "Drink 8 Glasses of Water",
  "Meditation / Breathwork",
  "Read for 30 Minutes",
  "Healthy Eating",
  "Journal / Reflection",
  "No Social Media Before Noon",
  "8 Hours of Sleep",
  "Take Supplements / Vitamins",
  "Deep Work Session",
  "Gratitude Practice",
  "Cold Shower",
  "Sunlight Exposure (15 min)",
  "Daily Planning",
  "Stretch / Mobility",
  "No Alcohol",
  "Learn Something New",
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedHabits, setSelectedHabits] = useState(new Set());
  const [customHabit, setCustomHabit] = useState("");

  const toggleHabit = (h) => {
    setSelectedHabits(prev => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });
  };

  const addCustom = () => {
    if (!customHabit.trim()) return;
    setSelectedHabits(prev => new Set([...prev, customHabit.trim()]));
    setCustomHabit("");
  };

  const finish = async () => {
    if (settingsApi) {
      if (name.trim()) await settingsApi.set("user_name", name.trim());
      const habits = selectedHabits.size > 0 ? [...selectedHabits] : DEFAULT_HABITS;
      await settingsApi.set("custom_habits", JSON.stringify(habits));
      await settingsApi.set("onboarding_complete", "true");
    }
    onComplete();
  };

  return (
    <div className="obOverlay">
      <div className="obCard">
        {step === 0 && (
          <div className="obStep">
            <div className="obEmoji">👋</div>
            <h1 className="obTitle">Welcome to Daily Planner</h1>
            <p className="obDesc">
              Your all-in-one productivity hub for habits, goals, health tracking, and daily planning.
            </p>
            <p className="obDesc">Let's get you set up in 30 seconds.</p>
            <button className="btn btnPrimary obBtn" onClick={() => setStep(1)} type="button">
              Get Started
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="obStep">
            <div className="obEmoji">🙂</div>
            <h1 className="obTitle">What's your name?</h1>
            <p className="obDesc">We'll use this to personalize your dashboard.</p>
            <input
              className="obInput"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStep(2); }}
              autoFocus
            />
            <div className="obActions">
              <button className="btn" onClick={() => setStep(0)} type="button">Back</button>
              <button className="btn btnPrimary obBtn" onClick={() => setStep(2)} type="button">
                {name.trim() ? "Next" : "Skip"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="obStep">
            <div className="obEmoji">✅</div>
            <h1 className="obTitle">Pick your daily habits</h1>
            <p className="obDesc">
              Select the habits you want to track. You can always change these later in Settings.
            </p>
            <div className="obHabitGrid">
              {STARTER_HABITS.map(h => (
                <button
                  key={h}
                  className={`obHabitChip ${selectedHabits.has(h) ? "obHabitChipActive" : ""}`}
                  onClick={() => toggleHabit(h)}
                  type="button"
                >
                  {selectedHabits.has(h) ? "✓ " : ""}{h}
                </button>
              ))}
              {[...selectedHabits].filter(h => !STARTER_HABITS.includes(h)).map(h => (
                <button
                  key={h}
                  className="obHabitChip obHabitChipActive obHabitChipCustom"
                  onClick={() => toggleHabit(h)}
                  type="button"
                >
                  ✓ {h}
                </button>
              ))}
            </div>
            <div className="obCustomHabit">
              <input
                className="obInput obInputSmall"
                placeholder="Add your own habit..."
                value={customHabit}
                onChange={e => setCustomHabit(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addCustom(); }}
              />
              <button className="btn" onClick={addCustom} type="button">Add</button>
            </div>
            <div className="obSelected">{selectedHabits.size} habits selected</div>
            <div className="obActions">
              <button className="btn" onClick={() => setStep(1)} type="button">Back</button>
              <button className="btn btnPrimary obBtn" onClick={finish} type="button">
                {selectedHabits.size > 0 ? "Finish Setup" : "Use Defaults"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
