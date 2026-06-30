/**
 * Admin endpoint for the Employee Learning Platform roster + tracker.
 *
 *   GET:    list every employee (mtm_employees) with their per-module
 *           progress rows (mtm_employee_progress), grouped by email.
 *   POST:   add an employee  { email, full_name? }  (upsert on email).
 *   DELETE: remove an employee  { email }.
 *
 * Auth: caller must be in mtm_admins (Bearer JWT). Writes use the service
 * role so they bypass the public-read / service-write RLS on mtm_employees.
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

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const [empRes, progRes] = await Promise.all([
    admin.from("mtm_employees").select("email, full_name, added_at").order("added_at", { ascending: true }),
    admin
      .from("mtm_employee_progress")
      .select("email, module_slug, lessons_completed, quiz_best_score, quiz_attempts, quiz_passed, updated_at"),
  ]);
  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });

  const progByEmail = new Map<string, ProgressRow[]>();
  for (const p of (progRes.data ?? []) as ProgressRow[]) {
    const key = (p.email ?? "").toLowerCase();
    if (!key) continue;
    const list = progByEmail.get(key) ?? [];
    list.push(p);
    progByEmail.set(key, list);
  }

  const employees = ((empRes.data ?? []) as EmployeeRow[]).map((e) => {
    const progress = progByEmail.get(e.email.toLowerCase()) ?? [];
    const lastActive = progress.reduce<string | null>(
      (max, p) => (!max || p.updated_at > max ? p.updated_at : max),
      null,
    );
    return { email: e.email, full_name: e.full_name, added_at: e.added_at, progress, lastActive };
  });

  return NextResponse.json({ employees });
}

export async function POST(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const fullName = String(body?.full_name ?? "").trim();
  if (!isEmail(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { error } = await admin
    .from("mtm_employees")
    .upsert({ email, full_name: fullName || null }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email });
}

export async function DELETE(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const { error } = await admin.from("mtm_employees").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
