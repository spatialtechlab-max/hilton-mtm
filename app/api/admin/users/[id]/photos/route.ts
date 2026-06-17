/**
 * Admin view of a customer's PROFILE body photographs.
 *
 * Profile photos live in the private `order-media` bucket under
 * `{user_id}/profile/{view}.{ext}` (see lib/profilePhotos.ts). A customer
 * can read their own folder via storage RLS, but the atelier desk needs to
 * read ANY customer's folder. Storage RLS is per-user, so we sign the URLs
 * here with the service role after gating on the admin allowlist — the same
 * email gate the rest of /api/admin uses.
 */
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = "order-media";
const VIEWS = ["front", "back", "left", "right"] as const;
type View = (typeof VIEWS)[number];

async function assertAdmin(
  req: Request,
): Promise<{ ok: true; email: string } | { ok: false; status: number; msg: string }> {
  if (!SUPA_URL || !ANON) return { ok: false, status: 500, msg: "Supabase env missing" };
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { ok: false, status: 401, msg: "Sign in required." };
  const userClient = createClient(SUPA_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return { ok: false, status: 401, msg: "Invalid session." };
  const email = u.user.email;
  const { data: allow } = await userClient.from("mtm_admins").select("email").eq("email", email);
  if (!allow || allow.length === 0) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true, email };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad user id" }, { status: 400 });

  const admin: SupabaseClient = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const folder = `${id}/profile`;
  const { data: files, error } = await admin.storage.from(BUCKET).list(folder);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos: Record<View, string | null> = { front: null, back: null, left: null, right: null };
  for (const f of files ?? []) {
    const base = f.name.split(".")[0] as View;
    if (!VIEWS.includes(base)) continue;
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(`${folder}/${f.name}`, 60 * 60);
    if (signed?.signedUrl) photos[base] = signed.signedUrl;
  }

  return NextResponse.json({ photos });
}
