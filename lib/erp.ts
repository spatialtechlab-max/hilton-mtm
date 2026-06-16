/**
 * Hilton ERP — server-only fetcher. The API keys live in env vars and must
 * never reach the client. Items are fetched with ISR (revalidate) so the
 * storefront stays fast and roughly live (5 min freshness).
 */

import type { LibraryItem, LibrarySection } from "./libraries";

export type ErpItem = {
  id: number;
  name: string;
  code: string;
  barcode: string;
  description: string;
  design: string;
  shade: string;
  color: string;
  origin: string;
  size: string;
  weight: string;
  categoryID: number;
  categoryName: string;
  brandID: number;
  brandName: string;
  sellingPrice: number;
  /** ERP's storefront-facing price. When set (non-zero) it overrides
   *  sellingPrice — the client edits this field, expecting the website
   *  to follow it. */
  onlinePrice?: number;
  status: string; // "A" = active
  thumbnail: string;
  images: string[];
};

type ErpResponse = { statusCode: number; data: { total: number; items: ErpItem[] } };

const REVALIDATE_SECS = 300;

export async function fetchErpItems(): Promise<ErpItem[]> {
  const base = process.env.ERP_BASE_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_SECRET_KEY;
  if (!base || !key || !secret) return [];

  try {
    const res = await fetch(`${base}/api/item_list.php`, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "X-SECRET-KEY": secret,
        "Content-Type": "application/json",
      },
      body: "{}",
      next: { revalidate: REVALIDATE_SECS },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ErpResponse;
    if (json.statusCode !== 200) return [];
    return (json.data?.items ?? []).filter((i) => i.status === "A");
  } catch {
    return [];
  }
}

/* ──────────────────────── Mapping ──────────────────────── */

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();

/**
 * The ERP stores HTML-escaped strings ("B&amp;S LINEN" rather than
 * "B&S LINEN"). Decode the handful of entities that actually appear so
 * the storefront reads cleanly.
 */
const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

/**
 * Strip the various category prefixes the ERP bakes into the name field
 * ("BELTMAGNANNI1128 GREY" → "Magnanni1128 Grey"; "SILK TIEMARTIN 504 2"
 * → "Martin 504 2"; "FABRICB&S LINEN BL0258-3" → "B&S Linen Bl0258-3"),
 * then decode any HTML entities and title-case it.
 */
function prettyName(name: string, categoryName: string): string {
  // Order matters: longer / more specific prefixes are tried first so
  // "SUITINGS" wins before plain "SUIT". The regex allows zero
  // whitespace, so "SUITVBC ..." is stripped to "VBC ..." which is
  // how the storefront should read the cloth-mill code.
  const prefixes = [
    categoryName,
    "FABRIC", "SILK TIE",
    "SUITINGS", "SUITING", "SUITS", "SUIT",
    "JACKETING", "JACKET", "BLAZER", "RTWJKT", "JKT",
    "SHIRTING", "SHIIRTING", "SHIRTS", "SHIRT",
    "TROUSERS", "TROUSER", "PANTS", "PANT",
    "BELT", "TIE",
  ];
  let stripped = name;
  for (const p of prefixes) {
    const re = new RegExp(`^${p}\\s*`, "i");
    if (re.test(stripped)) { stripped = stripped.replace(re, ""); break; }
  }
  return titleCase(decodeEntities(stripped));
}

const FALLBACK_SRC = "/products/no-image.svg";

/**
 * The ERP returns "/catalogue/placeholder.svg" (or other relative paths)
 * for items that don't yet have real photography. next/image would treat
 * those as local /public assets and 404. Substitute a tasteful local
 * placeholder instead, so the tile reads as "photo coming" not "broken".
 */
