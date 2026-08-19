/**
 * Fixed checkout fees applied to every order:
 *   - VAT: a percentage of the items total (after any discount has been
 *     applied). The rate is admin-editable from /admin/settings (the
 *     `vat.rate` setting); VAT_RATE below is only the fallback default used
 *     until a value is read, and when no override is set.
 *   - Shipping: a flat 15 BHD per order.
 *
 * Both are computed at display time rather than persisted to the order row
 * — they're current-rate figures, so the source of truth is the settings
 * value (with this file's default as the fallback). Pass the resolved rate
 * into computeOrderTotals via `options.vatRate`; callers read it from the
 * settings (client: useVatRate / vatRateFromSettings, server: fetchVatRate).
 */

export const VAT_RATE = 0.10;
export const SHIPPING_FEE = 15;

/** Round to two decimal places without floating-point drift. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parse the admin `vat.rate` setting (a percentage string like "10") into a
 *  fraction (0.10). Falls back to the default on anything unparseable, and
 *  clamps to a sane 0–100%. */
export function parseVatRate(value: string | null | undefined): number {
  if (value == null) return VAT_RATE;
  // Strip only the percent sign and surrounding space. The old version removed
  // every non-digit, which took the minus sign with it, so "-5" arrived here as
  // "5" and the negative guard below could never fire: a typo of "-5" silently
  // went live as 5% VAT instead of falling back to the default.
  const cleaned = String(value).replace(/%/g, "").trim();
  if (cleaned === "") return VAT_RATE;
  const pct = Number.parseFloat(cleaned);
  if (!Number.isFinite(pct) || pct < 0) return VAT_RATE;
  return Math.min(pct, 100) / 100;
}

/** Resolve the VAT fraction from a loaded settings map. */
export function vatRateFromSettings(settings: Record<string, string>): number {
  return parseVatRate(settings["vat.rate"]);
}

export type OrderTotals = {
  itemsTotal: number;
  vat: number;
  shipping: number;
  grandTotal: number;
};

/** Given the items total (post-discount), return the full breakdown.
 *  `freeShipping` zeroes the shipping fee — the cart and order pages
 *  pass `true` when the customer's destination country is on the admin's
 *  free-shipping list. `vatRate` is the resolved VAT fraction (defaults to
 *  VAT_RATE when a caller hasn't loaded the admin value yet). */
export function computeOrderTotals(
  itemsTotalAfterDiscount: number,
  options?: { freeShipping?: boolean; vatRate?: number },
): OrderTotals {
  const rate       = options?.vatRate ?? VAT_RATE;
  const itemsTotal = Math.max(0, round2(itemsTotalAfterDiscount));
  const vat        = round2(itemsTotal * rate);
  const shipping   = options?.freeShipping ? 0 : SHIPPING_FEE;
  const grandTotal = round2(itemsTotal + vat + shipping);
  return { itemsTotal, vat, shipping, grandTotal };
}
