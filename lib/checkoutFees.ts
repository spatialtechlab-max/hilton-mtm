/**
 * Fixed checkout fees applied to every order:
 *   - VAT: 10% of the items total (after any discount has been applied).
 *   - Shipping: a flat 3 BHD per order.
 *
 * Both are computed at display time rather than persisted to the order row
 * — they're regulated/fixed amounts that shouldn't drift per order, so the
 * source of truth lives here. If the rate or fee ever changes, update this
 * file; historical orders re-render with the new value, which is the
 * correct behaviour for a current-rate display.
 */

export const VAT_RATE = 0.10;
export const SHIPPING_FEE = 3;

/** Round to two decimal places without floating-point drift. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type OrderTotals = {
  itemsTotal: number;
  vat: number;
  shipping: number;
  grandTotal: number;
};

/** Given the items total (post-discount), return the full breakdown. */
export function computeOrderTotals(itemsTotalAfterDiscount: number): OrderTotals {
  const itemsTotal = Math.max(0, round2(itemsTotalAfterDiscount));
  const vat        = round2(itemsTotal * VAT_RATE);
  const shipping   = SHIPPING_FEE;
  const grandTotal = round2(itemsTotal + vat + shipping);
  return { itemsTotal, vat, shipping, grandTotal };
}
