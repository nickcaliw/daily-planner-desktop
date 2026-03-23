import { useMemo, useState } from "react";
import { ymd, addDays, startOfWeekMonday } from "../lib/dates.js";

/**
 * Toggle between Weekly and Monthly views
 */
export function ChartToggle({ view, onChange }) {
  return (
    <div className="waterChartToggle">
      <button
        className={`waterChartToggleBtn ${view === "week" ? "waterChartToggleActive" : ""}`}
        onClick={() => onChange("week")}
        type="button"
      >Weekly</button>
      <button
        className={`waterChartToggleBtn ${view === "month" ? "waterChartToggleActive" : ""}`}
        onClick={() => onChange("month")}
        type="button"
      >Monthly</button>
    </div>
  );
}

/**
 * A navigable month calendar grid.
 * Props:
 * - monthDate: Date (first of month)
 * - onMonthChange: (newMonthDate) => void
 * - today: Date
 * - selectedDate: string (YYYY-MM-DD) or null
 * - onSelectDate: (dateStr) => void or null
 * - renderCell: (day) => ReactNode  -- day has { key, day, isFuture, isToday, isSelected }
 * - stats: ReactNode (optional, rendered above grid)
 * - legend: ReactNode (optional, rendered below grid)
 */
export function MonthGrid({ monthDate, onMonthChange, today, selectedDate, onSelectDate, renderCell, stats, legend }) {
  const todayStr = ymd(today);

  const canNextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1) <= today;

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const startPad = firstDow === 0 ? 6 : firstDow - 1; // Mon-based

    const result = [];
    for (let i = 0; i < startPad; i++) result.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = ymd(date);
      result.push({
        key,
        day: d,
        date,
        isFuture: date > today,
        isToday: key === todayStr,
        isSelected: key === selectedDate,
      });
    }
    return result;
  }, [monthDate, today, todayStr, selectedDate]);

  const prevMonth = () => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  const nextMonth = () => {
    if (canNextMonth) onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  };

  return (
    <div className="waterMonthChart">
      <div className="waterChartHeader">
        <button className="waterChartNavBtn" onClick={prevMonth} type="button">&lsaquo;</button>
        <div className="waterWeekTitle">{monthLabel}</div>
        <button className="waterChartNavBtn" onClick={nextMonth} disabled={!canNextMonth} type="button">&rsaquo;</button>
      </div>

      {stats}

      <div className="waterMonthGrid">
        <div className="waterMonthDow">Mon</div>
        <div className="waterMonthDow">Tue</div>
        <div className="waterMonthDow">Wed</div>
        <div className="waterMonthDow">Thu</div>
        <div className="waterMonthDow">Fri</div>
        <div className="waterMonthDow">Sat</div>
        <div className="waterMonthDow">Sun</div>
        {days.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="waterMonthCell waterMonthCellEmpty" />;
          return renderCell(day);
        })}
      </div>

      {legend}
    </div>
  );
}

/**
 * Navigable week bar chart.
 * Props:
 * - weekOffset: number
 * - onWeekOffsetChange: (newOffset) => void
 * - today: Date
 * - bars: array of { key, label, value, displayValue, pct, metGoal, isSelected, isFuture, extra }
 * - onBarClick: (key) => void or null
 * - legend: ReactNode (optional)
 */
export function WeekBarChart({ weekOffset, onWeekOffsetChange, today, bars, onBarClick, legend }) {
  const weekChartMonday = useMemo(() => {
    const base = startOfWeekMonday(today);
    return addDays(base, weekOffset * 7);
  }, [today, weekOffset]);

  const weekLabel = useMemo(() => {
    const sun = addDays(weekChartMonday, 6);
    const left = weekChartMonday.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const right = sun.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${left} - ${right}`;
  }, [weekChartMonday]);

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="waterWeekChart">
      <div className="waterChartHeader">
        <button className="waterChartNavBtn" onClick={() => onWeekOffsetChange(weekOffset - 1)} type="button">&lsaquo;</button>
        <div className="waterWeekTitle">{weekLabel}</div>
        <button className="waterChartNavBtn" onClick={() => onWeekOffsetChange(weekOffset + 1)} disabled={isCurrentWeek} type="button">&rsaquo;</button>
      </div>
      <div className="waterWeekBars">
        {bars.map(bar => (
          <div
            className={`waterWeekBarWrap ${bar.isSelected ? "waterWeekBarSelected" : ""} ${bar.isFuture ? "waterWeekBarFuture" : ""}`}
            key={bar.key}
            onClick={() => !bar.isFuture && onBarClick && onBarClick(bar.key)}
            style={{ cursor: bar.isFuture || !onBarClick ? "default" : "pointer" }}
          >
            <div className="waterWeekValue">{bar.isFuture ? "" : bar.displayValue}</div>
            <div
              className={`waterWeekBar ${bar.metGoal ? "waterWeekBarGoal" : "waterWeekBarPartial"}`}
              style={{ height: bar.isFuture ? "0%" : `${bar.pct}%` }}
            />
            {!bar.isFuture && bar.metGoal && <div className="waterWeekGoalCheck">&#10003;</div>}
            <div className="waterWeekLabel">{bar.label}</div>
            {bar.extra}
          </div>
        ))}
      </div>
      {legend}
    </div>
  );
}
