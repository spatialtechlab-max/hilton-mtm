/**
 * Customizer config — every step, every option, every tier.
 * Diagrams live in /public/customizer/<step>/<value>.png and were extracted
 * from the BESPOKE Booklet (V4).
 */

export type Option = {
  value: string;
  label: string;
  note?: string;
  /** For "swatch" steps — a CSS colour. */
  color?: string;
  /** For "gallery" steps — an image src. */
  image?: string;
  /** Add-on price for picking this option, in BHD. 0 = included. Admin can override. */
  surcharge?: number;
};

/** How a step's options are rendered. */
export type StepKind = "diagram" | "choice" | "swatch" | "gallery";

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
  /** Render mode (default "diagram"). */
  kind?: StepKind;
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
      { value: "one",   label: "One button",   surcharge: 20 },
      { value: "two",   label: "Two buttons",  note: "The classic", surcharge: 0 },
      { value: "three", label: "Three buttons", surcharge: 20 },
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
      { value: "notch",      label: "Notch lapel", surcharge: 0 },
      { value: "notch-slim", label: "Notch slim",  surcharge: 15 },
      { value: "peak",       label: "Peak lapel",  surcharge: 60 },
      { value: "peak-slim",  label: "Peak slim",   surcharge: 60 },
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
      { value: "none", label: "No vents",     surcharge: 0 },
      { value: "one",  label: "Single vent",  surcharge: 25 },
      { value: "two",  label: "Double vents", note: "The modern default", surcharge: 35 },
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
      { value: "flat-noflap",    label: "Flat — no flap",            surcharge: 0 },
      { value: "flat-flap",      label: "Flat with flap",            surcharge: 0 },
      { value: "slant-noflap",   label: "Slanted — no flap",         surcharge: 20 },
      { value: "slant-flap",     label: "Slanted with flap",         surcharge: 25 },
      { value: "slant-ticket",   label: "Slanted with ticket pocket", surcharge: 45 },
    ],
    defaultValue: "flat-flap",
  },
  {
    slug: "ticket",
    eyebrow: "Ticket pocket",
    title: "Ticket please",
    subtitle: "A small extra pocket above the right hip.",
    description:
      "The ticket pocket — a smaller pocket set just above the right-hand pocket — is a British sporting detail. Add it for character, or leave it for the cleaner line.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "none", label: "Without ticket pocket", surcharge: 0 },
      { value: "with", label: "With ticket pocket",    surcharge: 40 },
    ],
  },
  {
    slug: "pleats",
    eyebrow: "N° 06",
    title: "Pleat your case",
    subtitle: "Trousers — folded, or not.",
    description:
      "No Pleats is the modern, sleek-fronted trouser. A Single Pleat adds room through the hip without breaking the line. Double Pleats restore the classic English drape — they reward heavier cloths and slightly looser cuts.",
    options: [
      { value: "none",   label: "No pleats",     surcharge: 0 },
      { value: "single", label: "Single pleat",  surcharge: 15 },
      { value: "double", label: "Double pleats", surcharge: 25 },
    ],
  },
  {
    slug: "back-pocket",
    eyebrow: "Back pocket",
    title: "Slip in the back pocket",
    subtitle: "The rear pocket of the trouser.",
    description:
      "The left or right single pocket is ideal for minimalists; the double pocket option suits those with a penchant for pockets. The single or double pockets with buttons are for those who like an extra bit of detailing.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "left-single",    label: "Left single pocket",     surcharge: 0  },
      { value: "right-single",   label: "Right single pocket",    surcharge: 0  },
      { value: "double",         label: "Double pocket",          surcharge: 20 },
      { value: "single-button",  label: "Single pocket · button", surcharge: 25 },
      { value: "double-buttons", label: "Double pocket · buttons", surcharge: 40 },
    ],
    defaultValue: "left-single",
  },
  {
    slug: "waistcoat-style",
    eyebrow: "Waistcoat",
    title: "Sporting the waistcoat",
    subtitle: "The cut of the waistcoat front.",
    description:
      "Single- or double-breasted, with a straight or shawl lapel — the waistcoat sets the tone of the three-piece.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "three-buttons", label: "Three buttons", surcharge: 0  },
      { value: "four-buttons",  label: "Four buttons",  surcharge: 15 },
      { value: "five-buttons",  label: "Five buttons",  surcharge: 25 },
      { value: "four-lapel",    label: "Four · lapel",  surcharge: 40 },
    ],
    defaultValue: "five-buttons",
  },
  {
    slug: "waistcoat-lining",
    eyebrow: "Waistcoat",
    title: "Lining the waistcoat",
    subtitle: "The back and lining of the waistcoat.",
    description:
      "A matching self-cloth back for a refined finish, or a satin back in the traditional manner.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "with-lining", label: "Waistcoat with lining", surcharge: 0  },
      { value: "with-fabric", label: "Waistcoat with fabric", surcharge: 30 },
    ],
    defaultValue: "with-lining",
  },
  /* ──────────────────────────────────────────────────────────────────
   * SUIT / JACKET — Signature tier (brief order: jacket first, pants
   * after; then the optional "polish" steps the user asked us to keep;
   * canvas closes as the bespoke tier).
   * ────────────────────────────────────────────────────────────────── */
  {
    slug: "sleeve-buttons",
    eyebrow: "Sleeve buttons",
    title: "Button your sleeves",
    subtitle: "The working cuff of the jacket.",
    description:
      "How many working buttons sit at the cuff — and whether they kiss or stack. A quiet mark of hand tailoring.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "three",        label: "Three buttons",    surcharge: 0  },
      { value: "four",         label: "Four buttons",     surcharge: 15 },
      { value: "four-kissing", label: "Four · kissing",   surcharge: 30 },
      { value: "five",         label: "Five buttons",     surcharge: 25 },
    ],
    defaultValue: "four",
  },
  {
    slug: "stitching",
    eyebrow: "N° 09",
    title: "Hand-picked stitching",
    subtitle: "A small detail, deliberately visible.",
    description:
      "With hand-picked stitching, a fine line of pick-stitch follows the lapel, the lining edges, and the breast pocket — the discreet signature of hand-finished tailoring. Without keeps the lines clean and seamless, in the modern Italian tradition.",
    options: [
      { value: "with",    label: "With hand stitching", surcharge: 90 },
      { value: "without", label: "Without",             surcharge: 0 },
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
      { value: "full", label: "Full lining", surcharge: 0 },
      { value: "half", label: "Half lining", surcharge: 0 },
      { value: "none", label: "No lining",   surcharge: 0 },
    ],
  },
  /* ── Signature tier — pants (brief: Fold or Hold, Suspend, Belt) ── */
  {
    slug: "cuffs-trouser",
    eyebrow: "N° 07",
    title: "Fold or hold your trousers",
    subtitle: "The hem of the trouser.",
    description:
      "Trousers without cuffs read cleaner and more contemporary. Trousers with cuffs (turn-ups) hold a sharper fold and add a quiet weight to the trouser — recommended on medium and tall builds, and the natural partner to a pleated front.",
    options: [
      { value: "none", label: "Without cuffs", surcharge: 0 },
      { value: "with", label: "With cuffs",    surcharge: 25 },
    ],
  },
  {
    slug: "suspenders",
    eyebrow: "Braces",
    title: "Suspend your style",
    subtitle: "Buttons for braces inside the waistband.",
    description:
      "Add interior buttons for braces (suspenders) — the traditional way to hold a trouser, and kinder to the waistband than a belt.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "none", label: "Without suspender buttons", surcharge: 0  },
      { value: "with", label: "With suspender buttons",    surcharge: 30 },
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
      { value: "with", label: "With belt loops",    surcharge: 0 },
      { value: "none", label: "Without belt loops", surcharge: 0 },
    ],
  },
  /* ── Optional "polish" upgrades not in the V1 brief — the user asked
   *    us to keep them as additional surcharge upsells.           ── */
  {
    slug: "double-breasted",
    eyebrow: "Double Breasted",
    title: "Go double breasted",
    subtitle: "Two rows of buttons, twice the presence.",
    description:
      "Double Breasted Suits spell sophistication and attention to detail — perfect for formal and business occasions. Meant to be worn buttoned up, they have an array of buttons on both halves of the jacket. The Patch Pocket variation is a daring amalgamation of formal and casual. The Patch Valet Pocket adds a neat breast pocket on top.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "regular",      label: "Double breasted",             surcharge: 0   },
      { value: "patch-pocket", label: "With patch pocket",           surcharge: 40  },
      { value: "patch-valet",  label: "With patch + valet pocket",   surcharge: 65  },
    ],
    defaultValue: "regular",
  },
  {
    slug: "tuxedo",
    eyebrow: "Tuxedo",
    title: "What's your tuxedo type?",
    subtitle: "Satin detailing for the evening.",
    description:
      "Tuxedos stand apart from suits by making use of satin in the lapels, buttons and side-strip on the pants. The Peak Lapel Tuxedo is for a complete formal look and considered a 'power-dressing' move. The Shawl Collar Tuxedo seamlessly runs around the neck, ideal for evening wear at high-end events. The Slim Shawl Collar variation best suits leaner figures.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "peak-lapel",  label: "Peak lapel tuxedo",       surcharge: 0   },
      { value: "shawl-collar",label: "Shawl collar tuxedo",     surcharge: 30  },
      { value: "slim-shawl",  label: "Slim shawl collar tuxedo",surcharge: 50  },
    ],
    defaultValue: "peak-lapel",
  },
  {
    slug: "sport-jacket",
    eyebrow: "Sport a Jacket",
    title: "Sport a jacket",
    subtitle: "The casual side of tailoring.",
    description:
      "The Sports Jacket embodies a more rugged feel with sturdier fabrics, designed for looser fits than suit jackets. Patch pockets break up the lines and keep you from looking overdressed. Hand stitching adds unobtrusive detailing across key areas of the jacket.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "regular",        label: "Sports jacket",         surcharge: 0   },
      { value: "patch-pocket",   label: "With patch pocket",     surcharge: 40  },
      { value: "hand-stitching", label: "With hand stitching",   surcharge: 90  },
    ],
    defaultValue: "regular",
  },
  /* ──────────────────────────────────────────────────────────────────
   * SHIRT — sequence per client brief (V1):
   *   1. Placket Your Shirt
   *   2. Search Our Pockets
   *   3. Pleats on Your Six
   *   4. What Collars the Occasion?
   *   5. Cuff Up Your Style
   *   6. Cuff Up Your Style — finish  (Essentials / Signature / Bespoke)
   *
   * "Find your fit" (jacket diagram) and "Tux your shirt" are NOT in the
   * brief; they're filtered out via STEP_CATEGORIES — but the source
   * order matters because shirt steps appear in the order they're
   * declared in this array.
   * ────────────────────────────────────────────────────────────────── */
  {
    slug: "tux-shirt",
    eyebrow: "Tuxedo shirt",
    title: "Tux your shirt",
    subtitle: "For black-tie evenings.",
    description:
      "Choose between the Tuxedo Shirt or Tuxedo Shirt with Studs. The former is the traditional style — sharp wing-tipped collar with a pleated bib down the front. The latter offers an ornamental upgrade, replacing the first four buttons with stylish studs.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "tuxedo",       label: "Tuxedo shirt",            surcharge: 0  },
      { value: "tuxedo-studs", label: "Tuxedo shirt with studs", surcharge: 35 },
    ],
    defaultValue: "tuxedo",
  },
  {
    slug: "placket",
    eyebrow: "N° 1",
    title: "Placket your shirt",
    subtitle: "How the buttons sit on the front.",
    description:
      "Without Placket (or Invisible Placket) is a French-style tailored placket that folds the fabric inside to disguise the button stitches — clean and contemporary. With Placket (or Front Placket) is for traditionalists, outlining the button strip. Hidden Button (or Fly Front Placket) covers the buttons completely — perfect for highlighting bow-ties.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "without", label: "Without placket", surcharge: 0  },
      { value: "with",    label: "With placket",    surcharge: 0  },
      { value: "hidden",  label: "Hidden button",   surcharge: 20 },
    ],
    defaultValue: "with",
  },
  {
    slug: "shirt-pocket",
    eyebrow: "N° 2",
    title: "Search our pockets",
    subtitle: "The detail on the chest.",
    description:
      "Shirt pockets, though mostly ceremonial, add depth, detail and utility. Without Pocket is best for very formal occasions — elegance and order. With Pocket or Pocket with Flap shirts are ideal for more casual settings.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "without",    label: "Without pocket",    surcharge: 0  },
      { value: "with",       label: "With pocket",       surcharge: 10 },
      { value: "with-flaps", label: "Pockets with flaps",surcharge: 20 },
    ],
    defaultValue: "without",
  },
  {
    slug: "back-pleats",
    eyebrow: "N° 3",
    title: "Pleats on your six",
    subtitle: "How the back of the shirt sits.",
    description:
      "Without Back Pleats is the minimalist's choice for a clean, slim-fit shirt. Single Pleat is ideal for sloping shoulders — the most common style, allowing for mobility. Side Pleats are a subtler way of having back pleats, tailored to align with the wearer's back. Side Pleats with Darts add folded fabric on either side for a better-contoured fit.",
    // Diagram-based: illustrations cropped from the Hilton Bespoke Booklet V4.
    options: [
      { value: "without",    label: "Without pleats",       surcharge: 0  },
      { value: "single",     label: "Single pleat",         surcharge: 10 },
      { value: "side",       label: "Side pleats",          surcharge: 15 },
      { value: "side-darts", label: "Side pleats with darts", surcharge: 25 },
    ],
    defaultValue: "single",
  },
  {
    slug: "collar",
    eyebrow: "N° 4",
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
    eyebrow: "N° 5",
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
    name: "Essentials",
    tagline: "The refined foundation of our made-to-measure tailoring.",
    price: "د.ب 800",
    lead: "3 – 4 weeks",
    fittings: "Single fitting",
    features: [
      "Made-to-measure pattern from your numbers",
      "Choice from our trusted fabric library",
      "One basted fitting before delivery",
      "Hand-pressed, delivered in canvas",
    ],
  },
  {
    slug: "signature",
    name: "Signature",
    tagline: "The impeccable Hilton house standard.",
    price: "د.ب 1,400",
    lead: "4 – 5 weeks",
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
    slug: "bespoke",
    name: "Full Bespoke",
    tagline: "The pinnacle of our art — entirely hand-cut and hand-stitched.",
    price: "د.ب 2,200",
    lead: "6 – 8 weeks",
    fittings: "Three fittings + atelier visit",
    features: [
      "Entirely hand-cut on the bench",
      "Hand-padded canvas, no fusing",
      "Three fittings with dedicated personal sessions",
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
      { slug: "shirt-neck",          label: "Neck",                  helper: "Measure around the neck at the height of your collar, just under the Adam's apple — taken along the lower section of the neck." },
      { slug: "shoulder",            label: "Shoulder",              helper: "Measure across the upper back, from the edge of one shoulder to the other." },
      { slug: "chest",               label: "Chest",                 helper: "Position the tape around the fullest part of the chest — usually just under the armpits and across the shoulder blades, level with the nipples." },
      { slug: "stomach",             label: "Stomach",               helper: "With the tape parallel to your navel, wrap it around the waist." },
      { slug: "jacket-hips",         label: "Jacket hips",           helper: "Take the circumference around your hips at the broadest part." },
      { slug: "jacket-shirt-length", label: "Jacket / shirt length", helper: "Measure straight down the front, from the base of the neck to the point level with your knuckles." },
      { slug: "sleeve-length",       label: "Sleeve length",         helper: "Measure from the shoulder, across a slightly bent elbow, to just before the wrist bone — or wherever you'd like the cuff to sit." },
      { slug: "bicep",               label: "Bicep",                 helper: "With the arm relaxed, measure the circumference around the fullest part of the bicep." },
      { slug: "wrist",               label: "Wrist",                 helper: "Measure the circumference around the wrist bone." },
    ],
  },
  {
    slug: "lower",
    title: "Lower body",
    intro:
      "Trouser measurements. Wear flat shoes and have the trouser break in mind.",
    items: [
      { slug: "waist",        label: "Waist",          helper: "Measure around the waist at the point where your belt typically sits." },
      { slug: "crotch",       label: "Crotch",         helper: "Measure from the top of the front waistband, down under the crotch seam, and back up to the top of the rear waistband." },
      { slug: "thigh",        label: "Thigh",          helper: "Measure the circumference of the thigh at its largest point." },
      { slug: "knee",         label: "Knee",           helper: "Measure the circumference of the knee at its broadest point." },
      { slug: "pants-length", label: "Pants length",   helper: "Measure from the top of the waistband down the outside of the leg to the floor." },
    ],
  },
];

