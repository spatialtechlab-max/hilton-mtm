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
  /** Optional hint for the admin input — "currency" formats nicely.
   *  "multiline" renders a textarea (used for bullet-point lists). */
  kind?: "text" | "currency" | "duration" | "multiline";
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

  // Tier pricing — Suit. Essentials is *always* the cloth price from
  // the ERP, so it has no row here. Signature and Full Bespoke values
  // are the UPGRADE ABOVE Essentials: customer pays (fabric price +
  // this value). Example: fabric is BHD 350, Signature row is 100 →
  // customer sees Signature = BHD 450 on the tier picker.
  { key: "tier.price.suit.signature", group: "Pricing — Suit", label: "Suit · Signature upgrade",   description: "Added to the fabric price to make the Signature commission total.", defaultValue: "BHD 600",   kind: "currency" },
  { key: "tier.price.suit.bespoke",   group: "Pricing — Suit", label: "Suit · Full Bespoke upgrade", description: "Added to the fabric price to make the Full Bespoke commission total.", defaultValue: "BHD 1,400", kind: "currency" },

  // Tier pricing — Jacket
  { key: "tier.price.jacket.signature", group: "Pricing — Jacket", label: "Jacket · Signature upgrade",   description: "Added to the fabric price to make the Signature commission total.", defaultValue: "BHD 400", kind: "currency" },
  { key: "tier.price.jacket.bespoke",   group: "Pricing — Jacket", label: "Jacket · Full Bespoke upgrade", description: "Added to the fabric price to make the Full Bespoke commission total.", defaultValue: "BHD 1,200", kind: "currency" },

  // Tier pricing — Shirt
  { key: "tier.price.shirt.signature", group: "Pricing — Shirt", label: "Shirt · Signature upgrade",   description: "Added to the fabric price to make the Signature commission total.", defaultValue: "BHD 60",  kind: "currency" },
  { key: "tier.price.shirt.bespoke",   group: "Pricing — Shirt", label: "Shirt · Full Bespoke upgrade", description: "Added to the fabric price to make the Full Bespoke commission total.", defaultValue: "BHD 160", kind: "currency" },

  // Tier pricing — Trouser
  { key: "tier.price.trouser.signature", group: "Pricing — Trouser", label: "Trouser · Signature upgrade",   description: "Added to the fabric price to make the Signature commission total.", defaultValue: "BHD 100", kind: "currency" },
  { key: "tier.price.trouser.bespoke",   group: "Pricing — Trouser", label: "Trouser · Full Bespoke upgrade", description: "Added to the fabric price to make the Full Bespoke commission total.", defaultValue: "BHD 260", kind: "currency" },

  // Tier copy — lead time + fittings shown under each tier card
  // (shared across all garments; the same values render for suit /
  // jacket / shirt / trouser flows).
  { key: "tier.lead.essential", group: "Tier copy", label: "Essentials · Lead time", defaultValue: "3 – 4 weeks", kind: "duration" },
  { key: "tier.lead.signature", group: "Tier copy", label: "Signature · Lead time",  defaultValue: "4 – 5 weeks", kind: "duration" },
  { key: "tier.lead.bespoke",   group: "Tier copy", label: "Full Bespoke · Lead time", defaultValue: "6 – 8 weeks", kind: "duration" },
  { key: "tier.fittings.essential", group: "Tier copy", label: "Essentials · Fittings", defaultValue: "Single fitting" },
  { key: "tier.fittings.signature", group: "Tier copy", label: "Signature · Fittings", defaultValue: "Two fittings" },
  { key: "tier.fittings.bespoke",   group: "Tier copy", label: "Full Bespoke · Fittings", defaultValue: "Three fittings + atelier visit" },

  // Tier headline copy — name, tagline (the small burgundy eyebrow line
  // above the name), and the bullet-point feature list shown on each
  // package card.
  { key: "tier.name.essential", group: "Tier copy", label: "Essentials · Name", description: "The headline shown on the tier card.", defaultValue: "Essentials" },
  { key: "tier.name.signature", group: "Tier copy", label: "Signature · Name", description: "The headline shown on the tier card.", defaultValue: "Signature" },
  { key: "tier.name.bespoke",   group: "Tier copy", label: "Full Bespoke · Name", description: "The headline shown on the tier card.", defaultValue: "Full Bespoke" },

  { key: "tier.tagline.essential", group: "Tier copy", label: "Essentials · Tagline", description: "Small burgundy line shown above the name.", defaultValue: "The refined foundation of our made-to-measure tailoring." },
  { key: "tier.tagline.signature", group: "Tier copy", label: "Signature · Tagline", description: "Small burgundy line shown above the name.", defaultValue: "The impeccable Hilton house standard." },
  { key: "tier.tagline.bespoke",   group: "Tier copy", label: "Full Bespoke · Tagline", description: "Small burgundy line shown above the name.", defaultValue: "The pinnacle of our art, entirely hand-cut and hand-stitched." },

  { key: "tier.features.essential", group: "Tier copy", label: "Essentials · Bullet points", description: "One bullet per line. Empty lines are ignored.", kind: "multiline", defaultValue: "Made-to-measure pattern from your numbers\nChoice from our trusted fabric library\nOne basted fitting before delivery\nHand-pressed, delivered in canvas" },
  { key: "tier.features.signature", group: "Tier copy", label: "Signature · Bullet points", description: "One bullet per line. Empty lines are ignored.", kind: "multiline", defaultValue: "Bespoke pattern drawn for one body\nChoice from the full cloth library\nTwo basted fittings + a final\nHand-finished lapel, pockets, sleeves\nPattern kept on file for life" },
  { key: "tier.features.bespoke",   group: "Tier copy", label: "Full Bespoke · Bullet points", description: "One bullet per line. Empty lines are ignored.", kind: "multiline", defaultValue: "Entirely hand-cut on the bench\nHand-padded canvas, no fusing\nThree fittings with dedicated personal sessions\nHand-rolled silks and accessories included\nLifetime alterations" },
];

export function defaultFor(key: string): string {
  return SETTINGS.find((s) => s.key === key)?.defaultValue ?? "";
}
