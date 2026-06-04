/**
 * Static registry of every value the atelier can override from
 * /admin/settings. Each entry declares the key, the default fallback
 * value, and the human-readable metadata that drives the admin form.
 *
 * Lives in a non-client module so server components can read defaults
 * at build time without crossing the "use client" boundary in
 * lib/settings.ts (where the Supabase-using helpers live).
 */

export type SettingDef = {
  key: string;
  group:
    | "PDP"
    | "Pricing — Suit"
    | "Pricing — Jacket"
    | "Pricing — Shirt"
    | "Pricing — Trouser"
    | "Tier copy"
    | "Shipping";
  label: string;
  description?: string;
  defaultValue: string;
  /** Optional hint for the admin input — "currency" formats nicely. */
  kind?: "text" | "currency" | "duration";
};

export const SETTINGS: SettingDef[] = [
  // PDP editorial — values surfaced on every product detail page
  {
    key: "pdp.lead_time",
    group: "PDP",
    label: "Lead time",
    description: "Shown in the Details panel and the reassurance copy on every PDP.",
    defaultValue: "2–4 weeks",
    kind: "duration",
  },
  {
    key: "pdp.construction",
    group: "PDP",
    label: "Construction line (tailoring)",
    description: "Shown in the Details panel for suit / jacket PDPs.",
    defaultValue: "Half-canvas · full canvas on Bespoke",
  },
  {
    key: "shipping.threshold",
    group: "Shipping",
    label: "Free shipping threshold",
    description: "Shown in the Shipping block at the bottom of every PDP.",
    defaultValue: "BHD 150",
    kind: "currency",
  },

  // Tier pricing — Suit
  { key: "tier.price.suit.essential", group: "Pricing — Suit", label: "Suit · Essentials",  defaultValue: "BHD 800",   kind: "currency" },
  { key: "tier.price.suit.signature", group: "Pricing — Suit", label: "Suit · Signature",   defaultValue: "BHD 1,400", kind: "currency" },
  { key: "tier.price.suit.bespoke",   group: "Pricing — Suit", label: "Suit · Full Bespoke", defaultValue: "BHD 2,200", kind: "currency" },

  // Tier pricing — Jacket
  { key: "tier.price.jacket.essential", group: "Pricing — Jacket", label: "Jacket · Essentials",  defaultValue: "BHD 600",   kind: "currency" },
  { key: "tier.price.jacket.signature", group: "Pricing — Jacket", label: "Jacket · Signature",   defaultValue: "BHD 1,000", kind: "currency" },
  { key: "tier.price.jacket.bespoke",   group: "Pricing — Jacket", label: "Jacket · Full Bespoke", defaultValue: "BHD 1,800", kind: "currency" },

  // Tier pricing — Shirt
  { key: "tier.price.shirt.essential", group: "Pricing — Shirt", label: "Shirt · Essentials",  defaultValue: "BHD 120", kind: "currency" },
  { key: "tier.price.shirt.signature", group: "Pricing — Shirt", label: "Shirt · Signature",   defaultValue: "BHD 180", kind: "currency" },
  { key: "tier.price.shirt.bespoke",   group: "Pricing — Shirt", label: "Shirt · Full Bespoke", defaultValue: "BHD 280", kind: "currency" },

  // Tier pricing — Trouser
  { key: "tier.price.trouser.essential", group: "Pricing — Trouser", label: "Trouser · Essentials",  defaultValue: "BHD 220", kind: "currency" },
  { key: "tier.price.trouser.signature", group: "Pricing — Trouser", label: "Trouser · Signature",   defaultValue: "BHD 320", kind: "currency" },
  { key: "tier.price.trouser.bespoke",   group: "Pricing — Trouser", label: "Trouser · Full Bespoke", defaultValue: "BHD 480", kind: "currency" },

  // Tier copy — lead time + fittings shown under each tier card
  // (shared across all garments; the same values render for suit /
  // jacket / shirt / trouser flows).
  { key: "tier.lead.essential", group: "Tier copy", label: "Essentials · Lead time", defaultValue: "3 – 4 weeks", kind: "duration" },
  { key: "tier.lead.signature", group: "Tier copy", label: "Signature · Lead time",  defaultValue: "4 – 5 weeks", kind: "duration" },
  { key: "tier.lead.bespoke",   group: "Tier copy", label: "Full Bespoke · Lead time", defaultValue: "6 – 8 weeks", kind: "duration" },
  { key: "tier.fittings.essential", group: "Tier copy", label: "Essentials · Fittings", defaultValue: "Single fitting" },
  { key: "tier.fittings.signature", group: "Tier copy", label: "Signature · Fittings", defaultValue: "Two fittings" },
  { key: "tier.fittings.bespoke",   group: "Tier copy", label: "Full Bespoke · Fittings", defaultValue: "Three fittings + atelier visit" },
];

export function defaultFor(key: string): string {
  return SETTINGS.find((s) => s.key === key)?.defaultValue ?? "";
}
