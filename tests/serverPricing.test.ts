/**
 * The checkout used to total the bag from the browser's own `priceNum`, so a
 * customer could pay any amount they liked and the return-verification step
 * agreed with them, because it compared against the same manipulated number.
 *
 * These tests exist to make sure that never comes back: the price we charge
 * comes from the ERP and the tier settings, never from the request.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const erpItems = [
  // A cloth used for commissions.
  { id: 448, status: "A", onlinePrice: 45, sellingPrice: 45, categoryName: "SUITING", name: "M8000" },
  // An accessory sold as-is.
  { id: 3349, status: "A", onlinePrice: 0, sellingPrice: 20, categoryName: "TIE", name: "Silk tie" },
  // Withdrawn from sale.
  { id: 9999, status: "X", onlinePrice: 30, sellingPrice: 30, categoryName: "TIE", name: "Retired tie" },
];

vi.mock("@/lib/erp", async (orig) => ({
  ...(await orig<typeof import("@/lib/erp")>()),
  fetchErpItems: vi.fn(async () => erpItems),
}));

vi.mock("@/lib/settingsServer", () => ({
  fetchSettingsServer: vi.fn(async () => ({
    "tier.price.suit.signature": "100",
  })),
}));

const { repriceCart } = await import("@/lib/serverPricing");

beforeEach(() => vi.clearAllMocks());

describe("repriceCart", () => {
  it("ignores the price the browser claims for an accessory", async () => {
    const r = await repriceCart([{ sku: "3349", qty: 1, priceNum: 0.001 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].unitPrice).toBe(20);          // ERP sellingPrice, not 0.001
    expect(r.items[0].clientClaimed).toBe(0.001);   // recorded as a disagreement
    expect(r.subtotal).toBe(20);
  });

  it("prices a commission as cloth plus the tier upgrade", async () => {
    const r = await repriceCart([
      { sku: "c1", qty: 1, priceNum: 1, custom: { category: "suit", tier: "signature", fabricSku: "448" } },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].unitPrice).toBe(145);          // 45 cloth + 100 upgrade
  });

  it("prices Essentials as the cloth alone", async () => {
    const r = await repriceCart([
      { sku: "c1", qty: 1, priceNum: 9999, custom: { category: "suit", tier: "essential", fabricSku: "448" } },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].unitPrice).toBe(45);
  });

  it("rejects a commission whose cloth does not exist", async () => {
    const r = await repriceCart([
      { sku: "c1", qty: 1, priceNum: 500, custom: { category: "suit", tier: "signature", fabricSku: "does-not-exist" } },
    ]);
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown accessory rather than guessing", async () => {
    const r = await repriceCart([{ sku: "not-a-real-sku", qty: 1, priceNum: 10 }]);
    expect(r.ok).toBe(false);
  });

  it("rejects an item withdrawn from sale", async () => {
    const r = await repriceCart([{ sku: "9999", qty: 1, priceNum: 30 }]);
    expect(r.ok).toBe(false);
  });

  it("refuses a negative quantity, which would subtract from the total", async () => {
    const r = await repriceCart([{ sku: "3349", qty: -5, priceNum: 20 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].qty).toBe(1);
    expect(r.subtotal).toBe(20);
  });

  it("refuses a fractional quantity", async () => {
    const r = await repriceCart([{ sku: "3349", qty: 0.1, priceNum: 20 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].qty).toBe(1);
  });

  it("caps an absurd quantity", async () => {
    const r = await repriceCart([{ sku: "3349", qty: 100000, priceNum: 20 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].qty).toBe(99);
  });

  it("rejects an empty bag", async () => {
    expect((await repriceCart([])).ok).toBe(false);
  });

  it("rejects an implausibly long bag", async () => {
    const many = Array.from({ length: 51 }, () => ({ sku: "3349", qty: 1, priceNum: 20 }));
    expect((await repriceCart(many)).ok).toBe(false);
  });

  it("agrees silently when the browser sent the correct price", async () => {
    const r = await repriceCart([{ sku: "3349", qty: 2, priceNum: 20 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mismatches).toHaveLength(0);
    expect(r.subtotal).toBe(40);
  });
});
