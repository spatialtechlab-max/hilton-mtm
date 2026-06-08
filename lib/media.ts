"use client";

import { supabase } from "./supabase";
// The slot registry lives in a non-client module so server-rendered
// pages (homepage, library) can import MEDIA_SLOTS at build time
// without crossing the "use client" boundary in this file. Re-export
// it so callers don't have to know about the split.
export { MEDIA_SLOTS, type MediaSlot } from "./mediaSlots";

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
