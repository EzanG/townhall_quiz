"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { AppState } from "@/lib/game";

let socket: Socket | null = null;

/** 单例：避免多组件各自 new io() */
function getSocket() {
  if (!socket) {
    socket = io({ path: "/api/socket" });
  }
  return socket;
}

export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const [connected, setConnected] = useState(false);

  /** Socket 未连上前的首屏；与 `state:update` 结构一致 */
  const fetchStateOnce = useCallback(async () => {
    const res = await fetch("/api/state");
    if (res.ok) setState(await res.json());
  }, []);

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (data: AppState) => setState(data);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("state:update", onState);

    void fetchStateOnce();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("state:update", onState);
    };
  }, [fetchStateOnce]);

  return { state, connected };
}
