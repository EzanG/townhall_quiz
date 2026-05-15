/** localStorage key — same as settings page saves for QR / 手机参与链接 */
export const STORAGE_PUBLIC_URL = "quiz_public_url";

export function getPlayPageUrl(): string {
  if (typeof window === "undefined") return "";
  const saved = localStorage.getItem(STORAGE_PUBLIC_URL)?.trim();
  if (saved) return saved;
  return `${window.location.origin}/play`;
}
