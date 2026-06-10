"use client";

import { supabase } from "./supabase";

export type Address = {
  id: string;
  user_id: string;
  label?: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressInput = {
  label?: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  country: string;
  is_default?: boolean;
};

export const MAX_ADDRESSES = 5;

export async function listMyAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from("mtm_addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as Address[];
}

/** Create / update / set-default. When `is_default` is set true on the
 *  incoming row we first clear any other default for this user — the
 *  partial-unique index would otherwise reject the write. */
export async function upsertAddress(input: AddressInput, id?: string): Promise<{ data: Address | null; error: string | null }> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return { data: null, error: "Sign in required." };

  if (input.is_default) {
    // Clear other defaults first; the partial-unique index demands at
    // most one default per user.
    await supabase
      .from("mtm_addresses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true)
      .neq("id", id ?? "00000000-0000-0000-0000-000000000000");
  }

  const payload = {
    user_id: userId,
    label: input.label?.trim() || null,
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || null,
    city: input.city.trim(),
    country: input.country.trim() || "Bahrain",
    is_default: Boolean(input.is_default),
  };

  const q = id
    ? supabase.from("mtm_addresses").update(payload).eq("id", id).select().single()
    : supabase.from("mtm_addresses").insert(payload).select().single();
  const { data, error } = await q;
  return { data: (data as Address | null) ?? null, error: error?.message ?? null };
}

export async function deleteAddress(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mtm_addresses").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Mark `id` as the default and demote any other current default. */
export async function setDefaultAddress(id: string): Promise<{ error: string | null }> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return { error: "Sign in required." };
  await supabase
    .from("mtm_addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true)
    .neq("id", id);
  const { error } = await supabase
    .from("mtm_addresses")
    .update({ is_default: true })
    .eq("id", id);
  return { error: error?.message ?? null };
}
