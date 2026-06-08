/**
 * ERP → mtm_garments sync. Hits the ERP, collects every distinct
 * categoryName that looks like a garment (not an accessory), and
 * inserts any new ones into mtm_garments as Hidden so the atelier
 * can decide whether to make them Live.
 *
 * Already-covered categories (e.g. SUITING → suit, JACKETING → jacket)
 * never create a duplicate garment row — they fold into the existing
 * slug per ERP_CATEGORIES_FOR_GARMENT. Accessory categories (BELT,
 * TIE, SHOE, etc.) are skipped entirely; they have their own library
 * surfaces and aren't garments.
 *
 * Auth: admin JWT. Service-role key writes the garment rows.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchErpItems } from "@/lib/erp";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** ERP category strings that map onto a garment slug we already
 *  serve. Mirrors ERP_CATEGORIES_FOR_GARMENT in lib/erp.ts. Used so
 *  the sync doesn't create duplicate garment rows for SUITING /
 *  JACKETING etc. — those already feed into suit + jacket. */
const COVERED_CATEGORIES = new Set([
  "SUITING", "SUITINGS", "SUITS", "SUIT",
  "JACKETING", "JACKET", "BLAZER", "RTWJKT", "JKT",
  "SHIRTING", "SHIRTS", "SHIRT", "SHIIRTING",
  "PANTS", "PANT", "TROUSER", "TROUSERS",
]);

/** ERP categories that aren't garments (Hilton stocks them, but they
 *  live in accessory libraries — belts, ties, shoes, etc.). Skip
 *  these during the garment sync so we don't pollute mtm_garments. */
const ACCESSORY_CATEGORIES = new Set([
  "BELT", "BELTS",
  "TIE", "TIES", "NECKTIE", "BOWTIE", "BOW TIE", "SILK TIE",
  "SHOE", "SHOES",
  "WALLET", "WALLETS",
  "SOCK", "SOCKS",
  "POCKET SQUARE", "POCKET SQUARES",
  "CUFFLINK", "CUFFLINKS",
  "HANKY", "HANDKERCHIEF", "HANDKERCHIEFS",
  "FABRIC", "FABRICS", "CLOTH", "CLOTHS",
]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function labelFor(category: string): string {
  return category
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

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

  // Distinct categoryName values across every active ERP item.
  const items = await fetchErpItems();
  const counts = new Map<string, number>();
  for (const it of items) {
    const cat = (it.categoryName || "").trim().toUpperCase();
    if (!cat) continue;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  // Classify each distinct category. covered = already maps to an
  // existing garment slug, accessory = skipped, candidate = new
  // garment we should consider inserting.
  type Bucket = "covered" | "accessory" | "candidate";
  const classify = (c: string): Bucket => {
    if (COVERED_CATEGORIES.has(c)) return "covered";
    if (ACCESSORY_CATEGORIES.has(c)) return "accessory";
    return "candidate";
  };

  const candidates = Array.from(counts.entries())
    .filter(([c]) => classify(c) === "candidate")
    .map(([c, n]) => ({ category: c, slug: slugify(c), label: labelFor(c), count: n }))
    .filter((x) => x.slug.length > 0);

  if (candidates.length === 0) {
    return NextResponse.json({ added: [], skipped: [], categories: Array.from(counts.keys()) });
  }

  // Read existing mtm_garments slugs so we don't double-insert.
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { data: existingRows, error: readErr } = await admin
    .from("mtm_garments")
    .select("slug");
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  const existing = new Set((existingRows ?? []).map((r) => (r as { slug: string }).slug));

  const toInsert = candidates.filter((c) => !existing.has(c.slug));
  const skipped = candidates.filter((c) => existing.has(c.slug));

  // Position the new rows below the existing highest position so they
  // appear at the bottom of /admin/garments (still hidden) — atelier
  // can reorder.
  const { data: posRows } = await admin.from("mtm_garments").select("position");
  const maxPos = Math.max(0, ...(posRows ?? []).map((r) => (r as { position: number }).position));

  const added: { slug: string; label: string; category: string }[] = [];
  for (let i = 0; i < toInsert.length; i++) {
    const c = toInsert[i];
    const { error: upErr } = await admin.from("mtm_garments").upsert({
      slug: c.slug,
      label: c.label,
      position: maxPos + (i + 1) * 10,
      active: false, // hidden by default — atelier opts in
      season_note: `Auto-synced from ERP category "${c.category}"`,
      has_tiers: false,
      tile_image: "",
      tile_eyebrow: "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" });
    if (upErr) continue;
    added.push({ slug: c.slug, label: c.label, category: c.category });
  }

  return NextResponse.json({
    added,
    skipped: skipped.map((s) => ({ slug: s.slug, category: s.category, reason: "already exists in mtm_garments" })),
    erpCategories: Array.from(counts.keys()).sort(),
  });
}
