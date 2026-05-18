"use client";

import { useCallback, useEffect, useState } from "react";
import type { SeatsLayout } from "@/lib/seats";

export function useSeatsLayout(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [layout, setLayout] = useState<SeatsLayout | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seats");
      if (res.ok) {
        const data = (await res.json()) as SeatsLayout;
        setLayout(data);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { layout, loading, reload };
}
