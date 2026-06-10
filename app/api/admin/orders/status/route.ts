/**
 * Ops endpoint: update an order's workshop status and email the customer.
 * Called by the Update Status form on /admin/orders/<order>.
 *
 * Auth: caller must be in mtm_admins. Writes the new status via service
 * role (bypassing the customer's RLS write policy), appends a status
 * history note, and fires sendOrderStatusEmail with Sebastian's voice
 * line so the customer gets the same phrasing they see in the bell.
 *
 * No-ops when the new status equals the existing one — saves a round
 * trip to Resend if the admin clicks Update without changing anything.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderStatusEmail } from "@/lib/email";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const STATUS_LABEL: Record<string, string> = {
  placed:           "Order placed",
  confirmed:        "Confirmed by atelier",
  cloth_received:   "Cloth received",
  cutting:          "On the cutting bench",
  in_production:    "In production",
  fitting_ready:    "Ready for fitting",
  finishing:        "Finishing",
  ready_for_pickup: "Ready for pickup",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

const SEBASTIAN_LINE: Record<string, string> = {
  placed:           "I've placed your commission with the cutter.",
  confirmed:        "The atelier has confirmed your commission.",
  cloth_received:   "Your cloth has arrived from the mill.",
  cutting:          "Your commission is on the cutting bench.",
  in_production:    "Your commission has moved into production.",
  fitting_ready:    "Your fitting is ready when you are.",
  finishing:        "We are at the finishing stage — almost there.",
  ready_for_pickup: "Your commission is ready for pickup at the atelier.",
  delivered:        "Your commission has been delivered. A pleasure to dress you.",
  cancelled:        "Your commission has been cancelled.",
};

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
  const status  = String(body?.status ?? "");
  if (!orderId || !status) return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  if (!STATUS_LABEL[status]) return NextResponse.json({ error: "Unknown status" }, { status: 400 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const { data: existing } = await admin
    .from("mtm_orders")
    .select("order_number,customer_email,customer_name,status")
    .eq("id", orderId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if ((existing as { status: string }).status === status) {
    return NextResponse.json({ saved: true, emailed: false, reason: "no-change" });
  }

  const { error: e1 } = await admin
    .from("mtm_orders")
    .update({ status })
    .eq("id", orderId);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  await admin.from("mtm_order_status_history").insert({
    order_id: orderId,
    status,
  });

  const order = existing as { order_number: string; customer_email: string; customer_name: string };
  const emailResult = await sendOrderStatusEmail({
    to: order.customer_email,
    name: order.customer_name,
    orderNumber: order.order_number,
    statusLabel: STATUS_LABEL[status],
    sebastianLine: SEBASTIAN_LINE[status] ?? "",
  });

  return NextResponse.json({ saved: true, emailed: emailResult.ok, emailError: emailResult.error ?? null });
}
