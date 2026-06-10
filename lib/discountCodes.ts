"use client";

import { supabase } from "./supabase";

/** Shared shape for discount-code rows. */
export type DiscountCode = {
  id: string;
  code: string;
  percent_off: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** Code validation: exactly 5 chars — first 3 A–Z/0–9, last 2 digits.
 *  Mirrors the CHECK constraint on the table so the admin form fails
 *  fast before hitting the database. */
export const CODE_REGEX = /^[A-Z0-9]{3}[0-9]{2}$/;
export function isValidCodeFormat(code: string): boolean {
  return CODE_REGEX.test(code);
}

/** Admin-only: list all codes (active + inactive, expired or not). */
export async function listAllDiscountCodes(): Promise<DiscountCode[]> {
  const { data, error } = await supabase
    .from("mtm_discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscountCode[];
}

export type DiscountCodeInput = {
  code: string;
  percent_off: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

export async function upsertDiscountCode(input: DiscountCodeInput, id?: string): Promise<DiscountCode> {
  const payload = {
    code: input.code.trim().toUpperCase(),
    percent_off: input.percent_off,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    active: input.active,
  };
  const q = id
    ? supabase.from("mtm_discount_codes").update(payload).eq("id", id).select().single()
    : supabase.from("mtm_discount_codes").insert(payload).select().single();
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as DiscountCode;
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const { error } = await supabase.from("mtm_discount_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** What the customer's cart sees after applying a code. */
export type AppliedDiscount = {
  code: string;
  percent_off: number;
  amount: number; // BHD off, rounded to 2 decimals
};
