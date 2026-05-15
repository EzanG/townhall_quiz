/**
 * 单机 SQLite 场次状态 + 玩家表；`setBroadcast` 由自定义 server 注入，用于 Socket 推送。
 */
import { v4 as uuidv4 } from "uuid";
import { zh } from "./zh";
import { sqlite } from "./db";
import { isAnswerPhase } from "./gamePhase";
import { getQuestion } from "./questions";
import type { GamePhase, GameRow, PlayerRow } from "./schema";

export type PlayerPublic = {
  seatId: string;
  name: string;
  employeeId: string | null;
  correctCount: number;
  status: string;
  submittedThisRound: boolean;
};

export type GamePublic = {
  phase: GamePhase;
  timerSec: number;
  currentQ: number;
  countdownEnd: string | null;
};

export type Stats = {
  loggedIn: number;
  alive: number;
  eliminated: number;
  submittedThisRound: number;
  maxCorrect: number;
  avgCorrect: number;
};

export type LeaderboardEntry = {
  rank: number;
  seatId: string;
  name: string;
  correctCount: number;
  /** Sum of ms from each round's answer window start until correct submit. */
  totalCorrectTimeMs: number;
};

export type AppState = {
  game: GamePublic;
  players: PlayerPublic[];
  stats: Stats;
  question: ReturnType<typeof getQuestion>;
  leaderboard: LeaderboardEntry[];
};

function getGameRow(): GameRow | undefined {
  return sqlite
    .prepare("SELECT * FROM game WHERE id = 1")
    .get() as GameRow | undefined;
}

/** 倒计时结束后自动进入 `open`；`opened_at` 在主持「开始作答」时已写入，此处不覆盖（用于累计答题耗时）。 */
function advanceCountdownIfExpired(): void {
  const g = getGameRow();
  if (!g || g.phase !== "countdown" || !g.countdown_end) return;
  if (new Date(g.countdown_end).getTime() > Date.now()) return;
  sqlite
    .prepare(
      "UPDATE game SET phase = 'open', countdown_end = NULL WHERE id = 1"
    )
    .run();
}

function getAllPlayers(): PlayerRow[] {
  return sqlite.prepare("SELECT * FROM player").all() as PlayerRow[];
}

function rowToPublic(r: PlayerRow): PlayerPublic {
  return {
    seatId: r.seat_id,
    name: r.name,
    employeeId: r.employee_id,
    correctCount: r.correct_count,
    status: r.status,
    submittedThisRound: r.submitted_this_round === 1,
  };
}

function computeStats(players: PlayerPublic[]): Stats {
  const loggedIn = players.length;
  const alive = players.filter((p) => p.status === "live").length;
  const eliminated = loggedIn - alive;
  const submittedThisRound = players.filter((p) => p.submittedThisRound).length;
  const counts = players.map((p) => p.correctCount);
  const maxCorrect = counts.length ? Math.max(...counts) : 0;
  const avgCorrect = counts.length
    ? counts.reduce((a, b) => a + b, 0) / counts.length
    : 0;

  return {
    loggedIn,
    alive,
    eliminated,
    submittedThisRound,
    maxCorrect,
    avgCorrect: Math.round(avgCorrect * 10) / 10,
  };
}

/** 答对数降序，同分按 `total_correct_time_ms` 升序（累计反应时间越短越靠前） */
function computeLeaderboard(): LeaderboardEntry[] {
  const rows = sqlite
    .prepare(
      `SELECT seat_id, name, correct_count,
              COALESCE(total_correct_time_ms, 0) AS t
       FROM player
       ORDER BY correct_count DESC, t ASC, seat_id ASC
       LIMIT 10`
    )
    .all() as { seat_id: string; name: string; correct_count: number; t: number }[];

  return rows.map((r, i) => ({
    rank: i + 1,
    seatId: r.seat_id,
    name: r.name,
    correctCount: r.correct_count,
    totalCorrectTimeMs: r.t,
  }));
}

