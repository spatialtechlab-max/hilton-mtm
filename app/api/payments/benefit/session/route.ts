/**
 * Start a BENEFIT payment for the current cart.
 *
 * Mirrors /api/payments/mpgs/session, but the money is computed by the shared
 * lib/checkoutPrep so the two rails cannot charge different amounts for the
 * same bag. Card details never touch this server: we only ask BENEFIT for a
 * hosted payment page and send the customer there.
 *
 * The order is NOT created here. It is promoted from mtm_pending_checkouts by
 * the notification handler, once BENEFIT confirms the funds cleared. An
 * abandoned or declined payment therefore leaves no order and an intact cart.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prepareCheckout, type ShipTo } from "@/lib/checkoutPrep";
import { getBenefitConfig, createPayment, newTrackId } from "@/lib/benefit";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";
import type { CartItem } from "@/lib/cart";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiltonmtm.com").replace(/\/$/, "");

export async function POST(req: Request) {
  const cfg = getBenefitConfig();
  if (!cfg) return NextResponse.json({ error: "BENEFIT isn't configured yet." }, { status: 503 });
  if (!SUPA_URL || !ANON || !SERVICE) {
    return NextResponse.json({ error: "Server env missing." }, { status: 500 });
  }

  // Authenticate the customer.
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error: ue } = await userClient.auth.getUser(token);
  if (ue || !u?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const user = u.user;

  // Each init call reserves a transaction at the gateway, so cap how fast one
  // account can open them.
  const byUser = rateLimit(`benefit:${user.id}`, 10, 15 * 60 * 1000);
  if (!byUser.ok) return tooMany(byUser.retryAfter, "Too many payment attempts. Please wait a few minutes.");
  const byIp = rateLimit(`benefit-ip:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!byIp.ok) return tooMany(byIp.retryAfter, "Too many payment attempts. Please wait a few minutes.");

  const body = await req.json().catch(() => ({}));
  const prep = await prepareCheckout({
    userId: user.id,
    userEmail: user.email ?? "",
    items: (Array.isArray(body?.items) ? body.items : []) as CartItem[],
    shipTo: (body?.shipTo ?? null) as ShipTo,
    discountCode: body?.discountCode ? String(body.discountCode) : null,
    profileName: String(body?.profileName ?? ""),
    profilePhone: String(body?.profilePhone ?? ""),
  });

  if (!prep.ok) {
    const { status, ...rest } = prep;
    return NextResponse.json(rest, { status });
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // trackId is the ONLY field BENEFIT echoes back that ties their notification
  // to this row, and the column is uniquely indexed. Retry on the astronomically
  // unlikely collision rather than failing the customer's checkout.
  let trackId = "";
  let pendingId = "";
  for (let attempt = 0; attempt < 3 && !pendingId; attempt++) {
    trackId = newTrackId();
    const id = `bnft${trackId}`;
    const { error } = await admin.from("mtm_pending_checkouts").insert({
      id,
      user_id: user.id,
      amount: prep.grandTotal,
      currency: "BHD",
      provider: "benefit",
      track_id: trackId,
      payload: { orderRow: prep.orderRow, lineRows: prep.lineRows },
      status: "pending",
    });
    if (!error) pendingId = id;
    else if (attempt === 2) {
      console.error("[benefit] could not stash pending checkout", error);
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }
  }

  // Their notification handler doubles as the error URL: it accepts their POST
  // on success and a browser GET on cancel. Keep both well under the gateway's
  // 254-character URL limit.
  const callback = `${SITE_URL}/api/payments/benefit/notify`;

  const payment = await createPayment(cfg, {
    amount: prep.grandTotal,
    trackId,
    responseUrl: callback,
    errorUrl: callback,
  });

  if (!payment.ok) {
    await admin.from("mtm_pending_checkouts").update({ status: "failed" }).eq("id", pendingId);
    console.error("[benefit] init rejected", payment.code, payment.error);
    return NextResponse.json({ error: payment.error, code: payment.code }, { status: 502 });
  }

  await admin.from("mtm_pending_checkouts")
    .update({ provider_payment_id: payment.paymentId })
    .eq("id", pendingId);

  return NextResponse.json({
    redirectUrl: payment.redirectUrl,
    paymentId: payment.paymentId,
    trackId,
    amount: prep.grandTotal,
  });
}
