/**
 * Every number a customer is charged passes through here, and until now none
 * of it was tested. computeOrderTotals decides the VAT and the delivery fee on
 * the cart, on the order pages, in the confirmation email and in the amount
 * actually sent to the payment gateway, so a rounding slip or a bad VAT string
 * is money in the wrong direction.
 */
import { describe, it, expect } from "vitest";
import { VAT_RATE, SHIPPING_FEE, parseVatRate, vatRateFromSettings, computeOrderTotals } from "@/lib/checkoutFees";

describe("parseVatRate", () => {
  it("reads a whole-number percentage as the atelier types it", () => {
    expect(parseVatRate("10")).toBeCloseTo(0.10);
    expect(parseVatRate("5")).toBeCloseTo(0.05);
    expect(parseVatRate("0")).toBe(0);
  });

  it("tolerates the percent sign and stray spacing", () => {
    expect(parseVatRate(" 10 % ")).toBeCloseTo(0.10);
  });

  it("falls back to the default rather than charging nothing", () => {
    // A blank or broken setting must not silently zero the tax.
    expect(parseVatRate(null)).toBe(VAT_RATE);
    expect(parseVatRate(undefined)).toBe(VAT_RATE);
    expect(parseVatRate("")).toBe(VAT_RATE);
    expect(parseVatRate("   ")).toBe(VAT_RATE);
    expect(parseVatRate("not a number")).toBe(VAT_RATE);
  });

  it("refuses a negative rate, which would credit the customer", () => {
    expect(parseVatRate("-5")).toBe(VAT_RATE);
  });

  it("reads a settings map", () => {
    expect(vatRateFromSettings({ "vat.rate": "7" })).toBeCloseTo(0.07);
    expect(vatRateFromSettings({})).toBe(VAT_RATE);
  });
});

describe("computeOrderTotals", () => {
  it("adds VAT and the delivery fee", () => {
    const t = computeOrderTotals(100);
    expect(t.itemsTotal).toBe(100);
    expect(t.vat).toBeCloseTo(10);
    expect(t.shipping).toBe(SHIPPING_FEE);
    expect(t.grandTotal).toBeCloseTo(100 + 10 + SHIPPING_FEE);
  });

  it("waives delivery for a free-shipping country", () => {
    const t = computeOrderTotals(100, { freeShipping: true });
    expect(t.shipping).toBe(0);
    expect(t.grandTotal).toBeCloseTo(110);
  });

  it("honours an admin-set VAT rate over the default", () => {
    const t = computeOrderTotals(200, { freeShipping: true, vatRate: 0.05 });
    expect(t.vat).toBeCloseTo(10);
    expect(t.grandTotal).toBeCloseTo(210);
  });

  it("charges no VAT when the rate is zero", () => {
    const t = computeOrderTotals(100, { freeShipping: true, vatRate: 0 });
    expect(t.vat).toBe(0);
    expect(t.grandTotal).toBe(100);
  });

  it("matches the figure the live site charged for a 45 BHD item to Bahrain", () => {
    // Verified against production: one chino at 45, free shipping, 10% VAT.
    const t = computeOrderTotals(45, { freeShipping: true, vatRate: 0.10 });
    expect(t.grandTotal).toBeCloseTo(49.5);
  });

  it("keeps BHD to sensible precision on an awkward subtotal", () => {
    // BHD is a 3-decimal currency and the gateway rejects malformed amounts,
    // so the total must not carry floating-point dust.
    const t = computeOrderTotals(33.333, { freeShipping: true, vatRate: 0.10 });
    expect(Number.isFinite(t.grandTotal)).toBe(true);
    expect(String(t.grandTotal).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(3);
  });

  it("never returns a negative total", () => {
    const t = computeOrderTotals(0, { freeShipping: true });
    expect(t.grandTotal).toBeGreaterThanOrEqual(0);
  });
});
