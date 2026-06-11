"use client";

import { supabase } from "./supabase";

export type FreeShippingCountry = {
  id: string;
  country: string;
  created_at: string;
};

/** Normalised, case-insensitive comparison key for a country name. */
function key(country: string | null | undefined): string {
  return (country ?? "").trim().toLowerCase();
}

export async function listFreeShippingCountries(): Promise<FreeShippingCountry[]> {
  const { data, error } = await supabase
    .from("mtm_free_shipping_countries")
    .select("*")
    .order("country", { ascending: true });
  if (error) return [];
  return (data ?? []) as FreeShippingCountry[];
}

/** Lightweight predicate the cart and order pages use to decide whether to
 *  zero out the shipping fee for a given address. */
export function isFreeShippingCountry(
  country: string | null | undefined,
  free: { country: string }[] | string[],
): boolean {
  const k = key(country);
  if (!k) return false;
  return free.some((c) => key(typeof c === "string" ? c : c.country) === k);
}

/** Admin-only: add a country to the free-shipping list. Trim is applied so
 *  "  Bahrain " and "Bahrain" can't both exist; the case-insensitive unique
 *  index on the table catches accidental "BAHRAIN" duplicates too. */
export async function addFreeShippingCountry(country: string): Promise<{ error: string | null }> {
  const trimmed = country.trim();
  if (!trimmed) return { error: "Country is required." };
  const { error } = await supabase
    .from("mtm_free_shipping_countries")
    .insert({ country: trimmed });
  return { error: error?.message ?? null };
}

export async function deleteFreeShippingCountry(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mtm_free_shipping_countries")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}
