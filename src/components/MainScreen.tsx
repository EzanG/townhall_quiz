"use client";

import { SeatMap } from "@/components/SeatMap";
import { HomeRightSidebar } from "@/components/HomeRightSidebar";
import { LeaderboardAside } from "@/components/LeaderboardAside";
import { useAppState } from "@/hooks/useAppState";
import { isAnswerPhase } from "@/lib/gamePhase";
import { zh } from "@/lib/zh";

export function MainScreen() {
  const { state, connected } = useAppState();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-3 py-3 text-center sm:px-6 sm:py-4">
        <h1 className="text-balance text-lg font-bold leading-snug sm:text-xl md:text-2xl">
          {zh.appTitle}
        </h1>

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
