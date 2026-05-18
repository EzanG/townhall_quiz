import type { GamePhase } from "./schema";

/** 仅在同步倒计时内可提交（倒计时结束自动进入 `closed`） */
export function isAnswerPhase(phase: GamePhase | undefined) {
  return phase === "countdown";
}