export const allMeasurements: Measurement[] = measurementGroups.flatMap(g => g.items);

/* ───────────────── Category-aware filtering ───────────────── */

export type StepCategory = "suit" | "jacket" | "shirt" | "trouser";
export type TierLevel = "essential" | "signature" | "bespoke";

// Which product categories each step applies to. A suit is jacket + trousers,
// so it inherits both jacket and trouser steps. A standalone jacket gets the
// jacket steps only (no trouser steps); shirts/trousers get their own.
const STEP_CATEGORIES: Record<string, StepCategory[]> = {
  // Per client brief, shirt has only 5 essentials (Placket, Pockets,
  // Pleats, Collar, Cuff) and trouser has only Pleats + Back Pocket
  // (essentials) + Fold-or-Hold + Suspend + Belt (signature). "Find
  // your fit" is also a jacket-shaped diagram, so it has no place in
  // either flow — keep it on suit / jacket only.
  fit:               ["suit", "jacket"],
  buttons:           ["suit", "jacket"],
  lapel:             ["suit", "jacket"],
  vents:             ["suit", "jacket"],
  pockets:           ["suit", "jacket"],
  ticket:            ["suit", "jacket"],
  pleats:            ["suit", "trouser"],
  "back-pocket":     ["suit", "trouser"],
  // Waistcoat is suit-only per booklet (#9, #10) — never applies to a
  // standalone jacket commission.
  "waistcoat-style": ["suit"],
  "waistcoat-lining":["suit"],
  "cuffs-trouser":   ["suit", "trouser"],
  suspenders:        ["suit", "trouser"],
  belt:              ["suit", "trouser"],
  "sleeve-buttons":  ["suit", "jacket"],
  stitching:         ["suit", "jacket"],
  "sport-jacket":    ["jacket"],
  tuxedo:            ["suit", "jacket"],
  "double-breasted": ["suit", "jacket"],
  lining:            ["suit", "jacket"],
  collar:            ["shirt"],
  "cuffs-shirt":     ["shirt"],
  placket:           ["shirt"],
  "shirt-pocket":    ["shirt"],
  "back-pleats":     ["shirt"],
  "tux-shirt":       ["shirt"],
};

