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
};

const BUILTIN: Garment[] = [
  { slug: "suit",    label: "Suit",    position: 10, active: true, season_note: "", has_tiers: true,  tile_image: "", tile_eyebrow: "Two-piece commission" },
  { slug: "jacket",  label: "Jacket",  position: 20, active: true, season_note: "", has_tiers: true,  tile_image: "", tile_eyebrow: "Standalone" },
  { slug: "shirt",   label: "Shirt",   position: 30, active: true, season_note: "", has_tiers: false, tile_image: "", tile_eyebrow: "Shirting" },
  { slug: "trouser", label: "Trouser", position: 40, active: true, season_note: "", has_tiers: false, tile_image: "", tile_eyebrow: "Tailored" },
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
