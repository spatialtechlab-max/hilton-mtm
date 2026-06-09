/**
 * Ops endpoint: save courier dispatch details and email the customer.
 * Called by the dispatch form on /admin/orders/<order>.
 *
 * Auth: caller must be in mtm_admins. Writes the four courier_* columns
 * on mtm_orders via service-role (so we can stamp dispatched_at + bypass
 * the customer's RLS write policy), posts a status history note, and
 * fires sendCourierDispatchEmail to the customer's email.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCourierDispatchEmail } from "@/lib/email";

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

export async function POST(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const orderId = String(body?.orderId ?? "");
  const courier = String(body?.courier_name ?? "").trim();
  const tracking = String(body?.tracking_number ?? "").trim();
  const trackingUrl = String(body?.tracking_url ?? "").trim();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  if (!courier || !tracking) {
    return NextResponse.json({ error: "Courier name and tracking number are required." }, { status: 400 });
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const dispatchedAt = new Date().toISOString();
  const { data: updated, error: e1 } = await admin
    .from("mtm_orders")
    .update({
      courier_name: courier,
      tracking_number: tracking,
      tracking_url: trackingUrl || null,
      dispatched_at: dispatchedAt,
      status: "delivered",
    })
    .eq("id", orderId)
    .select("order_number,customer_email,customer_name,status")
    .maybeSingle();
  if (e1 || !updated) return NextResponse.json({ error: e1?.message ?? "Update failed" }, { status: 500 });

  // Append a status history note so the customer's timeline shows the
  // dispatch event with the courier details inline.
  const note = `Dispatched via ${courier} · tracking ${tracking}${trackingUrl ? ` · ${trackingUrl}` : ""}`;
  await admin.from("mtm_order_status_history").insert({
    order_id: orderId,
    status: (updated as { status: string }).status,
    note,
  });

  const order = updated as { order_number: string; customer_email: string; customer_name: string };
  const emailResult = await sendCourierDispatchEmail({
    to: order.customer_email,
    name: order.customer_name,
    orderNumber: order.order_number,
    courierName: courier,
    trackingNumber: tracking,
    trackingUrl: trackingUrl || undefined,
  });

  return NextResponse.json({ saved: true, emailed: emailResult.ok, emailError: emailResult.error ?? null });
}
