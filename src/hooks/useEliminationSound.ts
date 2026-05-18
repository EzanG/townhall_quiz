"use client";

import { useEffect, useRef } from "react";
import type { PlayerPublic } from "@/lib/game";
import { playEliminationSound } from "@/lib/elimination-sound";

/** 本人 live → out 时播放（手机答题页） */
export function useEliminationSoundOnSelf(player: PlayerPublic | null | undefined) {
  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!player) {
      prevStatus.current = null;
      return;
    }
    if (prevStatus.current === "live" && player.status === "out") {
      playEliminationSound();
    }
    prevStatus.current = player.status;
  }, [player?.status]);
}

/** 全场新增淘汰座位时播放（大屏；合并逻辑在 playEliminationSound 内） */
export function useEliminationSoundOnNewlyOut(
  players: PlayerPublic[] | undefined
) {
  const prevOut = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!players) return;

    const outNow = new Set(
      players.filter((p) => p.status === "out").map((p) => p.seatId)
    );

    if (prevOut.current === null) {
      prevOut.current = outNow;
      return;
    }

    let newlyOut = 0;
    for (const id of outNow) {
      if (!prevOut.current.has(id)) newlyOut++;
    }
    prevOut.current = outNow;

    if (newlyOut > 0) playEliminationSound();
  }, [players]);
}
