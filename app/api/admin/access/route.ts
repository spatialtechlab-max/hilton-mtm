/**
 * Admin endpoint for Team Access — the unified roster of people who hold the
 * Operator role (mtm_operators, grants the ERP image tool at /admin/erp) and/or
 * the Staff/Training role (mtm_employees, grants the learning platform at
 * /learn). A "person" is an email that appears in either table; a single email
 * may hold BOTH roles.
 *
 *   GET:    union of both tables, one entry per email
 *             [{ email, fullName, isOperator, isStaff, progress?, lastActive? }]
 *           progress (per-module completion + quiz best score + last active) is
 *           included only for people who hold the Staff role.
 *   POST:   add a person  { email, fullName?, operator, staff }
 *           upserts into whichever role tables are flagged true. Idempotent.
 *   PATCH:  flip one role  { email, role: "operator"|"staff", enabled }
 *           inserts / deletes the row in the matching table.
 *   DELETE: remove a person entirely  { email }  (deletes from BOTH tables).
 *
 * Auth: caller must be in mtm_admins (Bearer JWT) — operators and staff cannot
 * call this. Writes use the service role so they bypass the service-write RLS
 * on mtm_operators / mtm_employees.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function assertAdmin(req: Request): Promise<{ ok: true; email: string } | { ok: false; status: number; msg: string }> {
  if (!SUPA_URL || !ANON) return { ok: false, status: 500, msg: "Supabase env missing" };
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { ok: false, status: 401, msg: "Sign in required." };
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return { ok: false, status: 401, msg: "Invalid session." };
  const { data: allow } = await userClient.from("mtm_admins").select("email").eq("email", u.user.email);
  if (!allow || allow.length === 0) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true, email: u.user.email };
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function serviceClient() {
  return createClient(SUPA_URL!, SERVICE!, { auth: { persistSession: false } });
}

type OperatorRow = { email: string; created_at: string };
type EmployeeRow = { email: string; full_name: string | null; added_at: string };
type ProgressRow = {
  email: string | null;
  module_slug: string;
  lessons_completed: string[];
  quiz_best_score: number | null;
  quiz_attempts: number;
  quiz_passed: boolean;
  updated_at: string;
};

export async function GET(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const admin = serviceClient();
  const [opRes, empRes, progRes] = await Promise.all([
    admin.from("mtm_operators").select("email, created_at").order("created_at", { ascending: true }),
    admin.from("mtm_employees").select("email, full_name, added_at").order("added_at", { ascending: true }),
    admin
      .from("mtm_employee_progress")
      .select("email, module_slug, lessons_completed, quiz_best_score, quiz_attempts, quiz_passed, updated_at"),
  ]);
  if (opRes.error) return NextResponse.json({ error: opRes.error.message }, { status: 500 });
  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });

  // Progress rows grouped by lowercased email (only staff have these).
  const progByEmail = new Map<string, ProgressRow[]>();
  for (const p of (progRes.data ?? []) as ProgressRow[]) {
    const key = (p.email ?? "").toLowerCase();
    if (!key) continue;
    const list = progByEmail.get(key) ?? [];
    list.push(p);
    progByEmail.set(key, list);
  }

  // Union of both tables, keyed on lowercased email. Preserve the first-seen
  // display email + a stable sort (staff added_at / operator created_at).
  type Person = {
    email: string;
    fullName: string | null;
    isOperator: boolean;
    isStaff: boolean;
    progress: ProgressRow[];
    lastActive: string | null;
    _sort: string;
  };
  const byKey = new Map<string, Person>();

  const ensure = (rawEmail: string, sort: string): Person => {
    const key = rawEmail.toLowerCase();
    let person = byKey.get(key);
    if (!person) {
      person = { email: rawEmail, fullName: null, isOperator: false, isStaff: false, progress: [], lastActive: null, _sort: sort };
      byKey.set(key, person);
    } else if (sort < person._sort) {
      person._sort = sort;
    }
    return person;
  };

  for (const op of (opRes.data ?? []) as OperatorRow[]) {
    const person = ensure(op.email, op.created_at ?? "");
    person.isOperator = true;
  }
  for (const emp of (empRes.data ?? []) as EmployeeRow[]) {
    const person = ensure(emp.email, emp.added_at ?? "");
    person.isStaff = true;
    if (emp.full_name) person.fullName = emp.full_name;
    const progress = progByEmail.get(emp.email.toLowerCase()) ?? [];
    person.progress = progress;
    person.lastActive = progress.reduce<string | null>(
      (max, p) => (!max || p.updated_at > max ? p.updated_at : max),
      null,
    );
  }

  const people = [...byKey.values()]
    .sort((a, b) => (a._sort < b._sort ? -1 : a._sort > b._sort ? 1 : 0))
    .map((p) => ({
      email: p.email,
      fullName: p.fullName,
      isOperator: p.isOperator,
      isStaff: p.isStaff,
      progress: p.progress,
      lastActive: p.lastActive,
    }));

  return NextResponse.json({ people });
}

export async function POST(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const fullName = String(body?.fullName ?? "").trim();
  const operator = body?.operator === true;
  const staff = body?.staff === true;
  if (!isEmail(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!operator && !staff) return NextResponse.json({ error: "Pick at least one role." }, { status: 400 });

  const admin = serviceClient();
  if (operator) {
    const { error } = await admin
      .from("mtm_operators")
      .upsert({ email, created_by: gate.email }, { onConflict: "email" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (staff) {
    const { error } = await admin
      .from("mtm_employees")
      .upsert({ email, full_name: fullName || null }, { onConflict: "email" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email });
}

export async function PATCH(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = String(body?.role ?? "");
  const enabled = body?.enabled === true;
  if (!isEmail(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (role !== "operator" && role !== "staff") return NextResponse.json({ error: "Unknown role." }, { status: 400 });

  const admin = serviceClient();
  const table = role === "operator" ? "mtm_operators" : "mtm_employees";
  if (enabled) {
    const row = role === "operator" ? { email, created_by: gate.email } : { email };
    const { error } = await admin.from(table).upsert(row as { email: string }, { onConflict: "email" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from(table).delete().eq("email", email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const url = new URL(req.url);
  const email = String(body?.email ?? url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const admin = serviceClient();
  const [op, emp] = await Promise.all([
    admin.from("mtm_operators").delete().eq("email", email),
    admin.from("mtm_employees").delete().eq("email", email),
  ]);
  if (op.error) return NextResponse.json({ error: op.error.message }, { status: 500 });
  if (emp.error) return NextResponse.json({ error: emp.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
