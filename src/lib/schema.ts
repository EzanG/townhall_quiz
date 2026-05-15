export type GamePhase = "lobby" | "countdown" | "open" | "closed";
export type PlayerStatus = "live" | "out";

export type GameRow = {
  id: number;
  phase: GamePhase;
  timer_sec: number;
  current_q: number;
  countdown_end: string | null;
  /** ISO time when the answer window started (countdown begins; submit latency from here). */
  opened_at: string | null;
};

export type PlayerRow = {
  seat_id: string;
  name: string;
  employee_id: string | null;
  correct_count: number;
  status: PlayerStatus;
  token: string;
  submitted_this_round: number;
  updated_at: string | null;
  /** Sum of ms from round answer-window start to each correct submit. */
  total_correct_time_ms: number;
};
