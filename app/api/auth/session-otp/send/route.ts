/**
 * Email a fresh OTP to the signed-in user. Used by the AuthProvider OTP gate
 * for any session that hasn't passed the second factor yet (Google logins,
 * etc.). Auth is the caller's own Supabase session token.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLoginOtpEmail } from "@/lib/email";
import { issueOtp } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const meta = (u.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const code = await issueOtp(admin, u.user.email);

  const sent = await sendLoginOtpEmail({ to: u.user.email, code, name: meta.full_name ?? meta.name ?? "" });
  if (!sent.ok) return NextResponse.json({ error: "Could not send your code. Please try again." }, { status: 502 });

  return NextResponse.json({ sent: true });
}
