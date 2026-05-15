"use client";

import type { LeaderboardEntry } from "@/lib/game";
import { zh } from "@/lib/zh";

function formatLeaderTimeMs(ms: number, correctCount: number): string {
  if (correctCount <= 0) return zh.leaderboardDash;
  if (ms <= 0) return "0.0\u79d2";
  const sec = ms / 1000;
  if (sec < 120) return `${sec.toFixed(1)}\u79d2`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}\u5206${String(s).padStart(2, "0")}\u79d2`;
}

function rankAccent(rank: number): string {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-700/90";
  return "text-slate-500";
}

type Props = {
  entries: LeaderboardEntry[];
  className?: string;
};

export function LeaderboardAside({ entries, className = "" }: Props) {
  return (
    <aside
      className={`flex min-h-0 w-full shrink-0 flex-col border-t border-slate-800 bg-slate-900/35 p-3 lg:w-[13.75rem] lg:overflow-y-auto lg:border-r lg:border-t-0 lg:pt-3 xl:w-56 ${className}`}
    >
      <h2 className="text-center text-sm font-semibold tracking-wide text-amber-400/95">
        {zh.leaderboardTitle}
      </h2>
      <p className="mt-1.5 text-center text-[10px] leading-snug text-slate-500">
        {zh.leaderboardSub}
      </p>

      <ol className="mt-3 flex flex-1 flex-col gap-1.5 lg:mt-4">
        {entries.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-700/80 py-6 text-center text-xs text-slate-500">
            {zh.leaderboardEmpty}
          </li>
        ) : (
          entries.map((e) => (
            <li
              key={e.seatId}
              className="rounded-lg border border-slate-800/90 bg-slate-950/50 px-2.5 py-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`shrink-0 font-mono text-sm font-bold tabular-nums ${rankAccent(e.rank)}`}
                >
                  {e.rank}
                </span>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-medium leading-tight text-slate-100">
                    {e.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                    {e.seatId}
                  </p>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-slate-800/60 pt-1.5 text-[10px] text-slate-400">
                <span>
                  {zh.leaderboardCorrect} {e.correctCount}
                </span>
                <span className="font-mono tabular-nums text-slate-300">
                  {formatLeaderTimeMs(e.totalCorrectTimeMs, e.correctCount)}
                </span>
              </div>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}
