/** Browser-side admin key (must match server ADMIN_KEY when strict mode is on). */

export const ADMIN_KEY_STORAGE = "quiz_admin_key";

export function getStoredAdminKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ADMIN_KEY_STORAGE)?.trim() ?? "";
}

export function setStoredAdminKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_KEY_STORAGE, key);
}