function cleanSrc(src: string | undefined): string {
  if (!src) return FALLBACK_SRC;
  if (src.includes("placeholder")) return FALLBACK_SRC;
  // Only http(s) — the ERP sometimes returns relative paths that don't
  // resolve from our public folder.
  if (!/^https?:\/\//i.test(src)) return FALLBACK_SRC;
  return src;
}

/** Sentinel shown on the storefront when an ERP field is empty.
 *  Per client direction we no longer hide / fall back — every blank
 *  surfaces so the atelier can see exactly which records to fix. */
const MISSING = "Missing value";

/** Normalise an ERP free-text value: decode entities, title-case,
 *  trim. Empty / null / whitespace-only inputs return the explicit
 *  "Missing value" sentinel so the storefront calls out ERP gaps. */
function clean(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return MISSING;
  const s = String(v).trim();
  if (!s) return MISSING;
  return titleCase(decodeEntities(s));
}

function isMissing(s: string | undefined): boolean {
  return !s || s === MISSING;
}

/**
 * The price the storefront should show. ERP carries two price fields:
 *
 *   - sellingPrice — the legacy / counter price
 *   - onlinePrice  — the value the atelier edits to control the website
 *
 * The client reported their ERP price edits were not reflecting. Root
 * cause: the mapper was reading sellingPrice, but the atelier had been
 * editing onlinePrice (which is the field whose name implies it drives
 * the storefront). Prefer onlinePrice when present and non-zero; fall
 * back to sellingPrice otherwise so legacy items still show a number.
 */
function effectivePrice(item: ErpItem): number {
  const online = Number(item.onlinePrice ?? 0);
  if (Number.isFinite(online) && online > 0) return online;
  return Number(item.sellingPrice ?? 0);
}

function mapItem(item: ErpItem): LibraryItem {
  const composition = clean(item.description); // "100% Silk", "70% Wool & 30% Polyester"
  const brand       = clean(item.brandName);
  const pattern     = clean(item.design);
  const color       = clean(item.color);
  const shade       = clean(item.shade);
  const origin      = clean(item.origin);
  const weight      = clean(item.weight);     // "240 Grams", "270 Grams"
  const size        = clean(item.size);
  const code        = clean(item.code);

  // No synthesised fallbacks — if the ERP composition is blank, the
  // storefront shows the MISSING sentinel so the atelier can see
  // exactly which records to backfill.
  const cloth = composition;

  // Short editorial detail line composed only of the fields that
  // actually have values; missing fields don't pollute the summary
  // but the atelier still sees "Missing value" on the dedicated
  // PDP detail rows.
  const detail = [brand, pattern, origin].filter((v) => !isMissing(v)).join(" · ");

  const thumb = cleanSrc(item.thumbnail);
  const cleanGallery = (item.images ?? []).map(cleanSrc).filter((g) => g !== FALLBACK_SRC);

  // The ERP convention (confirmed with the atelier's upload tool: IMAGE *
  // is the swatch, IMAGE 1 is the on-form garment hero, IMAGE 2 / 3 are
  // back / detail) bakes the upload slot into the filename — `pic` for
  // the swatch, `pic1` / `pic2` / `pic3` for the gallery. The ERP's
  // `images` array, however, is in upload-order and varies per item
  // (we've seen [pic3, pic1, pic2] for shirt 2832), so picking
  // gallery[0] blindly can land on a swatch. Sorting by the numeric
  // suffix in the filename gives us pic1 → pic2 → pic3 consistently,
  // which means the library tile always shows the garment hero.
  const sortedGallery = [...cleanGallery].sort((a, b) => {
    const n = (s: string) => {
      const m = s.match(/_pic(\d+)_/);
      return m ? Number(m[1]) : 999;
    };
    return n(a) - n(b);
  });

  // The library tiles want the dressed garment as the hero image — they
  // read as "a shirt" / "a jacket" / "a tie", not as "a cloth" — so we
  // prefer the first sorted gallery photo (pic1) when present. The
  // customizer fabric picker still wants the swatch and uses
  // /api/fabrics which keeps `thumbnail` as `image`.
  const hero = sortedGallery[0] ?? thumb;

  const priceNum = effectivePrice(item);
  return {
    sku: String(item.id),
    name: prettyName(item.name, item.categoryName),
    type: titleCase(item.categoryName),
    cloth,
    price: priceNum > 0 ? `BHD ${priceNum}` : MISSING,
    alt: [brand, pattern, color].filter((v) => !isMissing(v)).join(" ").trim(),
    description: detail,
    media: { kind: "photo", src: hero },
    // Gallery on the PDP uses only the on-form / detail shots the
    // atelier uploaded into `images[]`. We deliberately don't append
    // the cropped thumb swatch — for items where the atelier filled
    // IMAGE 3 with the swatch too (shirts 2832 etc.) that produced
    // two visually identical thumbnails at the end of the strip. The
    // customer can still see the swatch on the customizer fabric
    // picker, where it's the natural context. If the item has no
    // gallery at all, we fall back to the swatch so the PDP isn't
    // empty.
    gallery: sortedGallery.length > 0 ? sortedGallery : [thumb],
    // Richer spec fields surfaced on the PDP details table.
    brand,
    code,
    composition,
    pattern,
    color,
    shade,
    weight,
    size,
    origin,
  };
}

/** Does this ERP item have a real on-form garment photo? The atelier's
 *  upload tool labels image slots as IMAGE *, IMAGE 1, IMAGE 2, IMAGE 3
 *  and bakes those into the URL as `_pic_`, `_pic1_`, `_pic2_`, `_pic3_`.
 *  By convention IMAGE 1 (`_pic1_`) is the on-form hero (shirt on form,
 *  tie on box, jacket on form, etc.) — IMAGE 2 / 3 are back / detail
 *  shots, IMAGE * is the cropped swatch. Some atelier uploads (e.g.
 *  shirt 2835) only fill IMAGE 3 with another swatch, leaving IMAGE 1
 *  empty — those items have no garment photo and we hide them from the
 *  library tiles (a customer browsing /library/shirts wants to see
 *  shirts, not cloth). The item still surfaces in the customizer fabric
 *  picker where the swatch IS the right context. */
function hasGarmentShot(item: ErpItem): boolean {
  const gallery = item.images ?? [];
  return gallery.some((src) => /_pic1_/.test(src));
}

/** Build LibrarySection[] for one ERP-backed slug from ERP.
 *  `overrideCategories` lets a dynamic caller (e.g. /library/[slug]
 *  resolving a garment row from mtm_garments) pass in the
 *  erp_categories column instead of relying on the hardcoded
 *  ERP_CATEGORIES_FOR_SLUG map. This is how new ERP categories light
 *  up the storefront without a code edit. */
export function sectionsFromErp(slug: string, items: ErpItem[], overrideCategories?: string[]): LibrarySection[] {
  const wanted = overrideCategories
    ?? ERP_CATEGORIES_FOR_SLUG[slug as ErpBackedSlug]
    ?? [];
  if (wanted.length === 0) return [];
  const wantedUpper = wanted.map((c) => c.toUpperCase());
  // Built-in libraries (suits / jackets) are photo-led, so they require an
  // on-form garment shot. Dynamic garments synced from the ERP (overcoat,
  // tuxedo, chino pants…) frequently arrive before photography — gating
  // them on a photo would 404 the whole shelf even though the products
  // exist. For those we show the items with a placeholder, matching the
  // customizer fabric picker, rather than hide a real, in-stock garment.
  const requireShot = overrideCategories === undefined;
  const filtered = items
    .filter((i) => wantedUpper.includes(i.categoryName.toUpperCase()))
    .filter((i) => !requireShot || hasGarmentShot(i));
  if (filtered.length === 0) return [];

  // Group by brand for a clean sub-section header. Decode entities first
  // so "B&amp;S LINEN" lands as "B&S Linen" — both the displayed title
  // ("B&S Linen") and the count line ("6 pieces from B&S Linen.") read
  // cleanly.
  const groups = new Map<string, ErpItem[]>();
  for (const i of filtered) {
    const b = titleCase(decodeEntities(i.brandName || "House"));
    groups.set(b, [...(groups.get(b) ?? []), i]);
  }
  return [...groups.entries()].map(([brand, list], idx) => ({
    slug: brand.toLowerCase().replace(/\s+/g, "-") || `section-${idx}`,
    title: brand,
    note: `${list.length} ${list.length === 1 ? "piece" : "pieces"} from ${brand}.`,
    items: list.map(mapItem),
  }));
}

// Each library slug maps to the set of ERP categoryName values (matched
// case-insensitively, includes the spreadsheet variants/typos) that
// should populate it. SHIRTING / PANTS / SHOES went live as ERP categories
// after the initial build, so they need to be wired here for the
// existing /library/[slug] page to surface real ERP items instead of
// the static placeholders.
// Mapped from `Active_categories_hilton_material.xlsx` (the atelier's
// authoritative list). Each library slug pulls every ERP categoryName
// variant the atelier uses — including known typos (SHIIRTING, SUIES,
// SUIUS) — so a misspelled category in the ERP never makes a cloth or
// accessory go invisible on the storefront.
export const ERP_CATEGORIES_FOR_SLUG: Record<
  | "ties" | "belts" | "cloths" | "shirts" | "trousers" | "shoes"
  | "tailoring" | "suits" | "jackets"
  | "wallets" | "pocket-squares" | "cufflinks" | "bow-ties"
  | "overcoats" | "waistcoats",
  string[]
> = {
  ties:             ["TIE", "TIES"],
  belts:            ["BELT", "ZAMPIERE BELT"],
  cloths:           ["SUITING", "SUITINGS", "SUITS", "SUIES", "SUIUS", "JACKETING", "BLAZER"],
  shirts:           ["SHIRTING", "SHIIRTING", "SHIRTS"],
  trousers:         ["PANTS"],
  shoes:            ["SHOES"],
  // Tailoring stays as a combined view (suits + jackets) for any old
  // links / nav that still point at it. The new dedicated /library/suits
  // and /library/jackets pages own the homepage tiles going forward.
  tailoring:        ["SUITING", "SUITINGS", "SUITS", "JACKETING", "JACKET", "BLAZER", "OVERCOAT"],
  suits:            ["SUITING", "SUITINGS", "SUITS", "SUIES", "SUIUS"],
  jackets:          ["JACKETING", "JACKET", "BLAZER", "RTWJKT"],
  wallets:          ["WALLET"],
  "pocket-squares": ["POCKET SQUARE"],
  cufflinks:        ["CUFFLINK", "STUDD CUFFLINK", "TIE PIN", "COLLAR PIN", "LAPEL PIN"],
  "bow-ties":       ["BOW TIE", "RTW BOWTIE"],
  overcoats:        ["OVERCOAT"],
  waistcoats:       ["WAISTCOAT"],
};

export const ERP_BACKED_SLUGS = [
  "ties", "belts", "cloths", "shirts", "trousers", "shoes",
  "tailoring", "suits", "jackets",
  "wallets", "pocket-squares", "cufflinks", "bow-ties", "overcoats", "waistcoats",
] as const;
export type ErpBackedSlug = (typeof ERP_BACKED_SLUGS)[number];
export const isErpBacked = (slug: string): slug is ErpBackedSlug =>
  (ERP_BACKED_SLUGS as readonly string[]).includes(slug);