/** 聚合大屏所需状态；每次读取前会先尝试把已结束的倒计时推进到 `open`。 */
export async function getAppState(): Promise<AppState> {
  advanceCountdownIfExpired();
  const g = getGameRow();
  const players = getAllPlayers().map(rowToPublic);

  const gamePublic: GamePublic = {
    phase: (g?.phase ?? "lobby") as GamePhase,
    timerSec: g?.timer_sec ?? 30,
    currentQ: g?.current_q ?? 0,
    countdownEnd: g?.countdown_end ?? null,
  };

  return {
    game: gamePublic,
    players,
    stats: computeStats(players),
    question:
      gamePublic.currentQ > 0 ? getQuestion(gamePublic.currentQ) : null,
    leaderboard: computeLeaderboard(),
  };
}

let broadcastFn: ((state: AppState) => void) | null = null;

export function setBroadcast(fn: (state: AppState) => void) {
  broadcastFn = fn;
}

async function broadcast() {
  if (broadcastFn) {
    broadcastFn(await getAppState());
  }
}

export async function login(params: {
  seatId: string;
  name: string;
  employeeId?: string;
}): Promise<{ token: string; seatId: string } | { error: string }> {
  const existing = sqlite
    .prepare("SELECT seat_id FROM player WHERE seat_id = ?")
    .get(params.seatId);
  if (existing) {
    return { error: zh.apiSeatTaken };
  }

  const token = uuidv4();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO player (seat_id, name, employee_id, correct_count, status, token, submitted_this_round, updated_at)
       VALUES (?, ?, ?, 0, 'live', ?, 0, ?)`
    )
    .run(
      params.seatId,
      params.name.trim(),
      params.employeeId?.trim() || null,
      token,
      now
    );

  await broadcast();
  return { token, seatId: params.seatId };
}

/**
 * 在 countdown / open 阶段各可提交一次。
 * 答对时把「主持点开始作答 → 此刻」的毫秒差累加到 `total_correct_time_ms`（排行榜同分比该累计值）。
 */
export async function submitAnswer(
  token: string,
  choice: string
): Promise<
  | { ok: true; correct: boolean; correctCount: number; eliminated: boolean }
  | { error: string }
> {
  const p = sqlite
    .prepare("SELECT * FROM player WHERE token = ?")
    .get(token) as PlayerRow | undefined;
  if (!p) return { error: zh.apiInvalidSession };
  if (p.status === "out") return { error: zh.apiEliminatedNoMore };

  const g = getGameRow();
  if (!g || !isAnswerPhase(g.phase)) {
    return { error: zh.apiCannotSubmit };
  }
  if (p.submitted_this_round === 1) return { error: zh.apiAlreadySubmitted };

  const q = getQuestion(g.current_q);
  if (!q) return { error: zh.apiNoQuestion };

  const correct = choice.toUpperCase() === q.correct.toUpperCase();
  const now = new Date().toISOString();

  const openedAt = g.opened_at;
  let deltaMs = 0;
  if (openedAt) {
    deltaMs = Math.max(0, Date.now() - new Date(openedAt).getTime());
  } else if (g.countdown_end && g.timer_sec) {
    /* 旧数据无 opened_at 时：用 countdown_end - timer_sec 近似本轮起点 */
    const windowStart =
      new Date(g.countdown_end).getTime() -
      Math.max(1, g.timer_sec) * 1000;
    deltaMs = Math.max(0, Date.now() - windowStart);
  }

  if (correct) {
    sqlite
      .prepare(
        `UPDATE player SET correct_count = ?, submitted_this_round = 1,
         total_correct_time_ms = COALESCE(total_correct_time_ms, 0) + ?,
         updated_at = ? WHERE token = ?`
      )
      .run(p.correct_count + 1, deltaMs, now, token);
  } else {
    sqlite
      .prepare(
        `UPDATE player SET status = 'out', submitted_this_round = 1, updated_at = ? WHERE token = ?`
      )
      .run(now, token);
  }

  await broadcast();

  return {
    ok: true,
    correct,
    correctCount: correct ? p.correct_count + 1 : p.correct_count,
    eliminated: !correct,
  };
}

function requireAdmin(adminKey: string | null): boolean {
  // Default: no strict check so local dev / rehearsal works without typing key.
  // Set ADMIN_STRICT=true and ADMIN_KEY in .env for production hardening.
  if (process.env.ADMIN_STRICT === "true") {
    const expected = process.env.ADMIN_KEY ?? "";
    if (!expected) return false;
    return adminKey === expected;
  }
  return true;
}

/** For API routes (questions, etc.). */
export function verifyAdminKey(adminKey: string | null): boolean {
  return requireAdmin(adminKey);
}

export async function adminAction(
  adminKey: string | null,
  action: string,
  payload?: { timerSec?: number }
): Promise<{ ok: true } | { error: string }> {
  if (!requireAdmin(adminKey)) return { error: zh.apiForbidden };

  const g = getGameRow();
  if (!g) return { error: zh.apiGameNotInit };

  switch (action) {
    case "set-timer": {
      const sec = payload?.timerSec ?? 30;
      sqlite
        .prepare("UPDATE game SET timer_sec = ? WHERE id = 1")
        .run(sec);
      break;
    }
    case "lobby":
      sqlite
        .prepare(
          "UPDATE game SET phase = 'lobby', countdown_end = NULL, opened_at = NULL WHERE id = 1"
        )
        .run();
      break;
    case "open": {
      if (g.phase === "open") return { error: zh.apiAlreadyAnswering };
      if (g.current_q < 1) {
        if (!getQuestion(1)) return { error: zh.apiNoQuestion };
        sqlite.prepare("UPDATE player SET submitted_this_round = 0").run();
        sqlite
          .prepare(
            "UPDATE game SET current_q = 1, countdown_end = NULL, opened_at = NULL WHERE id = 1"
          )
          .run();
      }
      const g2 = getGameRow()!;
      const sec = Math.max(1, g2.timer_sec);
      const end = new Date(Date.now() + sec * 1000).toISOString();
      const roundStart = new Date().toISOString();
      sqlite
        .prepare(
          "UPDATE game SET phase = 'countdown', countdown_end = ?, opened_at = ? WHERE id = 1"
        )
        .run(end, roundStart);
      break;
    }
    case "close":
      sqlite
        .prepare("UPDATE game SET phase = 'closed', opened_at = NULL WHERE id = 1")
        .run();
      break;
    case "next-question": {
      const nextQ = g.current_q + 1;
      if (!getQuestion(nextQ)) return { error: zh.apiNoMoreQuestions };
      sqlite.prepare("UPDATE player SET submitted_this_round = 0").run();
      sqlite
        .prepare(
          "UPDATE game SET current_q = ?, phase = 'closed', countdown_end = NULL, opened_at = NULL WHERE id = 1"
        )
        .run(nextQ);
      break;
    }
    case "reset-players":
      sqlite.prepare("DELETE FROM player").run();
      sqlite
        .prepare(
          "UPDATE game SET phase = 'lobby', current_q = 0, countdown_end = NULL, opened_at = NULL WHERE id = 1"
        )
        .run();
      break;
    default:
      return { error: zh.apiUnknownAction };
  }

  await broadcast();
  return { ok: true };
}

export async function getPlayerByToken(token: string) {
  const p = sqlite
    .prepare("SELECT * FROM player WHERE token = ?")
    .get(token) as PlayerRow | undefined;
  if (!p) return null;
  return {
    seatId: p.seat_id,
    name: p.name,
    employeeId: p.employee_id,
    correctCount: p.correct_count,
    status: p.status,
    submittedThisRound: p.submitted_this_round === 1,
    token: p.token,
  };
}
