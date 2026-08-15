"use client";

import { supabase } from "./supabase";

/**
 * Role checks for the signed-in user, backed by the mtm_admins /
 * mtm_operators / mtm_employees tables.
 *
 * These helpers only decide whether a piece of UI is worth rendering. The
 * authoritative check is RLS in the database and assertAdmin / assertStaff on
 * the API routes; nothing here can grant access on its own.
 *
 * They used to SELECT the whole table and test membership in the browser,
 * which meant the RLS policies had to allow reading every row. Any signed-in
 * customer could therefore list every admin, operator and staff email address:
 * a ready-made target list for phishing or credential stuffing. Each helper now
 * asks only about its own address, so the policies can be narrowed to "you may
 * see your own row" and enumeration stops being possible.
 */

/** One cache per table, holding the answer for a single email. */
type Answer = { email: string; member: boolean };
const caches: Record<string, Answer | null> = { mtm_admins: null, mtm_operators: null, mtm_employees: null };
const inflight: Record<string, Promise<boolean> | null> = { mtm_admins: null, mtm_operators: null, mtm_employees: null };

async function isMember(table: string, email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const wanted = email.toLowerCase();

  const cached = caches[table];
  if (cached && cached.email === wanted) return cached.member;

  // A different user signed in; the previous answer is meaningless.
  if (cached && cached.email !== wanted) {
    caches[table] = null;
    inflight[table] = null;
  }

  if (!inflight[table]) {
    inflight[table] = (async () => {
      // Ask about this address only. RLS returns our row or nothing.
      const { data, error } = await supabase.from(table).select("email").ilike("email", wanted).limit(1);
      if (error) return false;
      return (data ?? []).length > 0;
    })();
  }
  const member = await inflight[table]!;
  caches[table] = { email: wanted, member };
  inflight[table] = null;
  return member;
}

function reset(table: string) {
  caches[table] = null;
  inflight[table] = null;
}

/** True if this email is on the admin allowlist. */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return isMember("mtm_admins", email);
}
export function resetAdminCache() {
  reset("mtm_admins");
}

/** Limited-access store staff. They reach ONLY the ERP image tool. */
export async function isOperator(email: string | null | undefined): Promise<boolean> {
  return isMember("mtm_operators", email);
}
export function resetOperatorCache() {
  reset("mtm_operators");
}

/** Internal staff enrolled in the Employee Learning Platform. They reach ONLY /learn. */
export async function isEmployee(email: string | null | undefined): Promise<boolean> {
  return isMember("mtm_employees", email);
}
export function resetEmployeeCache() {
  reset("mtm_employees");
}
