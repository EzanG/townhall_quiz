"use client";

import { Countdown } from "@/components/Countdown";
import { HostControls } from "@/components/HostControls";
import { JoinQrCorner } from "@/components/JoinQrCorner";
import { SettingsGearLink } from "@/components/SettingsGearLink";
import type { AppState } from "@/lib/game";
import { zh } from "@/lib/zh";

type Props = {
  state: AppState | null;
  connected: boolean;
  className?: string;
};

export function HomeRightSidebar({
  state,
  connected,
  className = "",
}: Props) {
  const timerSec = state?.game.timerSec ?? 30;
  const countdownEnd = state?.game.countdownEnd ?? null;

  return (
    <aside
      className={`flex min-h-0 w-full shrink-0 flex-col gap-3 border-t border-slate-800 bg-slate-900/40 p-3 lg:w-[15.5rem] lg:overflow-y-auto lg:border-l lg:border-t-0 xl:w-64 ${className}`}
    >
      <JoinQrCorner variant="rail" />

      <div className="rounded-xl border border-slate-700/90 bg-slate-900/50 px-3 py-3 text-center">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {zh.mainCountdownTitle}
        </p>
        <Countdown endsAt={countdownEnd} idleSeconds={timerSec} />
      </div>

      <HostControls layout="rail" />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
        <span
          className={`text-xs ${connected ? "text-emerald-400" : "text-red-400"}`}
        >
          {connected ? zh.live : zh.disconnected}
        </span>
        <SettingsGearLink />
      </div>
    </aside>
  );
}
