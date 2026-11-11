/**
 * Shared admin authentication helpers.
 *
 * Edge-safe by design: it only uses Web Crypto (globalThis.crypto), so the same
 * module can run inside Next.js middleware, Node route handlers and server
 * components without any runtime-specific imports.
 */

/** HttpOnly cookie that carries the signed admin session. */
export const ADMIN_COOKIE = "elyon_admin_session";

/** Session lifetime (7 days) shared by cookie maxAge and token expiry. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Fallback used only when ADMIN_PASSWORD is missing from the environment. */
const DEFAULT_ADMIN_PASSWORD = "admin@123";

let runtimeAdminPasswordOverride: string | null = null;

export function setRuntimeAdminPassword(newPassword: string): void {
  runtimeAdminPasswordOverride = newPassword;
  process.env.ADMIN_PASSWORD = newPassword;
}

const textEncoder = new TextEncoder();

export function getAdminPassword(): string {
  if (runtimeAdminPasswordOverride && runtimeAdminPasswordOverride.length > 0) {
    return runtimeAdminPasswordOverride;
  }
  let fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv) {
    if (
      (fromEnv.startsWith('"') && fromEnv.endsWith('"')) ||
      (fromEnv.startsWith("'") && fromEnv.endsWith("'"))
    ) {
      fromEnv = fromEnv.slice(1, -1);
    }
    if (fromEnv.length > 0) return fromEnv;
  }
  return DEFAULT_ADMIN_PASSWORD;
}

/** Length-independent string comparison (avoids early-exit timing leaks). */
function constantTimeEquals(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLength; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function verifyAdminPassword(candidate: unknown): boolean {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  return constantTimeEquals(candidate, getAdminPassword());
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Derived from the password, so rotating ADMIN_PASSWORD revokes all sessions. */
function signingSecret(): string {
  return `elyon-admin-session:${getAdminPassword()}`;
}

/** Builds a tamper-proof session token: `v1.<expiresAtMs>.<hmacHex>`. */
export async function createAdminSessionToken(): Promise<string> {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const payload = `v1.${expiresAt}`;
  const signature = await hmacSha256Hex(signingSecret(), payload);
  return `${payload}.${signature}`;
}

export async function isAdminSessionValid(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresAtRaw, signature] = parts;
  if (version !== "v1" || !expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = await hmacSha256Hex(signingSecret(), `${version}.${expiresAtRaw}`);
  return constantTimeEquals(expected, signature);
}

/**
 * Only allows same-origin absolute paths (`/attendance`) as post-login
 * destinations, blocking open redirects such as `//evil.com`.
 */
export function sanitizeNextPath(next: unknown): string {
  if (typeof next !== "string" || next.length === 0) return "/admin";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/admin";
  return next;
}

/** Route prefixes that require a valid admin session. */
export const PROTECTED_PAGE_PREFIXES = [
  "/attendance",
  "/billing",
  "/materials",
  "/splitter",
  "/transactions",
] as const;

export const PROTECTED_API_PREFIXES = [
  "/api/attendance",
  "/api/orders",
  "/api/materials",
  "/api/trucks",
  "/api/hours-rent",
  "/api/employees",
] as const;

export function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
