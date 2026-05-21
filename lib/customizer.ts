/**
 * Customizer config — every step, every option, every tier.
 * Diagrams live in /public/customizer/<step>/<value>.png and were extracted
 * from the BESPOKE Booklet (V4).
 */

export type Option = {
  value: string;
  label: string;
  note?: string;
};

export type Step = {
  slug: string;
  /** Short title shown in the progress dock and PDF spec sheet */
  title: string;
  /** Eyebrow above the title on the step card */
  eyebrow: string;
  /** One-line subtitle */
  subtitle: string;
  /** Body copy paragraph */
  description: string;
  options: Option[];
  /** Optional default — first option if not set */
  defaultValue?: string;
};

export type Tier = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  lead: string;
  fittings: string;
  features: string[];
  highlight?: boolean;
};

export const steps: Step[] = [
  {
    slug: "fit",
    eyebrow: "N° 01",
    title: "Find your fit",
    subtitle: "The line of the garment begins here.",
    description:
      "The Slim Fit is for a closer cut, contoured to the chest and shoulder. The Tailored Fit follows the body with a touch of room to breathe. The Standard Fit is the most accommodating cut, with the easiest balance for movement.",
    options: [
      { value: "slim",     label: "Slim Fit",     note: "Contoured close to the body" },
      { value: "tailored", label: "Tailored Fit", note: "The classic — close, not tight" },
      { value: "standard", label: "Standard Fit", note: "Easiest cut for movement" },
    ],
  },
  {
    slug: "buttons",
    eyebrow: "N° 02",
    title: "Button your style",
    subtitle: "The most visible decision on the jacket.",
    description:
      "The Two-Button Jacket is the foundation of any wardrobe — versatile, balanced, and at home in any setting. The Three-Button speaks of heritage and tradition; the One-Button is sleeker, made for cleaner lines and a slightly more relaxed jacket.",
    options: [
      { value: "one",   label: "One button" },
      { value: "two",   label: "Two buttons", note: "The classic" },
      { value: "three", label: "Three buttons" },
    ],
    defaultValue: "two",
  },
  {
    slug: "lapel",
    eyebrow: "N° 03",
    title: "Spell your lapel",
    subtitle: "Notch for the day, peak for the evening.",
    description:
      "The Notch Lapel is the most common and the most quietly correct — at home in business and beyond. The Peak Lapel carries more drama and is associated with formal and evening wear. The Slim variants narrow the spread for a sharper, more contemporary line.",
    options: [
      { value: "notch",      label: "Notch lapel" },
      { value: "notch-slim", label: "Notch slim" },
      { value: "peak",       label: "Peak lapel" },
      { value: "peak-slim",  label: "Peak slim" },
    ],
  },
  {
    slug: "vents",
    eyebrow: "N° 04",
    title: "To vent or not",
    subtitle: "The back of the jacket — and how it moves.",
    description:
      "No Vents keeps the silhouette seamless and is closest to the original tailoring tradition. A Single Vent is unfussy and works well across most builds. Double Vents (the most common today) flatter movement, sitting cleanly when the hands are in the pockets.",
    options: [
      { value: "none", label: "No vents" },
      { value: "one",  label: "Single vent" },
      { value: "two",  label: "Double vents", note: "The modern default" },
    ],
    defaultValue: "two",
  },
  {
    slug: "pockets",
    eyebrow: "N° 05",
    title: "Pick your pocket",
    subtitle: "The detail at the hip.",
    description:
      "Flat pockets sit clean inside the line of the jacket. Flapped pockets are the most traditional choice. Slanted pockets — sometimes with a small Ticket pocket above — were a hacking-jacket detail that has stayed because it elongates the torso.",
    options: [
      { value: "flat-noflap",    label: "Flat — no flap" },
      { value: "flat-flap",      label: "Flat with flap" },
      { value: "slant-noflap",   label: "Slanted — no flap" },
      { value: "slant-flap",     label: "Slanted with flap" },
      { value: "slant-ticket",   label: "Slanted with ticket pocket" },
    ],
    defaultValue: "flat-flap",
  },
  {
    slug: "pleats",
    eyebrow: "N° 06",
    title: "Pleat your case",
    subtitle: "Trousers — folded, or not.",
    description:
      "No Pleats is the modern, sleek-fronted trouser. A Single Pleat adds room through the hip without breaking the line. Double Pleats restore the classic English drape — they reward heavier cloths and slightly looser cuts.",
    options: [
      { value: "none",   label: "No pleats" },
      { value: "single", label: "Single pleat" },
      { value: "double", label: "Double pleats" },
    ],
  },
  {
    slug: "cuffs-trouser",
    eyebrow: "N° 07",
    title: "Fold or hold your trousers",
    subtitle: "The hem of the trouser.",
    description:
      "Trousers without cuffs read cleaner and more contemporary. Trousers with cuffs (turn-ups) hold a sharper fold and add a quiet weight to the trouser — recommended on medium and tall builds, and the natural partner to a pleated front.",
    options: [
      { value: "none", label: "Without cuffs" },
      { value: "with", label: "With cuffs" },
    ],
  },
  {
    slug: "belt",
    eyebrow: "N° 08",
    title: "To belt or not",
    subtitle: "Loops or no loops.",
    description:
      "With Belt Loops is for those who wear a belt as part of their tailoring — accentuating the line at the waist. Without Belt Loops gives a cleaner waistband and is the choice for braces, side-adjusters, or the unbroken visual line of a properly fitted trouser.",
    options: [
      { value: "with", label: "With belt loops" },
      { value: "none", label: "Without belt loops" },
    ],
  },
  {
    slug: "stitching",
    eyebrow: "N° 09",
    title: "Hand-picked stitching",
    subtitle: "A small detail, deliberately visible.",
    description:
      "With hand-picked stitching, a fine line of pick-stitch follows the lapel, the lining edges, and the breast pocket — the discreet signature of hand-finished tailoring. Without keeps the lines clean and seamless, in the modern Italian tradition.",
    options: [
      { value: "with",    label: "With hand stitching" },
      { value: "without", label: "Without" },
    ],
  },
  {
    slug: "lining",
    eyebrow: "N° 10",
    title: "To line or not to line",
    subtitle: "How the jacket sits against the body.",
    description:
      "A Full Lining gives the jacket its structure and the classic formal feel. A Half Lining keeps the back light — ideal for warmer climates without losing the line. Unlined is at its most relaxed: a summer-weight, travel-ready garment.",
    options: [
      { value: "full", label: "Full lining" },
      { value: "half", label: "Half lining" },
      { value: "none", label: "No lining" },
    ],
  },
  {
    slug: "collar",
    eyebrow: "N° 11",
    title: "What collars the occasion?",
    subtitle: "The single most visible detail on a shirt.",
    description:
      "Twelve collar shapes, from the quietly Classic to the dramatic Wing Tip. Each carries its own register — the Cutaway flatters a wider tie knot, the Button-down is the relaxed American classic, the Wing Tip is reserved for black-tie evenings.",
    options: [
      { value: "classic",         label: "Classic" },
      { value: "standard",        label: "Standard" },
      { value: "full-cutway",     label: "Full cutaway" },
      { value: "half-cutway",     label: "½ cutaway" },
      { value: "quarter-cutway",  label: "¼ cutaway" },
      { value: "tab",             label: "Tab collar" },
      { value: "hidden-button",   label: "Hidden button" },
      { value: "button-down",     label: "Button down" },
      { value: "eyelet",          label: "Eyelet collar" },
      { value: "british-spread",  label: "British spread" },
      { value: "button-collar",   label: "Button collar" },
      { value: "wing-tip",        label: "Wing tip" },
    ],
    defaultValue: "classic",
  },
  {
    slug: "cuffs-shirt",
    eyebrow: "N° 12",
    title: "Cuff up your style",
    subtitle: "Six cuffs — pick the line that suits the watch.",
    description:
      "The One-Button options are versatile and at home in semi-formal occasions. The Two-Button Square cuff is particularly suited to casual or sport shirts. Angled and Rounded cuffs offer subtler styling. Choose between One- or Two-button on the tightness preferred.",
    options: [
      { value: "one-rounded", label: "One-button rounded" },
      { value: "one-square",  label: "One-button square" },
      { value: "one-angled",  label: "One-button angled" },
      { value: "two-rounded", label: "Two-button rounded" },
      { value: "two-square",  label: "Two-button square" },
      { value: "two-angled",  label: "Two-button angled" },
    ],
  },
];

