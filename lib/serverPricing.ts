/**
 * Server-authoritative pricing for checkout.
 *
 * WHY THIS EXISTS
 * The payment session used to total the cart from the `priceNum` the browser
 * sent. Everything else was already derived server-side (the discount was
 * re-validated, VAT came from mtm_settings, free shipping from the country
 * table), but the line prices themselves were taken on trust. A customer could
 * edit the request and pay any amount they liked for a real commission, and the
 * return-verification step compared the capture against that same manipulated
 * figure, so it agreed.
 *
 * Nothing here trusts the client for money. Prices are rebuilt from the same
 * sources the storefront renders from:
 *
 *   accessory   -> the ERP item's own price (onlinePrice, else sellingPrice)
 *   commission  -> tierPriceFor(), exactly as the customizer computes it:
 *                  Essentials is the chosen cloth's price, Signature and Full
 *                  Bespoke add the admin's upgrade from mtm_settings
 *
 * Fails closed. If a price cannot be established (unknown SKU, missing cloth,
 * a tier the atelier has not priced) the item is rejected rather than guessed,
 * because a wrong number here is money.
 */
import { fetchErpItems, type ErpItem } from "@/lib/erp";
import { fetchSettingsServer } from "@/lib/settingsServer";
import { tierPriceFor, PRICE_NOT_AVAILABLE, type StepCategory } from "@/lib/customizer";

export type IncomingItem = {
  sku?: string;
  name?: string;
  priceNum?: number;
  qty?: number;
  custom?: {
    category?: string;
    tier?: string;
    fabricSku?: string;
  } | null;
};

export type RepricedItem = {
  item: IncomingItem;
  /** The price WE decided, per unit. Never the client's. */
  unitPrice: number;
  qty: number;
  lineTotal: number;
  /** Set when the client's figure disagreed with ours. Worth logging. */
  clientClaimed?: number;
};

export type RepriceResult =
  | { ok: true; items: RepricedItem[]; subtotal: number; mismatches: RepricedItem[] }
  | { ok: false; error: string; sku?: string };

/** ERP's own price for an item. Mirrors effectivePrice() in lib/erp.ts. */
function erpPrice(item: ErpItem): number {
  const online = Number(item.onlinePrice ?? 0);
  if (Number.isFinite(online) && online > 0) return online;
  const selling = Number(item.sellingPrice ?? 0);
  return Number.isFinite(selling) ? selling : 0;
}

/** "BHD 1,250" / 1250 / "1,250.500" -> 1250.5, and 0 for anything unusable. */
function toNumber(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Quantity has to be sane too: a negative or fractional qty is a way to bend the total. */
function safeQty(q: unknown): number {
  const n = Math.floor(Number(q ?? 1));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 99);
}

export async function repriceCart(items: IncomingItem[]): Promise<RepriceResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  if (items.length > 50) {
    return { ok: false, error: "Too many items in one order." };
  }

  const [erpItems, settings] = await Promise.all([fetchErpItems(), fetchSettingsServer()]);
  const bySku = new Map(erpItems.map((i) => [String(i.id), i]));

  const priced: RepricedItem[] = [];

  for (const raw of items) {
    const qty = safeQty(raw?.qty);
    const commission = raw?.custom ?? null;
    let unitPrice = 0;

    if (commission && commission.category) {
      // Commissioned garment: cloth price plus the tier upgrade, same chain the
      // customizer shows the customer.
      const fabric = commission.fabricSku ? bySku.get(String(commission.fabricSku)) : undefined;
      if (!fabric) {
        return { ok: false, error: "We could not confirm the cloth for one of your commissions. Please reopen it in the customizer.", sku: raw?.sku };
      }
      const clothPrice = erpPrice(fabric);
      if (clothPrice <= 0) {
        return { ok: false, error: "That cloth has no price set in the ERP. Please contact the atelier.", sku: raw?.sku };
      }
      const label = tierPriceFor(commission.category as StepCategory, commission.tier ?? "signature", {
        essentialOverride: clothPrice,
        settings,
      });
      if (label === PRICE_NOT_AVAILABLE) {
        return { ok: false, error: "That tier has not been priced yet. Please contact the atelier.", sku: raw?.sku };
      }
      unitPrice = toNumber(label);
    } else {
      // Accessory: straight from the ERP.
      const erp = raw?.sku ? bySku.get(String(raw.sku)) : undefined;
      if (!erp) {
        return { ok: false, error: "One of the items is no longer available.", sku: raw?.sku };
      }
      if (String(erp.status ?? "").toUpperCase() !== "A") {
        return { ok: false, error: "One of the items is no longer available.", sku: raw?.sku };
      }
      unitPrice = erpPrice(erp);
    }

    if (!(unitPrice > 0)) {
      return { ok: false, error: "We could not price one of your items. Please contact the atelier.", sku: raw?.sku };
    }

    const claimed = Number(raw?.priceNum);
    const entry: RepricedItem = {
      item: raw,
      unitPrice,
      qty,
      lineTotal: Math.round(unitPrice * qty * 1000) / 1000,
    };
    // Flag disagreement so it can be logged. We still charge our own number.
    if (Number.isFinite(claimed) && Math.abs(claimed - unitPrice) > 0.001) {
      entry.clientClaimed = claimed;
    }
    priced.push(entry);
  }

  const subtotal = Math.round(priced.reduce((s, p) => s + p.lineTotal, 0) * 1000) / 1000;
  return { ok: true, items: priced, subtotal, mismatches: priced.filter((p) => p.clientClaimed !== undefined) };
}
