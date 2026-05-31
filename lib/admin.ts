"use client";

import { supabase } from "./supabase";

/**
 * Admin allowlist — backed by the Supabase `mtm_admins` table only. The list
 * is NOT shipped to the client bundle (no public env var). The shop owner
 * controls who's in `mtm_admins` from inside the database.
 *
 * The authoritative write-access check lives in RLS; this helper just decides
 * whether the /admin UI is visible to a signed-in user.
 */

let cached: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

async function loadAdmins(): Promise<Set<string>> {
  const { data, error } = await supabase.from("mtm_admins").select("email");
  if (error || !data) return new Set();
  return new Set(data.map((r) => String(r.email).toLowerCase()));
}

/** Returns true if the email is in the mtm_admins table. Memoised per page load. */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (!cached) {
    inflight = inflight ?? loadAdmins();
    cached = await inflight;
  }
  return cached.has(email.toLowerCase());
}

/** Clear the cache (e.g. after admin list edits). */
export function resetAdminCache() {
  cached = null;
  inflight = null;
}
