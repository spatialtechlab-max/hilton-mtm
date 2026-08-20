/**
 * Everything that has to happen between "customer pressed pay" and "ask a
 * gateway for a payment page", with no gateway-specific code in it.
 *
 * WHY THIS EXISTS
 * We now have two payment rails: MPGS for international cards, BENEFIT for
 * Bahraini debit. Both must arrive at EXACTLY the same number for the same bag.
 * If each route did its own repricing, VAT lookup and free-shipping check, the
 * two would drift the first time someone edited one of them, and a customer
 * would be charged differently depending on which button they pressed. So the
 * money is computed once, here.
 *
 * Everything is server-derived. Nothing in the request body influences a price:
 * see lib/serverPricing for why that rule exists.
 */
import { createClient } from "@supabase/supabase-js";
import { computeOrderTotals, parseVatRate } from "@/lib/checkoutFees";
import { missingMeasurements } from "@/lib/measurementRules";
import { repriceCart } from "@/lib/serverPricing";
import { validateDiscount } from "@/lib/discountServer";
import type { CartItem } from "@/lib/cart";
import type { MeasurementValues } from "@/lib/customizer";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ShipTo = {
  full_name?: string; phone?: string; line1: string;
  line2?: string | null; city: string; country: string;
};

export type PrepInput = {
  userId: string;
  userEmail: string;
  items: CartItem[];
  shipTo: ShipTo;
  discountCode?: string | null;
  profileName?: string;
  profilePhone?: string;
};

export type PrepFailure = {
  ok: false;
  status: number;
  error: string;
  code?: string;
  missing?: string[];
  // sku/name/was come off the customer's own cart payload, so any of them can
  // be absent on a malformed request. The customer still needs telling which
  // line moved, so keep them optional rather than dropping the whole message.
  lines?: { sku?: string; name?: string; was?: number; now: number }[];
};

export type PrepSuccess = {
  ok: true;
  grandTotal: number;
  orderRow: Record<string, unknown>;
  lineRows: Record<string, unknown>[];
};

/**
 * Validate, reprice and assemble the order rows. The caller then hands
 * `grandTotal` to its gateway and stashes the rows as a pending checkout.
 */
export async function prepareCheckout(input: PrepInput): Promise<PrepSuccess | PrepFailure> {
  const { userId, userEmail, items, shipTo } = input;

  if (!SUPA_URL || !SERVICE) return { ok: false, status: 500, error: "Server env missing." };
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: "Cart is empty." };
  }
  if (!shipTo?.line1 || !shipTo?.city || !shipTo?.country) {
    return { ok: false, status: 400, error: "A shipping address is required." };
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // Measurements gate. Any commissioned line is cut to the customer's body, so
  // the relevant measurements must be on file before we take payment.
  // Accessories are exempt.
  const commissionCats = items.filter((i) => i.custom).map((i) => String(i.custom?.category ?? ""));
  if (commissionCats.length > 0) {
    const { data: meas } = await admin
      .from("mtm_measurements").select("values").eq("user_id", userId).maybeSingle();
    const missing = missingMeasurements((meas as { values?: MeasurementValues } | null)?.values, commissionCats);
    if (missing.length > 0) {
      return {
        ok: false, status: 400, code: "measurements_required", missing,
        error: "Please add your measurements before placing this order.",
      };
    }
  }

  // Rebuild every line price from the ERP and the tier settings.
  const repriced = await repriceCart(items);
  if (!repriced.ok) return { ok: false, status: 400, error: repriced.error };
  if (repriced.mismatches.length > 0) {
    console.warn("[checkout] price mismatch", {
      user: userId,
      lines: repriced.mismatches.map((m) => ({ sku: m.item.sku, claimed: m.clientClaimed, actual: m.unitPrice })),
    });
    return {
      ok: false, status: 409, code: "price_changed",
      error: "Prices in your bag are out of date. Please review your bag and try again.",
      lines: repriced.mismatches.map((m) => ({
        sku: m.item.sku, name: m.item.name, was: m.clientClaimed, now: m.unitPrice,
      })),
    };
  }
  const grossSubtotal = repriced.subtotal;

  // Re-validate the discount here rather than trusting the cart.
  let discountSnapshot: { code: string; percent: number; amount: number } | null = null;
  if (input.discountCode) {
    const d = await validateDiscount(input.discountCode, grossSubtotal);
    if (!d.valid) return { ok: false, status: 400, code: "discount_invalid", error: d.reason };
    discountSnapshot = { code: d.code, percent: d.percent_off, amount: d.amount };
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

  const { data: vatRow } = await admin
    .from("mtm_settings").select("value").eq("key", "vat.rate").maybeSingle();
  const vatRate = parseVatRate((vatRow as { value?: string } | null)?.value);

  const totals = computeOrderTotals(subtotal, { freeShipping, vatRate });
  if (totals.grandTotal <= 0) return { ok: false, status: 400, error: "Nothing to charge." };

  const orderRow = {
    user_id: userId,
    customer_name: (shipTo.full_name?.trim() || input.profileName || "").slice(0, 200),
    customer_email: userEmail,
    customer_phone: shipTo.phone?.trim() || input.profilePhone || "",
    shipping_address: {
      line1: shipTo.line1, line2: shipTo.line2 ?? null, city: shipTo.city, country: shipTo.country,
    },
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

  return { ok: true, grandTotal: totals.grandTotal, orderRow, lineRows };
}
