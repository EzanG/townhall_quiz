"use client";

import { useEffect, useState } from "react";
import { zh } from "@/lib/zh";

type Props = {
  endsAt: string | null;
  /** When no active countdown, show configured seconds (e.g. game.timerSec). */
  idleSeconds?: number;
  className?: string;
};

export function Countdown({ endsAt, idleSeconds, className = "" }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) {
    const sec =
      typeof idleSeconds === "number" && idleSeconds > 0 ? idleSeconds : null;
    return (
      <div className={`text-center ${className}`}>
        <div className="font-mono text-5xl font-bold tabular-nums text-slate-600">
          {sec !== null ? `${sec}s` : "—"}
        </div>
        {sec !== null && (
          <p className="mt-1 text-xs text-slate-500">{zh.countdownWaitingHost}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`text-center font-mono text-5xl font-bold tabular-nums ${className} ${
        remaining <= 5 ? "text-red-400" : "text-amber-400"
      }`}
    >
      {remaining}s
    </div>
  );
}