// Minimum package tier that unlocks each step. Booklet's "Bespoke
// Options" section (items 11-19) is the Signature/Bespoke upgrade
// tier over the Essentials (items 1-10).
const STEP_TIER: Record<string, TierLevel> = {
  fit: "essential", buttons: "essential", lapel: "essential", vents: "essential",
  pockets: "essential", ticket: "essential",
  pleats: "essential", "back-pocket": "essential",
  "waistcoat-style": "essential", "waistcoat-lining": "essential",
  "cuffs-trouser": "signature", suspenders: "signature", belt: "signature",
  "sleeve-buttons": "signature", stitching: "signature", lining: "signature",
  "sport-jacket": "signature",
  tuxedo: "signature", "double-breasted": "signature",
  collar: "essential", "cuffs-shirt": "essential", placket: "essential",
  "shirt-pocket": "essential", "back-pleats": "essential",
  "tux-shirt": "signature",
};

// No conditional dependencies — the booklet treats Sporting the
// Waistcoat (#9) and Lining the Waistcoat (#10) as unconditional suit
// steps. The Yes/No 'Add a waistcoat' gate was our own invention and
// has been retired per client direction.
const STEP_REQUIRES: Record<string, { slug: string; value: string }> = {};

const TIER_RANK: Record<TierLevel, number> = { essential: 0, signature: 1, bespoke: 2 };
export function tierRank(slug: string): number {
  return TIER_RANK[slug as TierLevel] ?? 0;
}

