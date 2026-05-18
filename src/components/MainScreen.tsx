"use client";

import { useEffect, useState } from "react";
import { SeatMap } from "@/components/SeatMap";
import { HomeRightSidebar } from "@/components/HomeRightSidebar";
import { LeaderboardAside } from "@/components/LeaderboardAside";
import { useAppState } from "@/hooks/useAppState";
import { useEliminationSoundOnNewlyOut } from "@/hooks/useEliminationSound";
import { isAnswerPhase } from "@/lib/gamePhase";
import { zh } from "@/lib/zh";

export function MainScreen() {
  const { state, connected } = useAppState();
  const [questionTotalFallback, setQuestionTotalFallback] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (state && typeof state.questionTotal === "number") {
      setQuestionTotalFallback(null);
      return;
    }
    fetch("/api/questions/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { count?: number } | null) => {
        if (data && typeof data.count === "number") {
          setQuestionTotalFallback(data.count);
        }
      })
      .catch(() => {});
  }, [state?.questionTotal, state?.game.currentQ]);

  const questionTotal =
    typeof state?.questionTotal === "number"
      ? state.questionTotal
      : questionTotalFallback;

  useEliminationSoundOnNewlyOut(state?.players);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-3 py-3 text-center sm:px-6 sm:py-4">
        <h1 className="text-balance text-lg font-bold leading-snug sm:text-xl md:text-2xl">
          {zh.appTitle}
        </h1>
        {state && (
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-amber-400/95 sm:text-base">
              {state.game.currentQ > 0
                ? typeof questionTotal === "number"
                  ? zh.mainCurrentQuestion(state.game.currentQ, questionTotal)
                  : zh.mainCurrentQuestionOnly(state.game.currentQ)
                : zh.mainNoQuestion}
            </p>
            {state.game.currentQ > 0 && state.question?.stem && (
              <p className="mx-auto max-w-4xl text-pretty text-sm leading-relaxed text-slate-300 sm:text-base">
                {state.question.stem}
              </p>
            )}
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <LeaderboardAside
          entries={state?.leaderboard ?? []}
          className="order-2 lg:order-1"
        />

        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col px-3 py-3 lg:order-2 lg:overflow-hidden lg:px-4 lg:py-3">
          {!state ? (
            <div className="flex flex-1 items-center justify-center text-slate-500">
              {zh.loading}
            </div>
          ) : (
            <section className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-800/60 bg-slate-900/20 p-2 sm:p-3">
              <SeatMap players={state.players} phase={state.game.phase} compact />
              {isAnswerPhase(state.game.phase) && (
                <p className="mt-2 text-center text-[11px] text-slate-500 sm:text-xs">
                  {zh.mainSeatLegendOpen}
                </p>
              )}
            </section>
          )}
        </div>

        <HomeRightSidebar
          state={state}
          connected={connected}
          className="order-3 lg:order-3"
        />
      </div>
    </div>
  );
}
