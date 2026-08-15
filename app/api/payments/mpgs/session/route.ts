/**
 * Create an MPGS hosted-checkout session for the current cart.
 *
 * The amount is recomputed entirely server-side — items the client sends are
 * priced from their own priceNum, the discount is re-validated, and VAT +
 * shipping come from lib/checkoutFees. The client never dictates what it pays.
 *
 * We stash the fully-priced order as a pending checkout (service role, RLS-
 * locked table) keyed by a freshly minted gateway reference. The real order is
 * only created later, in /verify, after MPGS confirms the funds cleared.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { computeOrderTotals, parseVatRate } from "@/lib/checkoutFees";
import { getMpgsConfig, createCheckoutSession } from "@/lib/mpgs";
import { missingMeasurements } from "@/lib/measurementRules";
import { repriceCart } from "@/lib/serverPricing";
import type { CartItem } from "@/lib/cart";
import type { MeasurementValues } from "@/lib/customizer";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

type ShipTo = { full_name?: string; phone?: string; line1: string; line2?: string | null; city: string; country: string };

export async function POST(req: Request) {
  const cfg = getMpgsConfig();
  if (!cfg) return NextResponse.json({ error: "Payment isn't configured yet." }, { status: 503 });
  if (!SUPA_URL || !ANON || !SERVICE) return NextResponse.json({ error: "Server env missing." }, { status: 500 });

  // Authenticate the customer.
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error: ue } = await userClient.auth.getUser(token);
  if (ue || !u?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const user = u.user;

  const body = await req.json().catch(() => ({}));
  const items: CartItem[] = Array.isArray(body?.items) ? body.items : [];
  const shipTo: ShipTo | null = body?.shipTo ?? null;
  const discountCode: string | null = body?.discountCode ? String(body.discountCode) : null;
  const profileName: string = String(body?.profileName ?? "");
  const profilePhone: string = String(body?.profilePhone ?? "");
  if (items.length === 0) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  if (!shipTo?.line1 || !shipTo?.city || !shipTo?.country) {
    return NextResponse.json({ error: "A shipping address is required." }, { status: 400 });
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // ── Measurements gate ─────────────────────────────────────────────────
  // Any commissioned line (custom != null) is cut to the customer's body, so
  // the relevant measurements must be on file before we take payment.
  // Accessories are exempt. Mirrors the cart's client gate; enforced here so
  // the order genuinely cannot be placed with missing measurements.
  const commissionCats = items.filter((i) => i.custom).map((i) => String(i.custom?.category ?? ""));
  if (commissionCats.length > 0) {
    const { data: meas } = await admin
      .from("mtm_measurements").select("values").eq("user_id", user.id).maybeSingle();
    const missing = missingMeasurements((meas as { values?: MeasurementValues } | null)?.values, commissionCats);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Please add your measurements before placing this order.", code: "measurements_required", missing },
        { status: 400 },
      );
    }
  }

  // ── Price it server-side ──────────────────────────────────────────────
  // Line prices are rebuilt from the ERP and the tier settings. They used to be
  // summed from the browser's own `priceNum`, which meant a customer could edit
  // the request and pay whatever they wanted: /verify then compared the capture
  // against that same manipulated figure and agreed with it. See lib/serverPricing.
  const repriced = await repriceCart(items);
  if (!repriced.ok) {
    return NextResponse.json({ error: repriced.error, sku: repriced.sku }, { status: 400 });
  }
  if (repriced.mismatches.length > 0) {
    // Not necessarily an attack: a price can move while a bag sits in
    // localStorage. Either way we charge our own number, and the customer is
    // told rather than silently billed something other than they saw.
    console.warn("[checkout] price mismatch", {
      user: user.id,
      lines: repriced.mismatches.map((m) => ({ sku: m.item.sku, claimed: m.clientClaimed, actual: m.unitPrice })),
    });
    return NextResponse.json({
      error: "Prices in your bag are out of date. Please review your bag and try again.",
      code: "price_changed",
      lines: repriced.mismatches.map((m) => ({ sku: m.item.sku, name: m.item.name, was: m.clientClaimed, now: m.unitPrice })),
    }, { status: 409 });
  }
  const grossSubtotal = repriced.subtotal;

  // Re-validate the discount against our own validate endpoint (identical rules).
  let discountSnapshot: { code: string; percent: number; amount: number } | null = null;
  if (discountCode) {
    try {
      const vr = await fetch(new URL("/api/discount-codes/validate", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotal: grossSubtotal }),
      });
      const vb = await vr.json().catch(() => ({}));
      if (vr.ok && vb?.valid) {
        discountSnapshot = { code: String(vb.code), percent: Number(vb.percent_off), amount: Number(vb.amount) };
      }
    } catch { /* fall through at full price */ }
  }

  const subtotal = discountSnapshot
    ? Math.max(0, Math.round((grossSubtotal - discountSnapshot.amount) * 100) / 100)
    : grossSubtotal;

  // Free shipping is decided here, never trusted from the client.
  let freeShipping = false;
  try {
    const { data: rows } = await admin.from("mtm_free_shipping_countries").select("country");
    const wanted = shipTo.country.trim().toLowerCase();
    freeShipping = (rows ?? []).some((r: { country: string }) => (r.country ?? "").trim().toLowerCase() === wanted);
  } catch { /* default: charge shipping */ }

  // VAT rate is the admin-set value (mtm_settings.vat.rate), resolved here so
  // the amount we actually charge matches what the cart shows the customer.
  const { data: vatRow } = await admin.from("mtm_settings").select("value").eq("key", "vat.rate").maybeSingle();
  const vatRate = parseVatRate((vatRow as { value?: string } | null)?.value);

  const totals = computeOrderTotals(subtotal, { freeShipping, vatRate });
  if (totals.grandTotal <= 0) return NextResponse.json({ error: "Nothing to charge." }, { status: 400 });

  // ── Build the order rows now; /verify just inserts them on CAPTURED ────
  const orderRow = {
    user_id: user.id,
    customer_name: (shipTo.full_name?.trim() || profileName || "").slice(0, 200),
    customer_email: user.email ?? "",
    customer_phone: shipTo.phone?.trim() || profilePhone || "",
    shipping_address: { line1: shipTo.line1, line2: shipTo.line2 ?? null, city: shipTo.city, country: shipTo.country },
    subtotal,
    currency: "BHD",
    discount_code: discountSnapshot?.code ?? null,
    discount_percent: discountSnapshot?.percent ?? null,
    discount_amount: discountSnapshot?.amount ?? null,
  };
  // Stored line prices come from the repricing, not the request, so the order
  // record and the amount actually charged can never disagree.
  const lineRows = repriced.items.map((p, idx) => {
    const i = items[idx];
    return {
      item_type: i.custom ? "commission" : "product",
      sku: i.sku,
      name: i.name,
      type_label: i.type,
      price_num: p.unitPrice,
      qty: p.qty,
      image: i.image,
      custom: i.custom ?? {},
    };
  });

  const orderRef = `hmtm${randomUUID().replace(/-/g, "")}`.slice(0, 40);
  const returnUrl = `${(SITE_URL || new URL(req.url).origin).replace(/\/$/, "")}/checkout/return?ref=${orderRef}`;

  // Stash the pending checkout BEFORE asking the gateway, so a captured
  // payment always has a row to promote.
  const { error: pErr } = await admin.from("mtm_pending_checkouts").insert({
    id: orderRef,
    user_id: user.id,
    amount: totals.grandTotal,
    currency: "BHD",
    payload: { orderRow, lineRows },
    status: "pending",
  });
  if (pErr) return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });

  const session = await createCheckoutSession(cfg, {
    orderRef,
    amount: totals.grandTotal,
    currency: "BHD",
    returnUrl,
    description: "Hilton Made to Measure commission",
  });
  if (!session.ok) {
    await admin.from("mtm_pending_checkouts").update({ status: "failed" }).eq("id", orderRef);
    return NextResponse.json({ error: session.error }, { status: 502 });
  }

  await admin.from("mtm_pending_checkouts")
    .update({ session_id: session.sessionId, success_indicator: session.successIndicator })
    .eq("id", orderRef);

  return NextResponse.json({ sessionId: session.sessionId, orderRef, amount: totals.grandTotal });
}
