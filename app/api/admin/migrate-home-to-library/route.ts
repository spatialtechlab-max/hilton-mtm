/**
 * One-shot migration endpoint. The homepage Categories tiles used to
 * live on home.category.<slug> media slots. After the unification with
 * library.<slug>.cover (commit 94ddb22), the atelier's earlier
 * customisations to the old slots disappeared from the storefront.
 *
 * This endpoint copies any non-empty home.category.<slug> row to the
 * matching library.<slug>.cover row, but ONLY when the target row
 * doesn't already have an upload (so a fresh upload on the new key is
 * never overwritten). Idempotent — safe to call multiple times.
 *
 * Auth: caller must send the Supabase session JWT as Bearer. We resolve
 * the email and check it's in mtm_admins before doing anything.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MAPPING: Record<string, string> = {
  "home.category.suits":    "library.suits.cover",
  "home.category.jackets":  "library.jackets.cover",
  "home.category.shirts":   "library.shirts.cover",
  "home.category.trousers": "library.trousers.cover",
  "home.category.shoes":    "library.shoes.cover",
  "home.category.ties":     "library.ties.cover",
};

async function assertAdmin(req: Request): Promise<{ ok: true; email: string } | { ok: false; status: number; msg: string }> {
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

export async function POST(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const fromSlots = Object.keys(MAPPING);
  const toSlots = Object.values(MAPPING);

  const [{ data: legacy, error: e1 }, { data: existing, error: e2 }] = await Promise.all([
    admin.from("mtm_media").select("slot,url,alt").in("slot", fromSlots),
    admin.from("mtm_media").select("slot,url").in("slot", toSlots),
  ]);
  if (e1 || e2) {
    return NextResponse.json({ error: e1?.message ?? e2?.message ?? "Read failed" }, { status: 500 });
  }
  const existingWithUrl = new Set((existing ?? []).filter((r) => r.url).map((r) => r.slot));

  const summary: { copied: { from: string; to: string }[]; skipped: { from: string; reason: string }[] } = {
    copied: [],
    skipped: [],
  };

  for (const row of legacy ?? []) {
    const target = MAPPING[row.slot];
    if (!target) {
      summary.skipped.push({ from: row.slot, reason: "no mapping" });
      continue;
    }
    if (!row.url) {
      summary.skipped.push({ from: row.slot, reason: "source has no url" });
      continue;
    }
    if (existingWithUrl.has(target)) {
      summary.skipped.push({ from: row.slot, reason: `target ${target} already has an upload` });
      continue;
    }
    const { error: upErr } = await admin
      .from("mtm_media")
      .upsert({ slot: target, url: row.url, alt: row.alt, updated_at: new Date().toISOString() }, { onConflict: "slot" });
    if (upErr) {
      summary.skipped.push({ from: row.slot, reason: `upsert failed: ${upErr.message}` });
      continue;
    }
    summary.copied.push({ from: row.slot, to: target });
  }

  return NextResponse.json(summary);
}
