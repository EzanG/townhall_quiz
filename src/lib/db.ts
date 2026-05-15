import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

/** SQLite 文件路径；生产 Docker 下由环境变量 `DATABASE_PATH` 指向卷内路径 */
const dbPath =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "quiz.db");

mkdirSync(path.dirname(dbPath), { recursive: true });

export const sqlite = new DatabaseSync(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL");

function ensureSchemaColumns() {
  const playerCols = sqlite.prepare("PRAGMA table_info(player)").all() as {
    name: string;
  }[];
  if (!playerCols.some((c) => c.name === "total_correct_time_ms")) {
    sqlite.exec(
      "ALTER TABLE player ADD COLUMN total_correct_time_ms INTEGER NOT NULL DEFAULT 0"
    );
  }
  const gameCols = sqlite.prepare("PRAGMA table_info(game)").all() as {
    name: string;
  }[];
  if (!gameCols.some((c) => c.name === "opened_at")) {
    sqlite.exec("ALTER TABLE game ADD COLUMN opened_at TEXT");
  }
}
ensureSchemaColumns();

export function getDbPath() {
  return dbPath;
}
