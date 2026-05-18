/** Server-side admin key validation for host APIs (/api/admin, /api/questions). */

export function isAdminStrict(): boolean {
  return process.env.ADMIN_STRICT !== "false";
}

export function getExpectedAdminKey(): string {
  return (process.env.ADMIN_KEY ?? "").trim();
}

export function isAdminKeyConfigured(): boolean {
  return getExpectedAdminKey().length > 0;
}

export function verifyAdminKey(adminKey: string | null): boolean {
  if (!isAdminStrict()) return true;
  const expected = getExpectedAdminKey();
  if (!expected) return false;
  return (adminKey ?? "").trim() === expected;
}

export function getAdminAuthStatus() {
  return {
    strict: isAdminStrict(),
    keyConfigured: isAdminKeyConfigured(),
  };
}
