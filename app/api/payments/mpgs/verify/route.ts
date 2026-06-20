/**
 * Verify an MPGS payment and promote the pending checkout into a real order.
 *
 * Source of truth is RETRIEVE_ORDER on the gateway — not the browser. We only
 * create the order if the gateway says the funds were CAPTURED for at least the
 * amount we expected. Idempotent: a refresh or double-submit returns the same
 * order, never a second one (unique index on mtm_orders.payment_ref).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMpgsConfig, retrieveOrder, bhd } from "@/lib/mpgs";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  const cfg = getMpgsConfig();
  if (!cfg) return NextResponse.json({ error: "Payment isn't configured yet." }, { status: 503 });
  if (!SUPA_URL || !ANON || !SERVICE) return NextResponse.json({ error: "Server env missing." }, { status: 500 });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error: ue } = await userClient.auth.getUser(token);
  if (ue || !u?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const user = u.user;

  const body = await req.json().catch(() => ({}));
  const orderRef = String(body?.ref ?? "");
  if (!orderRef) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const { data: pending } = await admin.from("mtm_pending_checkouts").select("*").eq("id", orderRef).maybeSingle();
  if (!pending) return NextResponse.json({ error: "Unknown checkout." }, { status: 404 });
  if (pending.user_id !== user.id) return NextResponse.json({ error: "Not your checkout." }, { status: 403 });

  // Already promoted — return the existing order (idempotent).
  if (pending.order_id) {
    const { data: existing } = await admin.from("mtm_orders").select("order_number").eq("id", pending.order_id).maybeSingle();
    if (existing) return NextResponse.json({ ok: true, orderNumber: existing.order_number });
  }

  // Ask the gateway what actually happened.
  const r = await retrieveOrder(cfg, orderRef);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  const captured = r.order.status === "CAPTURED" && r.order.totalCaptured + 1e-6 >= bhd(Number(pending.amount));
  if (r.order.result !== "SUCCESS" || !captured) {
    await admin.from("mtm_pending_checkouts").update({ status: "failed" }).eq("id", orderRef);
    return NextResponse.json({ ok: false, status: r.order.status || r.order.result || "INCOMPLETE" });
  }

  // Promote: insert the order + items.
  const payload = pending.payload as { orderRow: Record<string, unknown>; lineRows: Record<string, unknown>[] };
  const { data: order, error: oErr } = await admin
    .from("mtm_orders")
    .insert({
      ...payload.orderRow,
      payment_ref: orderRef,
      payment_status: "CAPTURED",
      paid_total: bhd(Number(pending.amount)),
      paid_at: new Date().toISOString(),
    })
    .select("id, order_number")
    .single();

  if (oErr || !order) {
    // Likely a concurrent verify already inserted it — re-read by payment_ref.
    const { data: dup } = await admin.from("mtm_orders").select("id, order_number").eq("payment_ref", orderRef).maybeSingle();
    if (dup) {
      await admin.from("mtm_pending_checkouts").update({ status: "consumed", order_id: dup.id }).eq("id", orderRef);
      return NextResponse.json({ ok: true, orderNumber: dup.order_number });
    }
    return NextResponse.json({ ok: false, error: "Payment cleared but the order could not be saved. Please contact the atelier." }, { status: 500 });
  }

  const lineRows = payload.lineRows.map((l) => ({ ...l, order_id: order.id }));
  await admin.from("mtm_order_items").insert(lineRows);
  await admin.from("mtm_pending_checkouts").update({ status: "consumed", order_id: order.id }).eq("id", orderRef);

  return NextResponse.json({ ok: true, orderNumber: order.order_number, orderId: order.id });
}
