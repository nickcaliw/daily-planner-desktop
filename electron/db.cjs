const path = require("path");
const Database = require("better-sqlite3");
const { app } = require("electron");

let db;

function initDb() {
  if (db) return db;

  const userData = app.getPath("userData");
  const file = path.join(userData, "daily-planner.sqlite");

  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal (
      date TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      mood TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      week_start TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS body_stats (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      month TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Knowledge Vault
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'general',
      data_json TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_knowledge_cat ON knowledge(category);`);

  // Focus Timer sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_focus_date ON focus_sessions(date);`);

  // Sleep logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS sleep_logs (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Vision board items
  db.exec(`
    CREATE TABLE IF NOT EXISTS vision_items (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Water intake
  db.exec(`
    CREATE TABLE IF NOT EXISTS water_logs (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Meditation logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS meditation_logs (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Personal scoreboard
  db.exec(`
    CREATE TABLE IF NOT EXISTS scoreboard (
      week TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Affirmations
  db.exec(`
    CREATE TABLE IF NOT EXISTS affirmations (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Supplements
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplement_logs (
      date TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Saved meals
  db.exec(`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Days Since tracker
  db.exec(`
    CREATE TABLE IF NOT EXISTS days_since (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Life Areas weekly logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS life_areas_logs (
      week_start TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Future Self Letters
  db.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Generic collections (people, networking, date ideas, gift ideas, relationships)
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(collection);`);

  // App settings (theme, notifications, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

// --- App Settings ---
function getSetting(key) {
  const d = initDb();
  const row = d.prepare("SELECT value FROM app_settings WHERE key = ?").get(key);
  return row ? row.value : null;
}
function setSetting(key, value) {
  const d = initDb();
  d.prepare(`INSERT INTO app_settings (key, value) VALUES (?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(key, value);
  return { ok: true };
}

// --- Meals ---
function getMeals() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM meals ORDER BY updated_at DESC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertMeal(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO meals (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteMeal(id) {
  initDb().prepare("DELETE FROM meals WHERE id = ?").run(id);
  return { ok: true };
}

// --- Export all data ---
function exportAllData() {
  const d = initDb();
  const tables = d.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const data = {};
  for (const { name } of tables) {
    data[name] = d.prepare(`SELECT * FROM "${name}"`).all();
  }
  data._exportedAt = new Date().toISOString();
  return data;
}
function importAllData(data) {
  const d = initDb();
  const tables = d.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  for (const table of tables) {
    if (!data[table] || !Array.isArray(data[table]) || data[table].length === 0) continue;
    const cols = Object.keys(data[table][0]);
    const placeholders = cols.map(() => "?").join(",");
    const insert = d.prepare(`INSERT OR REPLACE INTO "${table}" (${cols.join(",")}) VALUES (${placeholders})`);
    const tx = d.transaction((rows) => {
      for (const row of rows) {
        insert.run(...cols.map(c => row[c]));
      }
    });
    tx(data[table]);
  }
  return { ok: true };
}

// --- Global Search ---
function globalSearch(query) {
  const d = initDb();
  const pattern = `%${query}%`;
  const results = [];

  // Search planner entries
  const entries = d.prepare("SELECT date, data_json FROM entries WHERE data_json LIKE ?").all(pattern);
  for (const r of entries) {
    results.push({ type: "planner", date: r.date, data: JSON.parse(r.data_json) });
  }

  // Search journal
  const journals = d.prepare("SELECT date, content FROM journal WHERE content LIKE ?").all(pattern);
  for (const r of journals) {
    results.push({ type: "journal", date: r.date, preview: r.content.slice(0, 150) });
  }

  // Search knowledge vault
  const knowledge = d.prepare("SELECT id, category, data_json FROM knowledge WHERE data_json LIKE ?").all(pattern);
  for (const r of knowledge) {
    results.push({ type: "knowledge", id: r.id, category: r.category, data: JSON.parse(r.data_json) });
  }

  // Search goals
  const goals = d.prepare("SELECT id, data_json FROM goals WHERE data_json LIKE ?").all(pattern);
  for (const r of goals) {
    results.push({ type: "goal", id: r.id, data: JSON.parse(r.data_json) });
  }

  // Search notes
  const notes = d.prepare("SELECT id, title, content FROM notes WHERE title LIKE ? OR content LIKE ?").all(pattern, pattern);
  for (const r of notes) {
    results.push({ type: "note", id: r.id, title: r.title, preview: r.content.slice(0, 150) });
  }

  return results;
}

function getEntry(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM entries WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}

function upsertEntry(date, data) {
  const d = initDb();
  d.prepare(`
    INSERT INTO entries (date, data_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      data_json=excluded.data_json,
      updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());

  return { ok: true };
}

function getRange(startDate, endDate) {
  const d = initDb();
  const rows = d
    .prepare("SELECT date, data_json FROM entries WHERE date >= ? AND date <= ?")
    .all(startDate, endDate);
  const result = {};
  for (const row of rows) {
    result[row.date] = JSON.parse(row.data_json);
  }
  return result;
}

function getAllEntries() {
  const d = initDb();
  const rows = d.prepare("SELECT date, data_json FROM entries").all();
  const result = {};
  for (const row of rows) {
    result[row.date] = JSON.parse(row.data_json);
  }
  return result;
}

function getWorkoutLog(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM workout_logs WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}

function upsertWorkoutLog(date, data) {
  const d = initDb();
  d.prepare(`
    INSERT INTO workout_logs (date, data_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      data_json=excluded.data_json,
      updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}

function getWorkoutLogsRange(startDate, endDate) {
  const d = initDb();
  const rows = d
    .prepare("SELECT date, data_json FROM workout_logs WHERE date >= ? AND date <= ?")
    .all(startDate, endDate);
  const result = {};
  for (const row of rows) {
    result[row.date] = JSON.parse(row.data_json);
  }
  return result;
}

function getWorkoutLogDates() {
  const d = initDb();
  return d.prepare("SELECT date FROM workout_logs").all().map(r => r.date);
}

// --- Journal ---
function getJournalEntry(date) {
  const d = initDb();
  const row = d.prepare("SELECT content, mood FROM journal WHERE date = ?").get(date);
  return row || null;
}

function upsertJournalEntry(date, content, mood) {
  const d = initDb();
  d.prepare(`
    INSERT INTO journal (date, content, mood, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      content=excluded.content, mood=excluded.mood, updated_at=excluded.updated_at
  `).run(date, content, mood, new Date().toISOString());
  return { ok: true };
}

function getJournalList() {
  const d = initDb();
  return d.prepare("SELECT date, substr(content,1,120) as preview, mood FROM journal WHERE content != '' ORDER BY date DESC").all();
}

// --- Notes ---
function getNote(id) {
  const d = initDb();
  return d.prepare("SELECT * FROM notes WHERE id = ?").get(id) || null;
}

function upsertNote(id, title, content) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`
    INSERT INTO notes (id, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, content=excluded.content, updated_at=excluded.updated_at
  `).run(id, title, content, now, now);
  return { ok: true };
}

function deleteNote(id) {
  const d = initDb();
  d.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return { ok: true };
}

function getNotesList() {
  const d = initDb();
  return d.prepare("SELECT id, title, substr(content,1,100) as preview, updated_at FROM notes ORDER BY updated_at DESC").all();
}

// --- Goals ---
function getGoals() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM goals ORDER BY updated_at DESC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertGoal(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO goals (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteGoal(id) {
  initDb().prepare("DELETE FROM goals WHERE id = ?").run(id);
  return { ok: true };
}

// --- Weekly Reviews ---
function getWeeklyReview(weekStart) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM weekly_reviews WHERE week_start = ?").get(weekStart);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertWeeklyReview(weekStart, data) {
  const d = initDb();
  d.prepare(`INSERT INTO weekly_reviews (week_start, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(week_start) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(weekStart, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}

// --- Books ---
function getBooks() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM books ORDER BY updated_at DESC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertBook(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO books (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteBook(id) {
  initDb().prepare("DELETE FROM books WHERE id = ?").run(id);
  return { ok: true };
}

// --- Body Stats ---
function getBodyStat(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM body_stats WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertBodyStat(date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO body_stats (date, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(date) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getBodyStatsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM body_stats WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}
function getAllBodyStats() {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM body_stats ORDER BY date ASC").all()
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}

// --- Budgets ---
function getBudget(month) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM budgets WHERE month = ?").get(month);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertBudget(month, data) {
  const d = initDb();
  d.prepare(`INSERT INTO budgets (month, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(month) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(month, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}

// --- Focus Sessions ---
function addFocusSession(id, date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO focus_sessions (id, date, data_json, updated_at) VALUES (?,?,?,?)
  `).run(id, date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getFocusSessionsByDate(date) {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM focus_sessions WHERE date = ? ORDER BY updated_at ASC").all(date)
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function getFocusSessionsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT id, date, data_json FROM focus_sessions WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ id: r.id, date: r.date, ...JSON.parse(r.data_json) }));
}
function deleteFocusSession(id) {
  initDb().prepare("DELETE FROM focus_sessions WHERE id = ?").run(id);
  return { ok: true };
}

// --- Sleep Logs ---
function getSleepLog(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM sleep_logs WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertSleepLog(date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO sleep_logs (date, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(date) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getSleepLogsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM sleep_logs WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}

// --- Vision Board ---
function getVisionItems() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM vision_items ORDER BY updated_at ASC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertVisionItem(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO vision_items (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteVisionItem(id) {
  initDb().prepare("DELETE FROM vision_items WHERE id = ?").run(id);
  return { ok: true };
}

// --- Water Intake ---
function getWaterLog(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM water_logs WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertWaterLog(date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO water_logs (date, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(date) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getWaterLogsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM water_logs WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}

// --- Meditation ---
function getMeditationLog(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM meditation_logs WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertMeditationLog(date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO meditation_logs (date, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(date) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getMeditationLogsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM meditation_logs WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}

// --- Scoreboard ---
function getScoreboard(week) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM scoreboard WHERE week = ?").get(week);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertScoreboard(week, data) {
  const d = initDb();
  d.prepare(`INSERT INTO scoreboard (week, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(week) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(week, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getAllScoreboards() {
  const d = initDb();
  return d.prepare("SELECT week, data_json FROM scoreboard ORDER BY week DESC").all()
    .map(r => ({ week: r.week, ...JSON.parse(r.data_json) }));
}

// --- Affirmations ---
function getAffirmations() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM affirmations ORDER BY updated_at ASC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertAffirmation(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO affirmations (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteAffirmation(id) {
  initDb().prepare("DELETE FROM affirmations WHERE id = ?").run(id);
  return { ok: true };
}

// --- Supplements ---
function getSupplements() {
  const d = initDb();
  return d.prepare("SELECT id, data_json FROM supplements ORDER BY updated_at ASC").all()
    .map(r => ({ id: r.id, ...JSON.parse(r.data_json) }));
}
function upsertSupplement(id, data) {
  const d = initDb();
  d.prepare(`INSERT INTO supplements (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function deleteSupplement(id) {
  initDb().prepare("DELETE FROM supplements WHERE id = ?").run(id);
  return { ok: true };
}
function getSupplementLog(date) {
  const d = initDb();
  const row = d.prepare("SELECT data_json FROM supplement_logs WHERE date = ?").get(date);
  return row ? JSON.parse(row.data_json) : null;
}
function upsertSupplementLog(date, data) {
  const d = initDb();
  d.prepare(`INSERT INTO supplement_logs (date, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(date) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(date, JSON.stringify(data), new Date().toISOString());
  return { ok: true };
}
function getSupplementLogsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT date, data_json FROM supplement_logs WHERE date >= ? AND date <= ? ORDER BY date ASC").all(start, end)
    .map(r => ({ date: r.date, ...JSON.parse(r.data_json) }));
}

// --- Knowledge Vault ---
function getKnowledgeEntries() {
  const d = initDb();
  return d.prepare("SELECT id, category, data_json, pinned, created_at, updated_at FROM knowledge ORDER BY pinned DESC, updated_at DESC").all()
    .map(r => ({ id: r.id, category: r.category, pinned: !!r.pinned, created_at: r.created_at, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}
function getKnowledgeEntry(id) {
  const d = initDb();
  const row = d.prepare("SELECT id, category, data_json, pinned, created_at, updated_at FROM knowledge WHERE id = ?").get(id);
  if (!row) return null;
  return { id: row.id, category: row.category, pinned: !!row.pinned, created_at: row.created_at, updated_at: row.updated_at, ...JSON.parse(row.data_json) };
}
function upsertKnowledgeEntry(id, category, data, pinned) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO knowledge (id, category, data_json, pinned, created_at, updated_at) VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET category=excluded.category, data_json=excluded.data_json, pinned=excluded.pinned, updated_at=excluded.updated_at
  `).run(id, category, JSON.stringify(data), pinned ? 1 : 0, now, now);
  return { ok: true };
}
function deleteKnowledgeEntry(id) {
  initDb().prepare("DELETE FROM knowledge WHERE id = ?").run(id);
  return { ok: true };
}
// Days Since
function getDaysSinceItems() {
  const d = initDb();
  return d.prepare("SELECT id, data_json, updated_at FROM days_since ORDER BY updated_at DESC").all()
    .map(r => ({ id: r.id, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}
function upsertDaysSince(id, data) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO days_since (id, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), now);
  return { ok: true };
}
function deleteDaysSince(id) {
  initDb().prepare("DELETE FROM days_since WHERE id = ?").run(id);
  return { ok: true };
}

// Projects
function getProjects() {
  const d = initDb();
  return d.prepare("SELECT id, data_json, created_at, updated_at FROM projects ORDER BY updated_at DESC").all()
    .map(r => ({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}
function upsertProject(id, data) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO projects (id, data_json, created_at, updated_at) VALUES (?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), now, now);
  return { ok: true };
}
function deleteProject(id) {
  initDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return { ok: true };
}

// Life Areas Logs
function getLifeAreasLog(weekStart) {
  const d = initDb();
  const row = d.prepare("SELECT week_start, data_json, updated_at FROM life_areas_logs WHERE week_start = ?").get(weekStart);
  if (!row) return null;
  return { week_start: row.week_start, updated_at: row.updated_at, ...JSON.parse(row.data_json) };
}
function upsertLifeAreasLog(weekStart, data) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO life_areas_logs (week_start, data_json, updated_at) VALUES (?,?,?)
    ON CONFLICT(week_start) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(weekStart, JSON.stringify(data), now);
  return { ok: true };
}
function getLifeAreasLogsRange(start, end) {
  const d = initDb();
  return d.prepare("SELECT week_start, data_json, updated_at FROM life_areas_logs WHERE week_start >= ? AND week_start <= ? ORDER BY week_start DESC").all(start, end)
    .map(r => ({ week_start: r.week_start, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}

// Future Self Letters
function getLetters() {
  const d = initDb();
  return d.prepare("SELECT id, data_json, created_at, updated_at FROM letters ORDER BY created_at DESC").all()
    .map(r => ({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}
function getLetter(id) {
  const d = initDb();
  const row = d.prepare("SELECT id, data_json, created_at, updated_at FROM letters WHERE id = ?").get(id);
  if (!row) return null;
  return { id: row.id, created_at: row.created_at, updated_at: row.updated_at, ...JSON.parse(row.data_json) };
}
function upsertLetter(id, data) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO letters (id, data_json, created_at, updated_at) VALUES (?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, JSON.stringify(data), now, now);
  return { ok: true };
}
function deleteLetter(id) {
  initDb().prepare("DELETE FROM letters WHERE id = ?").run(id);
  return { ok: true };
}

// --- Generic Collections ---
function getCollectionItems(collection) {
  const d = initDb();
  return d.prepare("SELECT id, data_json, created_at, updated_at FROM collections WHERE collection = ? ORDER BY updated_at DESC").all(collection)
    .map(r => ({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}
function upsertCollectionItem(id, collection, data) {
  const d = initDb();
  const now = new Date().toISOString();
  d.prepare(`INSERT INTO collections (id, collection, data_json, created_at, updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
  `).run(id, collection, JSON.stringify(data), now, now);
  return { ok: true };
}
function deleteCollectionItem(id) {
  initDb().prepare("DELETE FROM collections WHERE id = ?").run(id);
  return { ok: true };
}

function searchKnowledge(query) {
  const d = initDb();
  const pattern = `%${query}%`;
  return d.prepare("SELECT id, category, data_json, pinned, created_at, updated_at FROM knowledge WHERE data_json LIKE ? ORDER BY pinned DESC, updated_at DESC").all(pattern)
    .map(r => ({ id: r.id, category: r.category, pinned: !!r.pinned, created_at: r.created_at, updated_at: r.updated_at, ...JSON.parse(r.data_json) }));
}

module.exports = {
  initDb, getEntry, upsertEntry, getRange, getAllEntries,
  getWorkoutLog, upsertWorkoutLog, getWorkoutLogsRange, getWorkoutLogDates,
  getJournalEntry, upsertJournalEntry, getJournalList,
  getNote, upsertNote, deleteNote, getNotesList,
  getGoals, upsertGoal, deleteGoal,
  getWeeklyReview, upsertWeeklyReview,
  getBooks, upsertBook, deleteBook,
  getBodyStat, upsertBodyStat, getBodyStatsRange, getAllBodyStats,
  getBudget, upsertBudget,
  addFocusSession, getFocusSessionsByDate, getFocusSessionsRange, deleteFocusSession,
  getSleepLog, upsertSleepLog, getSleepLogsRange,
  getVisionItems, upsertVisionItem, deleteVisionItem,
  getWaterLog, upsertWaterLog, getWaterLogsRange,
  getMeditationLog, upsertMeditationLog, getMeditationLogsRange,
  getScoreboard, upsertScoreboard, getAllScoreboards,
  getAffirmations, upsertAffirmation, deleteAffirmation,
  getSupplements, upsertSupplement, deleteSupplement, getSupplementLog, upsertSupplementLog, getSupplementLogsRange,
  getKnowledgeEntries, getKnowledgeEntry, upsertKnowledgeEntry, deleteKnowledgeEntry, searchKnowledge,
  getDaysSinceItems, upsertDaysSince, deleteDaysSince,
  getProjects, upsertProject, deleteProject,
  getLifeAreasLog, upsertLifeAreasLog, getLifeAreasLogsRange,
  getLetters, getLetter, upsertLetter, deleteLetter,
  getSetting, setSetting,
  getMeals, upsertMeal, deleteMeal,
  exportAllData, importAllData,
  getCollectionItems, upsertCollectionItem, deleteCollectionItem,
  globalSearch,
};
