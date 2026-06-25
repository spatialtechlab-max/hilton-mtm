/**
 * Step 2 of password + email-OTP login. Checks the 6-digit code against the
 * stored hash (not consumed, not expired, attempts remaining), then re-mints a
 * fresh session via the password grant and returns the tokens for the client
 * to set with supabase.auth.setSession. The code is single-use.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword, hashOtp, normaliseEmail, OTP_MAX_ATTEMPTS } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

type OtpRow = { code_hash: string; expires_at: string; consumed: boolean; attempts: number };

export async function POST(req: Request) {
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  const code = String(body?.code ?? "").trim();
  if (!email || !password || !code) return NextResponse.json({ error: "Enter the code we emailed you." }, { status: 400 });

  const emailLower = normaliseEmail(email);
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const { data: row } = await admin
    .from("mtm_login_otps").select("code_hash, expires_at, consumed, attempts").eq("email", emailLower).maybeSingle();
  const otp = row as OtpRow | null;

  if (!otp)                                         return NextResponse.json({ error: "No code on file. Request a new one." }, { status: 400 });
  if (otp.consumed)                                 return NextResponse.json({ error: "That code was already used. Request a new one." }, { status: 400 });
  if (new Date(otp.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Your code has expired. Request a new one." }, { status: 400 });
  if (otp.attempts >= OTP_MAX_ATTEMPTS)             return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });

  if (otp.code_hash !== hashOtp(emailLower, code)) {
    await admin.from("mtm_login_otps").update({ attempts: otp.attempts + 1 }).eq("email", emailLower);
    return NextResponse.json({ error: "That code isn't right. Try again." }, { status: 401 });
  }

  // Code is good — re-mint a fresh session, then burn the code (single use).
  const grant = await verifyPassword(email, password);
  if (!grant.ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  await admin.from("mtm_login_otps").update({ consumed: true }).eq("email", emailLower);

  return NextResponse.json({ accessToken: grant.accessToken, refreshToken: grant.refreshToken });
}
