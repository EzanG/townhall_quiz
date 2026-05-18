import { readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

export type Question = {
  stem: string;
  options: Record<string, string>;
  correct: string;
};

const QUESTIONS_FILE = join(process.cwd(), "src", "data", "questions.json");

let cache: Question[] | null = null;
let cachedMtime = 0;

function loadFromDisk(): Question[] {
  const m = statSync(QUESTIONS_FILE).mtimeMs;
  if (cache && m === cachedMtime) return cache;
  const raw = readFileSync(QUESTIONS_FILE, "utf8");
  cache = JSON.parse(raw) as Question[];
  cachedMtime = m;
  return cache;
}

export function getQuestionsList(): Question[] {
  return loadFromDisk();
}

export function getQuestionCount(): number {
  return loadFromDisk().length;
}

export function getQuestion(index: number): Question | null {
  const questions = loadFromDisk();
  if (index < 1 || index > questions.length) return null;
  return questions[index - 1] ?? null;
}

export function writeQuestionsToDisk(questions: Question[]): void {
  writeFileSync(
    QUESTIONS_FILE,
    JSON.stringify(questions, null, 2) + "\n",
    "utf8"
  );
  cache = questions;
  cachedMtime = statSync(QUESTIONS_FILE).mtimeMs;
}

export function parseQuestionsJson(
  raw: string
): { ok: true; data: Question[] } | { ok: false; error: string } {
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!Array.isArray(arr) || arr.length === 0) {
    return { ok: false, error: "empty" };
  }
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "item" };
    }
    const q = item as Record<string, unknown>;
    if (typeof q.stem !== "string" || !q.stem.trim()) {
      return { ok: false, error: "stem" };
    }
    if (!q.options || typeof q.options !== "object" || Array.isArray(q.options)) {
      return { ok: false, error: "options" };
    }
    if (typeof q.correct !== "string") {
      return { ok: false, error: "correct" };
    }
    const opts = q.options as Record<string, unknown>;
    const keys = Object.keys(opts);
    if (keys.length < 2) {
      return { ok: false, error: "optionsCount" };
    }
    for (const k of keys) {
      if (typeof opts[k] !== "string") {
        return { ok: false, error: "optionValue" };
      }
    }
    const correctUp = q.correct.trim().toUpperCase();
    const keyUps = keys.map((k) => k.toUpperCase());
    if (!keyUps.includes(correctUp)) {
      return { ok: false, error: "correctKey" };
    }
  }
  return { ok: true, data: arr as Question[] };
}
