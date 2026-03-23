export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeekMonday(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatRange(monday) {
  const sun = addDays(monday, 6);
  const left = monday.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const right = sun.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${left} — ${right}`;
}

export function isoWeekYear(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const weekYear = date.getFullYear();
  const jan4 = new Date(weekYear, 0, 4);
  jan4.setDate(jan4.getDate() + 3 - ((jan4.getDay() + 6) % 7));
  const diffDays = Math.round((date - jan4) / 86400000);
  const weekNumber = 1 + Math.floor(diffDays / 7);
  return { weekNumber, weekYear };
}