export const tiers: Tier[] = [
  {
    slug: "essential",
    name: "Essential",
    tagline: "Made to measure, the starting point.",
    price: "د.ب 800",
    lead: "4 weeks",
    fittings: "Single fitting",
    features: [
      "Made-to-measure pattern from your numbers",
      "Choice from 47 cloths",
      "One basted fitting before delivery",
      "Hand-pressed, delivered in canvas",
    ],
  },
  {
    slug: "signature",
    name: "Signature",
    tagline: "The house standard.",
    price: "د.ب 1,400",
    lead: "6 weeks",
    fittings: "Two fittings",
    features: [
      "Bespoke pattern drawn for one body",
      "Choice from the full cloth library",
      "Two basted fittings + a final",
      "Hand-finished lapel, pockets, sleeves",
      "Pattern kept on file for life",
    ],
    highlight: true,
  },
  {
    slug: "couture",
    name: "Couture",
    tagline: "Hand-cut and hand-stitched, throughout.",
    price: "د.ب 2,200",
    lead: "8 weeks",
    fittings: "Three fittings + atelier visit",
    features: [
      "Hand-cut on the bench",
      "Hand-padded canvas, no fusing",
      "Three fittings + one atelier visit",
      "Hand-rolled silks and accessories included",
      "Lifetime alterations",
    ],
  },
];

