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

// ── Operators ──────────────────────────────────────────────────────────────
// Limited-access store staff (mtm_operators). They reach ONLY the ERP image
// tool, never the rest of admin. Same memoised, client-visible pattern.
let opCached: Set<string> | null = null;
let opInflight: Promise<Set<string>> | null = null;

async function loadOperators(): Promise<Set<string>> {
  const { data, error } = await supabase.from("mtm_operators").select("email");
  if (error || !data) return new Set();
  return new Set(data.map((r) => String(r.email).toLowerCase()));
}

/** Returns true if the email is in the mtm_operators table. */
export async function isOperator(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (!opCached) {
    opInflight = opInflight ?? loadOperators();
    opCached = await opInflight;
  }
  return opCached.has(email.toLowerCase());
}

export function resetOperatorCache() {
  opCached = null;
  opInflight = null;
}

// ── Employees ────────────────────────────────────────────────────────────────
// Internal staff enrolled in the Employee Learning Platform (mtm_employees).
// They reach ONLY /learn, never the rest of admin. Same memoised,
// client-visible pattern as admins and operators.
let empCached: Set<string> | null = null;
let empInflight: Promise<Set<string>> | null = null;

async function loadEmployees(): Promise<Set<string>> {
  const { data, error } = await supabase.from("mtm_employees").select("email");
  if (error || !data) return new Set();
  return new Set(data.map((r) => String(r.email).toLowerCase()));
}

/** Returns true if the email is in the mtm_employees table. */
export async function isEmployee(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (!empCached) {
    empInflight = empInflight ?? loadEmployees();
    empCached = await empInflight;
  }
  return empCached.has(email.toLowerCase());
}

export function resetEmployeeCache() {
  empCached = null;
  empInflight = null;
}
