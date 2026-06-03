"use client";

import { supabase } from "./supabase";

export { SETTINGS, defaultFor, type SettingDef } from "./settingsRegistry";

export type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

export async function fetchAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("mtm_settings").select("*");
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as SettingRow[]) map[row.key] = row.value;
  return map;
}

export async function upsertSetting(key: string, value: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  return { error: error?.message ?? null };
}

export async function deleteSetting(key: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_settings").delete().eq("key", key);
  return { error: error?.message ?? null };
}
