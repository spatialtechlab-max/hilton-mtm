/**
 * BENEFIT merchant-notification handler. This is the `responseURL` we hand the
 * gateway, and it is the single most failure-sensitive route on the site.
 *
 * WHY THE ORDERING IS WHAT IT IS
 * The gateway POSTs the encrypted result here and WAITS for an acknowledgement.
 * If we do not answer in time, "PG will initiate the VOID transaction to
 * respective scheme to reverse the transaction" (guide, page 39). So a slow
 * database write here does not merely delay an order, it reverses a payment the
 * customer has already authorised.
 *
 * Their prescribed order is therefore:
 *   1. Log the raw response to a file on this server, as a backup.
 *   2. Print "REDIRECT=<url>".
 *   3. Only then do internal work.
 *
 * Next's `after()` runs a callback once the response has been flushed, which
 * gives us exactly that: the gateway is acknowledged immediately and the order
 * is promoted afterwards. Note this is the OPPOSITE of our MPGS /verify route,
 * which does its database work first and redirects last. Do not "make them
 * consistent" by copying that shape here.
 *
 * The body must be plain text containing only the REDIRECT line. Their guide is
 * explicit that when merchant notification is on, "any HTML, CSS and Javascript
 * codes are not allowed" in this response.
 */
import { after } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import {
  getBenefitConfig, parseNotification, isCaptured, type BenefitNotification,
} from "@/lib/benefit";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { computeOrderTotals, parseVatRate } from "@/lib/checkoutFees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiltonmtm.com").replace(/\/$/, "");

/** Their backup-file recommendation. Best effort: never block the ack. */
async function logRaw(line: string): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "logs");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "benefit-notifications.log"), line + "\n", "utf8");
  } catch (e) {
    console.error("[benefit] could not write the backup log", e);
  }
}

