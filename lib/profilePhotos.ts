"use client";

import { supabase } from "./supabase";

/**
 * Body photographs kept on the customer's PROFILE (not per order), so the
 * cutter has them for every commission and the customer uploads once.
 * Optional. Four labelled views: front, back, left, right.
 *
 * Storage: the same private `order-media` bucket, under a per-user folder
 * `{user_id}/profile/{view}.{ext}`. The bucket's RLS authorises on the
 * leading user-id folder, so no new table/migration is needed — the folder
 * listing is the source of truth.
 */

export type ProfileView = "front" | "back" | "left" | "right";

export const PROFILE_VIEWS: ProfileView[] = ["front", "back", "left", "right"];

export const PROFILE_VIEW_LABEL: Record<ProfileView, string> = {
  front: "Front",
  back:  "Back",
  left:  "Left side",
  right: "Right side",
};

const BUCKET = "order-media";
const folderFor = (userId: string) => `${userId}/profile`;

export type ProfilePhotoMap = Partial<Record<ProfileView, { path: string; url: string }>>;

/** Remove any stored file for a view (the extension can vary jpg/png/…). */
export async function deleteProfilePhoto(userId: string, view: ProfileView): Promise<void> {
  const { data } = await supabase.storage.from(BUCKET).list(folderFor(userId));
  if (!data) return;
  const toRemove = data
    .filter((f) => f.name.split(".")[0] === view)
    .map((f) => `${folderFor(userId)}/${f.name}`);
  if (toRemove.length) await supabase.storage.from(BUCKET).remove(toRemove);
}

/** Upload (replacing any prior file for this view). */
export async function uploadProfilePhoto(
  userId: string,
  view: ProfileView,
  file: File,
): Promise<{ error: string | null }> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  await deleteProfilePhoto(userId, view); // clear other-extension leftovers
  const path = `${folderFor(userId)}/${view}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  return { error: error?.message ?? null };
}

/** Current photos as a map of view -> { path, signed url }. */
export async function listProfilePhotos(userId: string): Promise<ProfilePhotoMap> {
  const { data, error } = await supabase.storage.from(BUCKET).list(folderFor(userId));
  if (error || !data) return {};
  const out: ProfilePhotoMap = {};
  for (const f of data) {
    const base = f.name.split(".")[0] as ProfileView;
    if (!PROFILE_VIEWS.includes(base)) continue;
    const path = `${folderFor(userId)}/${f.name}`;
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (signed?.signedUrl) out[base] = { path, url: signed.signedUrl };
  }
  return out;
}

/** Count of distinct views uploaded (used by the profile-completion bar). */
export function countProfilePhotos(map: ProfilePhotoMap): number {
  return PROFILE_VIEWS.filter((v) => map[v]).length;
}
