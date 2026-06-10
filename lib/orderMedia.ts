"use client";

import { supabase } from "./supabase";

export type OrderView = "front" | "back" | "left" | "right";

export const ORDER_VIEWS: OrderView[] = ["front", "back", "left", "right"];

export const ORDER_VIEW_LABEL: Record<OrderView, string> = {
  front: "Front",
  back:  "Back",
  left:  "Left side",
  right: "Right side",
};

export type OrderMediaRow = {
  id: string;
  order_id: string;
  view: OrderView;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
};

const BUCKET = "order-media";

/** Upload (or replace) a single body photo for a specific order + view.
 *  Path is `{user_id}/{orderId}/{view}.{ext}` so storage RLS can
 *  reliably authorise based on the leading folder. */
export async function uploadOrderPhoto(
  orderId: string,
  userId: string,
  view: OrderView,
  file: File,
): Promise<{ data: OrderMediaRow | null; error: string | null }> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const storagePath = `${userId}/${orderId}/${view}.${ext || "jpg"}`;

  // Storage: upsert so re-uploading the same view replaces the prior
  // object instead of erroring on the unique-path collision.
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });
  if (upErr) return { data: null, error: upErr.message };

  // Database: clear any previous row for this (order, view), then insert.
  // We can't rely on insert+conflict-do-update without a CHECK to ensure
  // we don't add a second row with a different storage_path.
  await supabase.from("mtm_order_media").delete()
    .eq("order_id", orderId).eq("view", view);

  const { data, error } = await supabase
    .from("mtm_order_media")
    .insert({
      order_id:     orderId,
      view,
      storage_path: storagePath,
      content_type: file.type || null,
      size_bytes:   file.size,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as OrderMediaRow, error: null };
}

export async function listOrderPhotos(orderId: string): Promise<OrderMediaRow[]> {
  const { data, error } = await supabase
    .from("mtm_order_media")
    .select("*")
    .eq("order_id", orderId);
  if (error) return [];
  return (data ?? []) as OrderMediaRow[];
}

export async function deleteOrderPhoto(row: OrderMediaRow): Promise<{ error: string | null }> {
  // Remove the storage object first (best-effort), then the row.
  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  const { error } = await supabase.from("mtm_order_media").delete().eq("id", row.id);
  return { error: error?.message ?? null };
}

/** Signed URL valid for a few minutes — used by the admin order page
 *  (and the customer's own order view) to render each photo without
 *  exposing the bucket publicly. */
export async function signedUrlFor(storagePath: string, expiresInSeconds = 600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
