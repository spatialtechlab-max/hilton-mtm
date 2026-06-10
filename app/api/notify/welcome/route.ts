/**
 * Idempotent welcome email. Called by AuthProvider on every SIGNED_IN
 * event so we don't depend on a specific signup-result code path. Auth:
 * the caller's Supabase JWT — we resolve the email server-side from it.
 *
 * Dedup: writes user_metadata.welcomed_at after a successful send via the
 * service-role admin API. Subsequent calls short-circuit on that stamp,
 * so repeat sign-ins don't re-send.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !ANON || !SERVICE) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const sb = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u?.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const meta = (u.user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    welcomed_at?: string;
  };

  if (meta.welcomed_at) {
    return NextResponse.json({ sent: false, reason: "already-welcomed", welcomed_at: meta.welcomed_at });
  }

  const result = await sendWelcomeEmail({
    to: u.user.email,
    name: meta.full_name ?? meta.name,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  // Stamp so we never re-send. Failure here would only cause a duplicate
  // welcome on the next sign-in, so we don't fail the request over it.
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  await admin.auth.admin.updateUserById(u.user.id, {
    user_metadata: { ...meta, welcomed_at: new Date().toISOString() },
  });

  return NextResponse.json({ sent: true });
}
