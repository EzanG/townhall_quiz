import type { GamePhase } from "./schema";

/** 参与者可选题并提交的阶段（与 `submitAnswer` 服务端校验一致） */
export function isAnswerPhase(phase: GamePhase | undefined) {
  return phase === "countdown" || phase === "open";
}