/** The response body the gateway expects. Plain text, nothing else in it. */
function redirect(to: string): Response {
  return new Response(`REDIRECT=${to}`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request): Promise<Response> {
  const cfg = getBenefitConfig();

  // Read the posted form. They send application/x-www-form-urlencoded.
  let trandata = "";
  try {
    const form = await req.formData();
    trandata = String(form.get("trandata") ?? "");
  } catch {
    try {
      trandata = new URLSearchParams(await req.text()).get("trandata") ?? "";
    } catch { /* leave blank, handled below */ }
  }

  // 1. Backup log BEFORE anything can throw.
  await logRaw(JSON.stringify({ at: new Date().toISOString(), trandata: trandata.slice(0, 4000) }));

  if (!cfg || !SUPA_URL || !SERVICE) {
    console.error("[benefit] notification arrived but the server is not configured");
    return redirect(`${SITE_URL}/checkout/benefit/return?state=error`);
  }

  const note = trandata ? parseNotification(trandata, cfg.resourceKey) : null;
  if (!note) {
    // Either noise or a forged post. We cannot decrypt it, so there is nothing
    // to promote and nobody to bill. Acknowledge and send to a neutral page.
    console.error("[benefit] undecryptable notification");
    return redirect(`${SITE_URL}/checkout/benefit/return?state=error`);
  }

  const paid = isCaptured(note);
  const target = `${SITE_URL}/checkout/benefit/return?ref=${encodeURIComponent(note.trackId)}`
    + `&state=${paid ? "paid" : "failed"}`;

  // 2. Acknowledge now. 3. Promote the order after the response is flushed.
  after(async () => {
    try {
      await settle(note, paid);
    } catch (e) {
      // The raw payload is already on disk, so a failure here is recoverable by
      // hand. It must never turn into an unacknowledged notification.
      console.error("[benefit] post-acknowledgement settlement failed", note.trackId, e);
    }
  });

  return redirect(target);
}

/**
 * Promote the pending checkout into a real order.
 *
 * Idempotent on payment_ref: the gateway can retry a notification, and the
 * customer's browser may also land on the return page, so this can run more
 * than once for one payment and must only ever create a single order.
 */
async function settle(note: BenefitNotification, paid: boolean): Promise<void> {
  const admin = createClient(SUPA_URL!, SERVICE!, { auth: { persistSession: false } });

  const { data: pending } = await admin
    .from("mtm_pending_checkouts")
    .select("id,user_id,amount,payload,status,provider")
    .eq("track_id", note.trackId)
    .maybeSingle();

  if (!pending) {
    console.error("[benefit] no pending checkout for trackId", note.trackId);
    return;
  }

  if (!paid) {
    await admin.from("mtm_pending_checkouts")
      .update({ status: "failed", provider_payment_id: note.paymentId })
      .eq("id", pending.id);
    return;
  }

  // Never promote on the gateway's word alone about the amount: confirm they
  // captured at least what we asked for. A short capture must not become a
  // fulfilled commission.
  const captured = Number(note.amt);
  const expected = Number(pending.amount);
  if (!Number.isFinite(captured) || captured + 0.0005 < expected) {
    console.error("[benefit] captured less than expected", { trackId: note.trackId, captured, expected });
    await admin.from("mtm_pending_checkouts")
      .update({ status: "underpaid", provider_payment_id: note.paymentId })
      .eq("id", pending.id);
    return;
  }

  // Already promoted? Then this is a repeat notification: stop here.
  const { data: existing } = await admin
    .from("mtm_orders").select("id").eq("payment_ref", note.paymentId).maybeSingle();
  if (existing) return;

  const payload = pending.payload as { orderRow: Record<string, unknown>; lineRows: Record<string, unknown>[] };
  const { data: order, error: oErr } = await admin
    .from("mtm_orders")
    .insert({
      ...payload.orderRow,
      payment_ref: note.paymentId,
      payment_provider: "benefit",
      payment_track_id: note.trackId,
      payment_status: "paid",
      paid_total: captured,
      paid_at: new Date().toISOString(),
    })
    .select("id,order_number")
    .single();

  if (oErr || !order) {
    console.error("[benefit] order insert failed", note.trackId, oErr);
    return;
  }

  const lines = payload.lineRows.map((l) => ({ ...l, order_id: order.id }));
  const { error: lErr } = await admin.from("mtm_order_items").insert(lines);
  if (lErr) console.error("[benefit] line insert failed", order.order_number, lErr);

  await admin.from("mtm_pending_checkouts")
    .update({ status: "completed", provider_payment_id: note.paymentId })
    .eq("id", pending.id);

  // Confirmation email, sent DIRECTLY rather than by POSTing to our own
  // /api/notify/order-confirmation.
  //
  // That route authenticates the CUSTOMER (Bearer JWT, then checks the order
  // belongs to them). This handler runs from the gateway's server-to-server
  // callback and has no user session at all, so the self-call returned 401 and
  // a silent catch swallowed it: the customer paid, the order appeared, and no
  // confirmation email was ever sent. Caught on a real BenefitPay payment,
  // order HMTM-2026-0002.
  //
  // Same shape as the discount bug fixed earlier in this project. A route
  // calling itself over the network to do work it could do in-process buys
  // nothing and hides failures.
  try {
    await sendConfirmation(admin, order.id);
  } catch (e) {
    // Never undo a paid order over an email failure.
    console.error("[benefit] confirmation email failed for", order.order_number, e);
  }
}

/** Assemble and send the order confirmation, mirroring the customer-facing route. */
async function sendConfirmation(
  // Typed loosely on purpose: createClient's generics resolve differently at
  // the call site than in this signature, and the only thing that matters here
  // is that it is a service-role client.
  admin: SupabaseClient,
  orderId: string,
): Promise<void> {
  const { data: order } = await admin.from("mtm_orders").select("*").eq("id", orderId).single();
  if (!order) return;

  const { data: items } = await admin.from("mtm_order_items").select("*").eq("order_id", orderId);

  const o = order as Record<string, never> & {
    subtotal: number; customer_email: string; customer_name: string; order_number: string;
    shipping_address?: { line1?: string; city?: string; country?: string };
    discount_code?: string | null; discount_percent?: number | null; discount_amount?: number | null;
  };

  const shipCountry = o.shipping_address?.country ?? null;
  const { data: free } = await admin.from("mtm_free_shipping_countries").select("country");
  const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  const freeShipping = !!norm(shipCountry)
    && !!free?.some((r: { country: string }) => norm(r.country) === norm(shipCountry));

  const { data: vatRow } = await admin
    .from("mtm_settings").select("value").eq("key", "vat.rate").maybeSingle();
  const vatRate = parseVatRate((vatRow as { value?: string } | null)?.value);
  const subtotal = Number(o.subtotal ?? 0);
  const totals = computeOrderTotals(subtotal, { freeShipping, vatRate });

  type Item = { name: string; type_label: string; qty: number; price_num: number; image?: string | null };
  await sendOrderConfirmationEmail({
    to: o.customer_email,
    name: o.customer_name,
    orderNumber: o.order_number,
    items: ((items as Item[]) ?? []).map((i) => ({
      name: i.name, type_label: i.type_label, qty: i.qty, price_num: i.price_num, image: i.image ?? null,
    })),
    subtotal,
    shippingAddressLine1: o.shipping_address?.line1,
    shippingCity: o.shipping_address?.city,
    shippingCountry: o.shipping_address?.country,
    discountCode: o.discount_code ?? undefined,
    discountPercent: o.discount_percent ?? undefined,
    discountAmount: o.discount_amount ?? undefined,
    vat: totals.vat,
    vatRate,
    shipping: totals.shipping,
    grandTotal: totals.grandTotal,
  });
}

/**
 * They also use this URL as the errorURL, and a customer's browser can land
 * here by GET after a cancel. Send them somewhere sensible rather than 405.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const trackId = url.searchParams.get("trackid") ?? url.searchParams.get("trackId") ?? "";
  const state = url.searchParams.get("Error") || url.searchParams.get("ErrorText") ? "error" : "cancelled";
  return Response.redirect(
    `${SITE_URL}/checkout/benefit/return?ref=${encodeURIComponent(trackId)}&state=${state}`, 302,
  );
}
