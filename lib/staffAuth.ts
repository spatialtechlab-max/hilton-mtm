/**
 * Shared staff gate for the ERP admin/operator API routes. A request is allowed
 * if its Bearer token belongs to a user whose email is in mtm_admins OR
 * mtm_operators. Returns the email on success so callers can log who acted.
 */
import { createClient } from "@supabase/supabase-js";

export type StaffGate = { ok: true; email: string } | { ok: false; status: number; msg: string };

export async function assertStaff(req: Request): Promise<StaffGate> {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPA_URL || !ANON) return { ok: false, status: 500, msg: "Supabase env missing" };
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return { ok: false, status: 401, msg: "Sign in required." };
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error } = await userClient.auth.getUser(token);
  if (error || !u?.user?.email) return { ok: false, status: 401, msg: "Invalid session." };
  const email = u.user.email;
  const [adm, op] = await Promise.all([
    userClient.from("mtm_admins").select("email").ilike("email", email),
    userClient.from("mtm_operators").select("email").ilike("email", email),
  ]);
  if ((adm.data?.length ?? 0) === 0 && (op.data?.length ?? 0) === 0) return { ok: false, status: 403, msg: "Not authorised." };
  return { ok: true, email };
}
