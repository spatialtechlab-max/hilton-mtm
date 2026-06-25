/**
 * Has the CURRENT session cleared the email OTP? The AuthProvider calls this
 * for every signed-in session; an unverified one (e.g. a fresh Google login)
 * is blocked behind the OTP gate until it appears in mtm_verified_sessions.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionIdFromAccessToken } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ verified: false }, { status: 401 });

  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user) return NextResponse.json({ verified: false }, { status: 401 });

  const sid = sessionIdFromAccessToken(token);
  if (!sid) return NextResponse.json({ verified: false, email: u.user.email ?? null });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { data: row } = await admin
    .from("mtm_verified_sessions").select("session_id").eq("session_id", sid).maybeSingle();

  return NextResponse.json({ verified: !!row, email: u.user.email ?? null });
}