// Per-measurement category tagging so each garment only asks for what it needs
// (e.g. a shirt doesn't need "jacket hips"; a jacket doesn't need trouser numbers).
const MEASUREMENT_CATEGORIES: Record<string, StepCategory[]> = {
  "shirt-neck":          ["suit", "jacket", "shirt"],
  shoulder:              ["suit", "jacket", "shirt"],
  chest:                 ["suit", "jacket", "shirt"],
  stomach:               ["suit", "jacket", "shirt"],
  "jacket-hips":         ["suit", "jacket"],
  "jacket-shirt-length": ["suit", "jacket", "shirt"],
  "sleeve-length":       ["suit", "jacket", "shirt"],
  bicep:                 ["suit", "jacket", "shirt"],
  wrist:                 ["suit", "jacket", "shirt"],
  waist:                 ["suit", "trouser"],
  crotch:                ["suit", "trouser"],
  thigh:                 ["suit", "trouser"],
  knee:                  ["suit", "trouser"],
  "pants-length":        ["suit", "trouser"],
};

export function isCustomizeCategory(v: string | null | undefined): v is StepCategory {
  return v === "suit" || v === "jacket" || v === "shirt" || v === "trouser";
}

export function stepsForCategory(cat: StepCategory): Step[] {
  return steps.filter((s) => (STEP_CATEGORIES[s.slug] ?? ["suit"]).includes(cat));
}

