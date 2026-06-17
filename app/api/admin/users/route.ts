/**
 * Admin endpoint: list every registered user (JSON for /admin/users).
 *
 * Resolution order (handled in lib/adminUserData.ts):
 *   1. Best — SUPABASE_SERVICE_ROLE_KEY set. Enumerates auth.users directly,
 *      including signups that never finished a profile or placed an order.
 *   2. Fallback — no service-role key. Builds the list from mtm_orders ∪
 *      mtm_profiles; `partial: true` tells the UI to surface a notice.
 *
 * Each row now also carries the customer's saved measurements, so the table
 * and the Excel export (/api/admin/users/export) share one source of truth.
 *
 * Auth: caller sends the Supabase session JWT as Bearer; we check the email
 * is in mtm_admins before returning anything.
 */
import { NextResponse } from "next/server";
import { assertAdmin, gatherCustomers, type AdminUser } from "@/lib/adminUserData";

export type { AdminUser };

export async function GET(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const result = await gatherCustomers(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ users: result.users, partial: result.partial });
}
