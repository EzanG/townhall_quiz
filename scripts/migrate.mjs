/**
 * 初始化 SQLite 表结构；与 `src/lib/db.ts` 中的 PRAGMA / ALTER 增量列配合使用。
 */
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "quiz.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY,
    phase TEXT NOT NULL DEFAULT 'lobby',
    timer_sec INTEGER NOT NULL DEFAULT 30,
    current_q INTEGER NOT NULL DEFAULT 0,
    countdown_end TEXT
  );

  CREATE TABLE IF NOT EXISTS player (
    seat_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    employee_id TEXT,
    correct_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'live',
    token TEXT NOT NULL UNIQUE,
    submitted_this_round INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
  );
`);

const row = db.prepare("SELECT id FROM game WHERE id = 1").get();
if (!row) {
  db.prepare(
    "INSERT INTO game (id, phase, timer_sec, current_q) VALUES (1, 'lobby', 30, 0)"
  ).run();
}

function hasColumn(table, name) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === name);
}
if (!hasColumn("player", "total_correct_time_ms")) {
  db.exec(
    "ALTER TABLE player ADD COLUMN total_correct_time_ms INTEGER NOT NULL DEFAULT 0"
  );
}
if (!hasColumn("game", "opened_at")) {
  db.exec("ALTER TABLE game ADD COLUMN opened_at TEXT");
}

db.close();
console.log(`Database ready at ${dbPath}`);
