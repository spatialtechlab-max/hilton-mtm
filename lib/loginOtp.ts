/**
 * Server-only helpers for the email-OTP second factor on password logins.
 *
 * The password is verified against Supabase GoTrue server-side (the password
 * grant) WITHOUT establishing a browser session, so the customer isn't logged
 * in until they also enter the emailed code. Codes are stored hashed (with the
 * service-role key as a pepper) in mtm_login_otps and expire after one hour.
 */
import { createHash, randomInt } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const PEPPER   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "hilton-otp-pepper";

/** One hour, per the client's spec (emailed customer codes). */
export const OTP_TTL_MS = 60 * 60 * 1000;
/** Ten minutes, per the client's spec, for admin-relayed staff codes. */
export const RELAY_OTP_TTL_MS = 10 * 60 * 1000;
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

/** Is this email an atelier admin (row in mtm_admins)? Works with any client —
 *  pass the user's own client (checking their own email) or the service role. */
export async function isAdminEmail(client: SupabaseClient, email: string): Promise<boolean> {
  const { data } = await client.from("mtm_admins").select("email").ilike("email", normaliseEmail(email));
  return Array.isArray(data) && data.length > 0;
}

/** Admins and operators are exempt from the login OTP: they sign in with email
 *  + password only. Operators are store staff who use only the ERP image tool
 *  (mtm_operators). Employees (mtm_employees, /learn) are NOT exempt — they go
 *  through the admin-relayed OTP (see isStaffEmail / issueRelayOtp), because the
 *  client does not trust staff to sit their own exam unsupervised. */
export async function isOtpExemptEmail(_client: SupabaseClient, email: string): Promise<boolean> {
  const e = normaliseEmail(email);
  // Always check with the SERVICE ROLE, never the caller's client. The exemption
  // must not depend on the signed-in user's RLS: an admin's own mtm_admins read
  // can come back empty for some session types, which would wrongly gate them.
  const svc = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", { auth: { persistSession: false } });
  const [adm, op] = await Promise.all([
    svc.from("mtm_admins").select("email").ilike("email", e),
    svc.from("mtm_operators").select("email").ilike("email", e),
  ]);
  return (
    (Array.isArray(adm.data) && adm.data.length > 0) ||
    (Array.isArray(op.data) && op.data.length > 0)
  );
}

/** Is this email an enrolled learning-platform employee (row in mtm_employees)?
 *  These get the admin-relayed OTP instead of an emailed one. Service-role read
 *  for the same reason as the exemption check above. Admins/operators who are
 *  ALSO staff are handled first by isOtpExemptEmail, so this is only reached for
 *  pure staff. */
export async function isStaffEmail(email: string): Promise<boolean> {
  const e = normaliseEmail(email);
  const svc = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", { auth: { persistSession: false } });
  const { data } = await svc.from("mtm_employees").select("email").ilike("email", e);
  return Array.isArray(data) && data.length > 0;
}

/** Mint a fresh admin-relayed OTP for a staff email: stores the hash (for the
 *  verify step), the plaintext (for the admin to read out), marks it relay, and
 *  gives it the 10-minute TTL. Replaces any prior code for that email. No email
 *  is sent. Returns nothing — the code only ever reaches the admin dashboard. */
export async function issueRelayOtp(admin: SupabaseClient, email: string): Promise<void> {
  const code = generateOtp();
  const e = normaliseEmail(email);
  await admin.from("mtm_login_otps").upsert(
    {
      email: e,
      code_hash: hashOtp(e, code),
      code_plain: code,
      relay: true,
      expires_at: new Date(Date.now() + RELAY_OTP_TTL_MS).toISOString(),
      consumed: false,
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
}

/** Decode the Supabase `session_id` claim from an access-token JWT. No
 *  signature check — callers validate the token via getUser first; this only
 *  reads the claim so we can key the verified-sessions table by session. */
export function sessionIdFromAccessToken(jwt: string): string | null {
  try {
    const part = jwt.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    const claims = JSON.parse(json) as { session_id?: string };
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

/** Generate + store a fresh OTP for this email, replacing any prior code.
 *  Returns the plaintext code for sending. */
export async function issueOtp(admin: SupabaseClient, email: string): Promise<string> {
  const code = generateOtp();
  const e = normaliseEmail(email);
  await admin.from("mtm_login_otps").upsert(
    {
      email: e,
      code_hash: hashOtp(e, code),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      consumed: false,
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  return code;
}

export type OtpCheck = { ok: true } | { ok: false; status: number; error: string };

/** Validate a submitted code against the stored hash, handling expiry, single
 *  use and the attempt cap. Marks the code consumed on success. */
export async function consumeOtp(admin: SupabaseClient, email: string, code: string): Promise<OtpCheck> {
  const e = normaliseEmail(email);
  const { data } = await admin
    .from("mtm_login_otps").select("code_hash, expires_at, consumed, attempts").eq("email", e).maybeSingle();
  const otp = data as { code_hash: string; expires_at: string; consumed: boolean; attempts: number } | null;
  if (!otp) return { ok: false, status: 400, error: "No code on file. Request a new one." };
  if (otp.consumed) return { ok: false, status: 400, error: "That code was already used. Request a new one." };
  if (new Date(otp.expires_at).getTime() < Date.now()) return { ok: false, status: 400, error: "Your code has expired. Request a new one." };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, status: 429, error: "Too many attempts. Request a new code." };
  if (otp.code_hash !== hashOtp(e, code)) {
    await admin.from("mtm_login_otps").update({ attempts: otp.attempts + 1 }).eq("email", e);
    return { ok: false, status: 401, error: "That code isn't right. Try again." };
  }
  // Mark consumed first (this is the security-critical write, and it works even
  // before the relay migration adds code_plain).
  await admin.from("mtm_login_otps").update({ consumed: true }).eq("email", e);
  // Then best-effort wipe the plaintext so a spent relay code stops showing in
  // the admin dashboard. Wrapped so a pre-migration table (no code_plain column)
  // can't turn this into an error that blocks the login.
  try { await admin.from("mtm_login_otps").update({ code_plain: null }).eq("email", e); } catch { /* column may not exist yet */ }
  return { ok: true };
}
