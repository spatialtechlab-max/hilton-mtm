"use client";

import { supabase } from "./supabase";

/**
 * Atelier-managed garment list. Mirrors the `mtm_garments` table from
 * `supabase/migrations/20260603100000_garments.sql`. The four built-in
 * garments (suit / jacket / shirt / trouser) are seeded by that
 * migration; admin can add overcoat / tuxedo / chino-pants / anything
 * seasonal on top.
 *
 * Static fallback: if the table doesn't exist yet (i.e. the migration
 * hasn't been run) the helpers return the four built-ins so the
 * storefront keeps working.
 */
export type Garment = {
  slug: string;
  label: string;
  position: number;
  active: boolean;
  season_note: string;
  has_tiers: boolean;
  tile_image: string;
  tile_eyebrow: string;
  /** Long editorial copy shown under the title on /library/<slug>.
   *  Editable per garment from /admin/garments. Null falls back to the
   *  hardcoded intro from lib/libraries.ts (for built-ins) or a
   *  generated default (for dynamic ERP-synced rows). */
  description: string | null;
  /** ERP categoryName strings that belong to this garment. The sync job
   *  fills this in when a new category appears so /library/<slug> can
   *  filter ERP items without a hardcoded mapping in the code. */
  erp_categories: string[];
};

const BUILTIN: Garment[] = [
  { slug: "suit",    label: "Suit",    position: 10, active: true, season_note: "", has_tiers: true,  tile_image: "", tile_eyebrow: "Two-piece commission", description: null, erp_categories: ["SUITING","SUITINGS","SUITS","SUIES","SUIUS"] },
  { slug: "jacket",  label: "Jacket",  position: 20, active: true, season_note: "", has_tiers: true,  tile_image: "", tile_eyebrow: "Standalone", description: null, erp_categories: ["JACKETING","JACKET","BLAZER","RTWJKT"] },
  { slug: "shirt",   label: "Shirt",   position: 30, active: true, season_note: "", has_tiers: false, tile_image: "", tile_eyebrow: "Shirting", description: null, erp_categories: ["SHIRTING","SHIIRTING","SHIRTS"] },
  { slug: "trouser", label: "Trouser", position: 40, active: true, season_note: "", has_tiers: false, tile_image: "", tile_eyebrow: "Tailored", description: null, erp_categories: ["PANTS"] },
];

export async function fetchGarments(opts: { activeOnly?: boolean } = {}): Promise<Garment[]> {
  const { data, error } = await supabase
    .from("mtm_garments")
    .select("*")
    .order("position", { ascending: true });
  if (error || !data || data.length === 0) {
    return opts.activeOnly ? BUILTIN.filter((g) => g.active) : BUILTIN;
  }
  const rows = data as Garment[];
  return opts.activeOnly ? rows.filter((g) => g.active) : rows;
}

export async function upsertGarment(g: Partial<Garment> & { slug: string; label: string }): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mtm_garments")
    .upsert(
      {
        slug: g.slug,
        label: g.label,
        position: g.position ?? 100,
        active: g.active ?? true,
        season_note: g.season_note ?? "",
        has_tiers: g.has_tiers ?? false,
        tile_image: g.tile_image ?? "",
        tile_eyebrow: g.tile_eyebrow ?? "",
        description: g.description ?? null,
        erp_categories: g.erp_categories ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
  return { error: error?.message ?? null };
}

export async function deleteGarment(slug: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_garments").delete().eq("slug", slug);
  return { error: error?.message ?? null };
}

/** Slug-ifies a free-text label so admin can type "Chino Pants" and get "chino-pants". */
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve the library-cover slot key the storefront uses for a given
 *  garment. Library URLs are plural (`/library/suits`) but garment slugs
 *  are singular (`suit`), so this maps singular → plural for known
 *  built-ins, and applies a generic plural rule for anything custom the
 *  atelier adds. Used by:
 *
 *  - the homepage Categories tile (e.g. `library.suits.cover`)
 *  - the /library/<plural> hero
 *  - the Design Yours picker tile
 *
 *  Keeping the resolution in one place means uploading a library cover
 *  on /admin/media or /admin/garments reflects on all three surfaces. */
const KNOWN_LIBRARY_PLURALS: Record<string, string> = {
  suit:    "suits",
  jacket:  "jackets",
  shirt:   "shirts",
  trouser: "trousers",
  shoe:    "shoes",
  tie:     "ties",
  belt:    "belts",
  cloth:   "cloths",
};

export function librarySlugForGarment(slug: string): string {
  if (KNOWN_LIBRARY_PLURALS[slug]) return KNOWN_LIBRARY_PLURALS[slug];
  // Generic English pluralisation: handles "overcoat" → "overcoats",
  // "tuxedo" → "tuxedos" without a code change. Slugs that already
  // happen to end in "s" (e.g. "chinos") are left alone.
  if (slug.endsWith("s")) return slug;
  return `${slug}s`;
}

export function libraryCoverSlotForGarment(slug: string): string {
  return `library.${librarySlugForGarment(slug)}.cover`;
}