/**
 * The steps actually shown: filtered by product category, then (for tiered
 * categories) by the selected package tier with inheritance, then by any
 * conditional requirement (e.g. waistcoat sub-steps only when one is added).
 */
export function visibleSteps(cat: StepCategory, tierSlug: string, selections: Selections): Step[] {
  const tiered = categoryHasTiers(cat);
  const maxRank = tierRank(tierSlug);
  return stepsForCategory(cat).filter((s) => {
    if (tiered) {
      const stepRank = tierRank(STEP_TIER[s.slug] ?? "essential");
      if (stepRank > maxRank) return false;
    }
    const req = STEP_REQUIRES[s.slug];
    if (req && selections[req.slug] !== req.value) return false;
    return true;
  });
}

export function measurementGroupsForCategory(cat: StepCategory): MeasurementGroup[] {
  return measurementGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (m) => (MEASUREMENT_CATEGORIES[m.slug] ?? ["suit", "jacket", "shirt", "trouser"]).includes(cat),
      ),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * Per the client brief: ONLY suits and jackets show the Essentials /
 * Signature / Bespoke tier picker. Shirts and trousers bypass it and
 * jump straight from fabric to their styling steps. (Shirts still get
 * tier-like upgrades via the dedicated cuff-tier step.)
 */
export function categoryHasTiers(cat: StepCategory): boolean {
  return cat === "suit" || cat === "jacket";
}