export type Selections = Record<string, string>;

export function defaultSelections(): Selections {
  return steps.reduce<Selections>((acc, step) => {
    acc[step.slug] = step.defaultValue ?? step.options[0].value;
    return acc;
  }, {});
}

export function findOption(stepSlug: string, value: string) {
  const step = steps.find((s) => s.slug === stepSlug);
  return step?.options.find((o) => o.value === value);
}

/* ───────────────────────── Measurements ───────────────────────── */

export type Measurement = {
  slug: string;
  label: string;
  helper: string;
};

export type MeasurementGroup = {
  slug: string;
  title: string;
  intro: string;
  items: Measurement[];
};

/**
 * Videos live in /public/measurements/<slug>.mp4 — short clips that loop,
 * each showing how to take a single measurement. Each item is rendered as
 * a card with the autoplay video + a numeric input.
 */
export const measurementGroups: MeasurementGroup[] = [
  {
    slug: "upper",
    title: "Upper body",
    intro:
      "Jacket and shirt measurements. Stand naturally — let the tape sit on the skin or over a thin shirt.",
    items: [
      { slug: "shirt-neck",          label: "Shirt neck",            helper: "Around the base of the neck with one finger of room." },
      { slug: "shoulder",            label: "Shoulder",              helper: "Across the back, from one shoulder seam to the other." },
      { slug: "chest",               label: "Chest",                 helper: "Around the fullest part of the chest, under the arms." },
      { slug: "stomach",             label: "Stomach",               helper: "Around the navel — relaxed, not pulled in." },
      { slug: "jacket-hips",         label: "Jacket hips",           helper: "Around the seat, where the jacket will sit." },
      { slug: "jacket-shirt-length", label: "Jacket / shirt length", helper: "From the base of the neck, down the spine, to the desired hem." },
      { slug: "sleeve-length",       label: "Sleeve length",         helper: "From the shoulder bone to the wrist bone, arm slightly bent." },
      { slug: "bicep",               label: "Bicep",                 helper: "Around the fullest part of the relaxed bicep." },
      { slug: "wrist",               label: "Wrist",                 helper: "Snug around the wrist bone." },
    ],
  },
  {
    slug: "lower",
    title: "Lower body",
    intro:
      "Trouser measurements. Wear flat shoes and have the trouser break in mind.",
    items: [
      { slug: "waist",        label: "Trouser waist",  helper: "Around the natural waist where the trousers will sit." },
      { slug: "crotch",       label: "Crotch / rise",  helper: "From the centre of the waistband, between the legs, back up to the waist." },
      { slug: "thigh",        label: "Thigh",          helper: "Around the fullest part of the upper thigh." },
      { slug: "knee",         label: "Knee",           helper: "Around the kneecap, leg relaxed." },
      { slug: "pants-length", label: "Trouser length", helper: "Outseam — waist down the side to the break at the shoe." },
    ],
  },
];

export const allMeasurements: Measurement[] = measurementGroups.flatMap(g => g.items);

export type MeasurementUnit = "cm" | "in";
export type MeasurementValues = Record<string, string>;

export function defaultMeasurements(): MeasurementValues {
  return allMeasurements.reduce<MeasurementValues>((acc, m) => {
    acc[m.slug] = "";
    return acc;
  }, {});
}
