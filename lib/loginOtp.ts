/**
 * Server-only helpers for the email-OTP second factor on password logins.
 *
 * The password is verified against Supabase GoTrue server-side (the password
 * grant) WITHOUT establishing a browser session, so the customer isn't logged
 * in until they also enter the emailed code. Codes are stored hashed (with the
 * service-role key as a pepper) in mtm_login_otps and expire after one hour.
 */
import { createHash, randomInt } from "crypto";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const PEPPER   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "hilton-otp-pepper";

/** One hour, per the client's spec. */
export const OTP_TTL_MS = 60 * 60 * 1000;
/** Wrong-code guesses allowed before the code is locked and a new one needed. */
export const OTP_MAX_ATTEMPTS = 5;

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A zero-padded 6-digit code, e.g. "048213". */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Deterministic hash of (email, code) so the plaintext code is never stored. */
export function hashOtp(email: string, code: string): string {
  return createHash("sha256")
    .update(`${normaliseEmail(email)}:${String(code).trim()}:${PEPPER}`)
    .digest("hex");
}

export type GrantResult =
  | { ok: true; accessToken: string; refreshToken: string; userId: string; email: string; name: string }
  | { ok: false };

/**
 * Verify email + password against GoTrue and return the freshly minted session
 * tokens — WITHOUT setting any cookie/session. Returns { ok: false } on bad
 * credentials or any error, so callers can give a single generic message.
 */
export async function verifyPassword(email: string, password: string): Promise<GrantResult> {
  if (!SUPA_URL || !ANON) return { ok: false };
  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!res.ok) return { ok: false };
    const d = await res.json().catch(() => null);
    if (!d?.access_token || !d?.refresh_token) return { ok: false };
    const user = d.user ?? {};
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
    return {
      ok: true,
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      userId: String(user.id ?? ""),
      email: String(user.email ?? email),
      name: meta.full_name ?? meta.name ?? "",
    };
  } catch {
    return { ok: false };
  }
}
