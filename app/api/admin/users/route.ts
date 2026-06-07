/**
 * Admin endpoint: list every registered user.
 *
 * Resolution order:
 *   1. Best — SUPABASE_SERVICE_ROLE_KEY in env. Enumerates auth.users
 *      directly via the admin API, including signups that never finished
 *      a profile or placed an order. Joins on mtm_profiles + mtm_orders
 *      for name / phone / city / spend.
 *   2. Fallback — no service-role key configured. Builds the list from
 *      mtm_orders (anyone who has placed an order) and mtm_profiles
 *      (anyone who has completed their profile). Users who only have an
 *      auth row will not appear; the response carries a `partial: true`
 *      flag so the UI can surface a notice.
 *
 * Auth: caller must send the Supabase session JWT as Bearer. We resolve
 * the email and check it's in mtm_admins before doing anything.
 */
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  orders_count: number;
  total_spent: number;
  profile_complete: boolean;
};

async function assertAdmin(req: Request): Promise<{ ok: true; email: string } | { ok: false; status: number; msg: string }> {
  if (!SUPA_URL || !ANON) return { ok: false, status: 500, msg: "Supabase env missing" };
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { ok: false, status: 401, msg: "Sign in required." };
  const userClient = createClient(SUPA_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return { ok: false, status: 401, msg: "Invalid session." };
  const email = u.user.email;
  const { data: allow } = await userClient.from("mtm_admins").select("email").eq("email", email);
  if (!allow || allow.length === 0) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true, email };
}

async function fetchProfilesMap(sb: SupabaseClient): Promise<Map<string, { full_name: string; phone: string; city: string; country: string }>> {
  const { data } = await sb.from("mtm_profiles").select("id, full_name, phone, city, country");
  const map = new Map<string, { full_name: string; phone: string; city: string; country: string }>();
  for (const r of data ?? []) map.set(r.id as string, {
    full_name: (r as { full_name?: string }).full_name ?? "",
    phone:     (r as { phone?: string }).phone ?? "",
    city:      (r as { city?: string }).city ?? "",
    country:   (r as { country?: string }).country ?? "",
  });
  return map;
}

async function fetchOrderStats(sb: SupabaseClient): Promise<Map<string, { count: number; total: number; email: string }>> {
  const { data } = await sb.from("mtm_orders").select("user_id, customer_email, subtotal, status");
  const map = new Map<string, { count: number; total: number; email: string }>();
  for (const r of data ?? []) {
    const uid = (r as { user_id?: string }).user_id;
    if (!uid) continue;
    const cur = map.get(uid) ?? { count: 0, total: 0, email: "" };
    cur.count += 1;
    if ((r as { status?: string }).status !== "cancelled") {
      cur.total += Number((r as { subtotal?: number }).subtotal ?? 0);
    }
    if (!cur.email) cur.email = (r as { customer_email?: string }).customer_email ?? "";
    map.set(uid, cur);
  }
  return map;
}

export async function GET(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !ANON) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });

  // Read profiles + order stats with the anon client (admin RLS lets the
  // admin email through). Same in both paths.
  const sb = createClient(SUPA_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
  });
  const [profiles, orderStats] = await Promise.all([fetchProfilesMap(sb), fetchOrderStats(sb)]);

  if (SERVICE) {
    // Full path — enumerate auth.users.
    const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
    const users: AdminUser[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      for (const u of data.users) {
        const profile = profiles.get(u.id);
        const stats = orderStats.get(u.id);
        users.push({
          id: u.id,
          email: u.email ?? "",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          full_name: profile?.full_name ?? null,
          phone:     profile?.phone ?? null,
          city:      profile?.city ?? null,
          country:   profile?.country ?? null,
          orders_count: stats?.count ?? 0,
          total_spent:  stats?.total ?? 0,
          profile_complete: Boolean(profile?.full_name && profile?.phone && profile?.city),
        });
      }
      if (data.users.length < perPage) break;
      page += 1;
    }
    return NextResponse.json({ users, partial: false });
  }

  // Fallback path — synthesise the list from profiles ∪ orders.
  const seen = new Map<string, AdminUser>();
  for (const [uid, p] of profiles) {
    const stats = orderStats.get(uid);
    seen.set(uid, {
      id: uid,
      email: stats?.email ?? "",
      created_at: "",
      last_sign_in_at: null,
      full_name: p.full_name || null,
      phone:     p.phone || null,
      city:      p.city || null,
      country:   p.country || null,
      orders_count: stats?.count ?? 0,
      total_spent:  stats?.total ?? 0,
      profile_complete: Boolean(p.full_name && p.phone && p.city),
    });
  }
  for (const [uid, s] of orderStats) {
    if (seen.has(uid)) continue;
    seen.set(uid, {
      id: uid,
      email: s.email,
      created_at: "",
      last_sign_in_at: null,
      full_name: null,
      phone:     null,
      city:      null,
      country:   null,
      orders_count: s.count,
      total_spent:  s.total,
      profile_complete: false,
    });
  }
  return NextResponse.json({ users: Array.from(seen.values()), partial: true });
}
