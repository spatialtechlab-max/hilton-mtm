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

/** ERP category strings that already roll into a built-in garment slug
 *  (suit / jacket / shirt / trouser). The sync writes their erp_categories
 *  onto those rows but doesn't create a parallel garment row — those
 *  already exist as the four canonical built-ins. */
const COVERED_CATEGORIES_BY_SLUG: Record<string, string[]> = {
  suit:    ["SUITING", "SUITINGS", "SUITS", "SUIT", "SUIES", "SUIUS"],
  jacket:  ["JACKETING", "JACKET", "BLAZER", "RTWJKT", "JKT"],
  shirt:   ["SHIRTING", "SHIRTS", "SHIRT", "SHIIRTING"],
  trouser: ["PANTS", "PANT", "TROUSER", "TROUSERS"],
};
const COVERED_CATEGORIES = new Set(Object.values(COVERED_CATEGORIES_BY_SLUG).flat());

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

  // Classify each distinct category. covered = already rolls into a
  // built-in garment row (suit / jacket / shirt / trouser); candidate
  // = anything else (including accessories like BELT and TIE — the
  // admin sees every ERP category and decides what's live).
  type Bucket = "covered" | "candidate";
  const classify = (c: string): Bucket => COVERED_CATEGORIES.has(c) ? "covered" : "candidate";

  const candidates = Array.from(counts.entries())
    .filter(([c]) => classify(c) === "candidate")
    .map(([c, n]) => ({ category: c, slug: slugify(c), label: labelFor(c), count: n }))
    .filter((x) => x.slug.length > 0);

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // First — keep the four built-in garment rows in sync with whichever
  // ERP categoryNames currently route into them. New typos or aliases
  // ("SUIES", "SUIUS" etc.) get appended; nothing is removed manually.
  for (const [slug, builtinCats] of Object.entries(COVERED_CATEGORIES_BY_SLUG)) {
    const present = builtinCats.filter((c) => counts.has(c));
    if (present.length === 0) continue;
    await admin
      .from("mtm_garments")
      .update({ erp_categories: present, updated_at: new Date().toISOString() })
      .eq("slug", slug);
  }

  if (candidates.length === 0) {
    return NextResponse.json({ added: [], skipped: [], categories: Array.from(counts.keys()) });
  }

  // Read existing mtm_garments slugs so we don't double-insert.
  const { data: existingRows, error: readErr } = await admin
    .from("mtm_garments")
    .select("slug");
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  const existing = new Set((existingRows ?? []).map((r) => (r as { slug: string }).slug));

  const toInsert = candidates.filter((c) => !existing.has(c.slug));
  const skipped = candidates.filter((c) => existing.has(c.slug));

  // Also refresh erp_categories on rows we're "skipping" — the row
  // already exists but might have an empty erp_categories array (older
  // accounts pre-dating that column) or might have stale categories
  // that need merging. The admin can always edit the column manually.
  for (const s of skipped) {
    await admin
      .from("mtm_garments")
      .update({ erp_categories: [s.category], updated_at: new Date().toISOString() })
      .eq("slug", s.slug);
  }

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
      // Bind this garment row to the ERP categoryName at sync time so the
      // storefront library page can filter ERP items by it. No code edit
      // needed when a new category appears — just run the sync.
      erp_categories: [c.category],
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
