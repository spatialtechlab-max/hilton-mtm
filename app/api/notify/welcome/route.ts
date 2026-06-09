/**
 * Fires the welcome email after a customer signs up. Called by the
 * client AuthForm on a successful signUp result; we don't sit on a
 * Supabase webhook because Supabase's auth hooks aren't enabled in the
 * Hobby tier. Auth: the caller's Supabase JWT — we resolve the email
 * server-side from it so a malicious caller can't make us spam anyone.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const sb = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u?.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const meta = (u.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const result = await sendWelcomeEmail({
    to: u.user.email,
    name: meta.full_name ?? meta.name,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ sent: true });
}
