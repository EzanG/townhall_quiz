/** Normalize seat id from user input (e.g. fullwidth dash, spaces). */
export function normalizeSeatId(raw: string): string {
  return raw
    .trim()
    .replace(/\uFF0D/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\s+/g, "");
}
