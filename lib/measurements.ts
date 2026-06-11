"use client";

import { supabase } from "./supabase";
import type { MeasurementUnit, MeasurementValues } from "./customizer";

export type SavedMeasurements = {
  user_id: string;
  values: MeasurementValues;
  unit: MeasurementUnit;
  updated_at: string;
};

/** Fetch the signed-in customer's saved measurement row. Returns null when
 *  they haven't entered any measurements yet (no row in mtm_measurements). */
export async function fetchMyMeasurements(): Promise<SavedMeasurements | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user?.id) return null;
  const { data, error } = await supabase
    .from("mtm_measurements")
    .select("*")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as SavedMeasurements;
}

/** Upsert the customer's measurement values. Empty strings are stripped so
 *  the JSON only holds the numbers they actually entered. */
export async function saveMyMeasurements(values: MeasurementValues, unit: MeasurementUnit): Promise<{ error: string | null }> {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user?.id) return { error: "Sign in required." };
  const clean: MeasurementValues = {};
  for (const [k, v] of Object.entries(values)) {
    const trimmed = (v ?? "").trim();
    if (trimmed) clean[k] = trimmed;
  }
  const { error } = await supabase
    .from("mtm_measurements")
    .upsert(
      { user_id: u.user.id, values: clean, unit, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  return { error: error?.message ?? null };
}

/** Count of non-empty saved values — used by the profile completion bar. */
export function countSavedMeasurements(values: MeasurementValues | null | undefined): number {
  if (!values) return 0;
  return Object.values(values).filter((v) => (v ?? "").toString().trim() !== "").length;
}