/**
 * Category-specific tier pricing. The `tiers` array carries the suit
 * baseline; shirts and trousers ride on much lower scales because they
 * are a single garment, not a two-piece commission.
 */
const TIER_PRICE_BY_CATEGORY: Record<StepCategory, Record<TierLevel, string>> = {
  suit: {
    essential: "د.ب 800",
    signature: "د.ب 1,400",
    bespoke:   "د.ب 2,200",
  },
  jacket: {
    essential: "د.ب 500",
    signature: "د.ب 900",
    bespoke:   "د.ب 1,500",
  },
  shirt: {
    essential: "د.ب 140",
    signature: "د.ب 220",
    bespoke:   "د.ب 380",
  },
  trouser: {
    essential: "د.ب 280",
    signature: "د.ب 440",
    bespoke:   "د.ب 720",
  },
};

export function tierPriceFor(cat: StepCategory, tierSlug: string): string {
  const slug = (tierSlug as TierLevel) in TIER_RANK ? (tierSlug as TierLevel) : "signature";
  return TIER_PRICE_BY_CATEGORY[cat][slug];
}

/* ───────────────── Admin seed (static config → DB) ───────────────── */

export type SeedOption = {
  value: string; label: string; note: string | null;
  color: string | null; image: string | null; sortOrder: number;
  surcharge: number;
};
export type SeedStep = {
  slug: string; title: string; eyebrow: string; subtitle: string; description: string;
  kind: StepKind; appliesTo: StepCategory[]; tier: TierLevel | null;
  requiresSlug: string | null; requiresValue: string | null; sortOrder: number;
  options: SeedOption[];
};

/** The full static config, enriched with tier/kind/category/requires — used to
 *  seed the admin database from code. */
export function getSeedConfig(): SeedStep[] {
  return steps.map((s, i) => ({
    slug: s.slug,
    title: s.title,
    eyebrow: s.eyebrow,
    subtitle: s.subtitle,
    description: s.description,
    kind: s.kind ?? "diagram",
    appliesTo: STEP_CATEGORIES[s.slug] ?? ["suit"],
    tier: STEP_TIER[s.slug] ?? null,
    requiresSlug: STEP_REQUIRES[s.slug]?.slug ?? null,
    requiresValue: STEP_REQUIRES[s.slug]?.value ?? null,
    sortOrder: i,
    options: s.options.map((o, j) => ({
      value: o.value,
      label: o.label,
      note: o.note ?? null,
      color: o.color ?? null,
      image: o.image ?? null,
      surcharge: o.surcharge ?? 0,
      sortOrder: j,
    })),
  }));
}

export type MeasurementUnit = "cm" | "in";
export type MeasurementValues = Record<string, string>;

export function defaultMeasurements(): MeasurementValues {
  return allMeasurements.reduce<MeasurementValues>((acc, m) => {
    acc[m.slug] = "";
    return acc;
  }, {});
}
