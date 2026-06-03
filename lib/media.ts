"use client";

import { supabase } from "./supabase";

/**
 * Atelier-managed editorial imagery — homepage hero, library covers,
 * heritage banner, etc. Each slot has a known string key (declared in
 * MEDIA_SLOTS below) and a row in `mtm_media`. The render-side
 * <MediaImage> component reads the override; if the slot has no row,
 * the static fallback from the source code is used instead.
 *
 * Why a slot registry rather than free-form? Each slot has fixed
 * aspect ratio + alt-text expectations baked into where it's used.
 * Listing them in one place lets /admin/media show every editable
 * surface in one tidy list.
 */

export type MediaSlot = {
  key: string;
  group: "Home" | "Library" | "Editorial";
  label: string;
  description: string;
  fallback: string;
  fallbackAlt: string;
  /** Recommended aspect — for the admin preview only. */
  aspect: string;
};

export const MEDIA_SLOTS: MediaSlot[] = [
  {
    key: "home.hero",
    group: "Home",
    label: "Homepage hero banner",
    description:
      "The full-bleed image at the top of the homepage. Lands behind the headline; needs to read at 2400×1500+.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "Tailor finishing a navy jacket at the cutting bench",
    aspect: "16/10",
  },
  {
    key: "library.tailoring.cover",
    group: "Library",
    label: "Tailoring library cover",
    description: "Hero photo for /library/tailoring — suits & jackets.",
    fallback:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "A bespoke navy windowpane suit, hand-finished",
    aspect: "16/10",
  },
  {
    key: "library.shirts.cover",
    group: "Library",
    label: "Shirts library cover",
    description: "Hero photo for /library/shirts.",
    fallback: "/atelier/alumo-shirting.jpg",
    fallbackAlt: "Alumo shirting swatches",
    aspect: "16/10",
  },
  {
    key: "library.trousers.cover",
    group: "Library",
    label: "Trousers library cover",
    description: "Hero photo for /library/trousers.",
    fallback: "/atelier/trofeo-book.jpg",
    fallbackAlt: "Trofeo trouser cloth book",
    aspect: "16/10",
  },
  {
    key: "library.shoes.cover",
    group: "Library",
    label: "Shoes library cover",
    description: "Hero photo for /library/shoes.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Double-monk in vintage marrone leather",
    aspect: "16/10",
  },
  {
    key: "library.ties.cover",
    group: "Library",
    label: "Ties library cover",
    description: "Hero photo for /library/ties.",
    fallback: "/atelier/tie-wall.jpg",
    fallbackAlt: "The atelier's silk tie wall",
    aspect: "16/10",
  },
  {
    key: "library.belts.cover",
    group: "Library",
    label: "Belts library cover",
    description: "Hero photo for /library/belts.",
    fallback: "/atelier/pocket-squares.jpg",
    fallbackAlt: "Magnanni and Gufo belt buckles on the bench",
    aspect: "16/10",
  },
  {
    key: "library.cloths.cover",
    group: "Library",
    label: "Cloths library cover",
    description: "Hero photo for /library/cloths.",
    fallback: "/atelier/vbc-book.jpg",
    fallbackAlt: "Vitale Barberis Canonico swatch book",
    aspect: "16/10",
  },
  {
    key: "heritage.hero",
    group: "Editorial",
    label: "Heritage page hero",
    description: "The banner at the top of /heritage.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "Inside the Manama atelier",
    aspect: "16/10",
  },
];

export type MediaOverride = {
  slot: string;
  url: string;
  alt: string;
  updated_at: string;
};

export async function fetchAllMediaSlots(): Promise<Record<string, MediaOverride>> {
  const { data, error } = await supabase.from("mtm_media").select("*");
  if (error || !data) return {};
  const map: Record<string, MediaOverride> = {};
  for (const row of data as MediaOverride[]) map[row.slot] = row;
  return map;
}

export async function fetchMediaSlot(slot: string): Promise<MediaOverride | null> {
  const { data, error } = await supabase
    .from("mtm_media")
    .select("*")
    .eq("slot", slot)
    .maybeSingle();
  if (error || !data) return null;
  return data as MediaOverride;
}

export async function upsertMediaSlot(
  slot: string,
  url: string,
  alt: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_media").upsert(
    { slot, url, alt, updated_at: new Date().toISOString() },
    { onConflict: "slot" },
  );
  return { error: error?.message ?? null };
}

export async function deleteMediaSlot(slot: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_media").delete().eq("slot", slot);
  return { error: error?.message ?? null };
}

/** Upload an editorial image to the public mtm-media/editorial folder
 *  and return its public URL. Mirrors uploadOptionImage in adminData
 *  so the storage convention stays consistent. */
export async function uploadEditorialImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `editorial/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("mtm-media")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from("mtm-media").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Couldn't read the public URL after upload");
  return data.publicUrl;
}
