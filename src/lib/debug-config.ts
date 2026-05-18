import { sqlite } from "@/lib/db";

export function isDebugReregisterEnabled(): boolean {
  const row = sqlite
    .prepare("SELECT debug_reregister FROM game WHERE id = 1")
    .get() as { debug_reregister: number } | undefined;
  return row?.debug_reregister === 1;
}

export function setDebugReregister(enabled: boolean): void {
  sqlite
    .prepare("UPDATE game SET debug_reregister = ? WHERE id = 1")
    .run(enabled ? 1 : 0);
}
