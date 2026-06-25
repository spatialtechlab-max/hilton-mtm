/**
 * Step 2 of password + email-OTP login. Checks the 6-digit code, then re-mints
 * a fresh session via the password grant and returns the tokens for the client
 * to set with supabase.auth.setSession. The code is single-use. We also mark
 * the new session's id as OTP-cleared so the app's gate lets it straight in
 * (the user already passed the code here).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword, consumeOtp, sessionIdFromAccessToken } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  const code = String(body?.code ?? "").trim();
  if (!email || !password || !code) return NextResponse.json({ error: "Enter the code we emailed you." }, { status: 400 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const check = await consumeOtp(admin, email, code);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  // Code is good — re-mint a fresh session and mark it OTP-cleared.
  const grant = await verifyPassword(email, password);
  if (!grant.ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const sid = sessionIdFromAccessToken(grant.accessToken);
  if (sid) {
    await admin.from("mtm_verified_sessions").upsert(
      { session_id: sid, email: grant.email, verified_at: new Date().toISOString() },
      { onConflict: "session_id" },
    );
  }

  return NextResponse.json({ accessToken: grant.accessToken, refreshToken: grant.refreshToken });
}
