/**
 * Verify the OTP for the signed-in session and mark that session as having
 * cleared the second factor (inserts its session_id into mtm_verified_sessions),
 * which lets the AuthProvider release the gate. Auth is the caller's own token.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeOtp, sessionIdFromAccessToken } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  if (!code) return NextResponse.json({ error: "Enter the code we emailed you." }, { status: 400 });

  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const check = await consumeOtp(admin, u.user.email, code);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const sid = sessionIdFromAccessToken(token);
  if (sid) {
    await admin.from("mtm_verified_sessions").upsert(
      { session_id: sid, email: u.user.email, verified_at: new Date().toISOString() },
      { onConflict: "session_id" },
    );
  }
  return NextResponse.json({ verified: true });
}
