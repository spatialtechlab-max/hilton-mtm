/**
 * Each category on the home page (Tailoring, Footwear, Accessories) takes
 * the visitor to its own *library* — a curated room dedicated to that one
 * thing. Not the full collection, not a product list. A single, considered
 * presentation of one kind of made-to-order work.
 *
 * Items can be either a photographed product (`image`) or a brand-styled
 * SVG illustration (`tie`) for categories where we don't have product
 * photography yet.
 */

export type TiePattern =
  | "solid"
  | "stripe-club"
  | "stripe-fine"
  | "dot"
  | "paisley"
  | "grenadine";

export type TieSpec = {
  kind: "tie";
  color: string;
  accent?: string;
  bg?: string;
  pattern: TiePattern;
};

export type PhotoSpec = {
  kind: "photo";
  src: string;
};

export type LibraryItem = {
  sku: string;
  name: string;
  type: string;
  cloth?: string;
  price: string;
  alt: string;
  scale?: 1 | 2;
  sale?: string;  // e.g. "10%" — renders a small badge if present
  media: PhotoSpec | TieSpec;
};

export type LibrarySection = {
  slug: string;
  title: string;
  note: string;
  items: LibraryItem[];
};

export type Library = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  stats: { label: string; value: string }[];
  sections: LibrarySection[];
};

/* ──────────────────────── TAILORING ──────────────────────── */

const tailoring: Library = {
  slug: "tailoring",
  eyebrow: "The Tailoring Library",
  title: "Suits & Jackets.",
  intro:
    "Every Hilton garment begins as a paper pattern drawn for one body. Three hundred hours per suit, cut by a single hand, basted and re-fitted until the cloth answers to the shoulder.",
  heroImage:
    "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
  heroAlt: "A bespoke navy windowpane suit, hand-finished",
  stats: [
    { label: "Hours per suit", value: "≈ 300" },
    { label: "Mills curated", value: "47" },
    { label: "Fittings included", value: "3" },
  ],
  sections: [
    {
      slug: "suits",
      title: "Suits",
      note: "Two- and three-piece. Drawn for one body, kept for life.",
      items: [
        {
          sku: "WLD-201",
          name: "Walden",
          type: "Two-Piece",
          cloth: "Worsted wool · Huddersfield",
          price: "From $2,400",
          alt: "Navy worsted two-piece suit",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "BCN-301",
          name: "Beacon",
          type: "Three-Piece",
          cloth: "Tweed · Fox Brothers",
          price: "From $2,950",
          alt: "Blue tweed three-piece suit",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "MDS-210",
          name: "Madison",
          type: "Two-Piece",
          cloth: "Windowpane wool · Loro Piana",
          price: "From $2,650",
          alt: "Navy windowpane suit",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "ATL-205",
          name: "Atelier Cutaway",
          type: "Two-Piece",
          cloth: "Mohair-wool · Smith Woollens",
          price: "From $2,800",
          alt: "Navy cutaway suit at the atelier",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1600&auto=format&fit=crop" },
        },
      ],
    },
    {
      slug: "jackets",
      title: "Jackets & Sport Coats",
      note: "Standalone tailoring for less formal hours.",
      items: [
        {
          sku: "MRL-110",
          name: "Marlow",
          type: "Sport Coat",
          cloth: "Hopsack · Loro Piana",
          price: "From $1,850",
          alt: "Hopsack sport coat",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "LND-115",
          name: "Linden Linen",
          type: "Summer Jacket",
          cloth: "Pure linen · Solbiati",
          price: "From $1,650",
          alt: "Linen summer jacket",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "BRG-118",
          name: "Burgundy Hopsack",
          type: "Sport Coat",
          cloth: "Hopsack · Holland & Sherry",
          price: "From $1,950",
          alt: "Burgundy hopsack sport coat",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop" },
        },
      ],
    },
    {
      slug: "overcoats",
      title: "Overcoats & Eveningwear",
      note: "For the cold months and the late ones.",
      items: [
        {
          sku: "SVR-410",
          name: "Severn Topcoat",
          type: "Overcoat",
          cloth: "Camel hair · Abraham Moon",
          price: "From $3,200",
          alt: "Camel-hair topcoat",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "CRL-420",
          name: "Carlyle Pea Coat",
          type: "Pea Coat",
          cloth: "Melton wool · navy",
          price: "From $2,800",
          alt: "Navy pea coat",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop" },
        },
        {
          sku: "HTH-510",
          name: "Hawthorn Evening",
          type: "Dinner Suit",
          cloth: "Black barathea · Holland & Sherry",
          price: "From $3,800",
          alt: "Black-tie eveningwear",
          media: { kind: "photo", src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop" },
        },
      ],
    },
  ],
};

/* ──────────────────────── SHOES ──────────────────────── */

// All shoes use the same verified hand-welted brogues photo at different
// crops/intentions. When real product photography arrives, swap per-item.
const SHOE_IMG = "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop";

const shoes: Library = {
  slug: "shoes",
  eyebrow: "The Shoe Library",
  title: "Handmade Shoes.",
  intro:
    "Cut from a last drawn for the foot itself. Goodyear-welted in Northampton from single hides of polished or country calf. A pair kept for thirty years rather than three.",
  heroImage: SHOE_IMG,
  heroAlt: "A pair of hand-welted brown brogue Oxfords",
  stats: [
    { label: "Hours per pair", value: "≈ 80" },
    { label: "Lasts available", value: "12" },
    { label: "Lead time", value: "10 weeks" },
  ],
  sections: [
    {
      slug: "city",
      title: "The City Shoe",
      note: "For boardrooms, dinners, and the days that demand polish.",
      items: [
        { sku: "OXF-001", name: "The Oxford", type: "Plain-Toe Oxford", cloth: "Polished calf · black", price: "From $1,150", alt: "Plain-toe Oxford in black", media: { kind: "photo", src: SHOE_IMG } },
        { sku: "OXF-002", name: "The Cap-Toe", type: "Cap-Toe Oxford", cloth: "Museum-finish calf · black", price: "From $1,180", alt: "Cap-toe Oxford in black", media: { kind: "photo", src: SHOE_IMG } },
        { sku: "OXF-003", name: "Whole Cut", type: "Single-Piece Oxford", cloth: "Glove calf · oxblood", price: "From $1,280", alt: "Whole-cut Oxford in oxblood", media: { kind: "photo", src: SHOE_IMG } },
      ],
    },
    {
      slug: "country",
      title: "Country & Weekend",
      note: "Heavier soles, country calf, made for the gravel drive.",
      items: [
        { sku: "BRG-101", name: "The Country Brogue", type: "Full Brogue", cloth: "Country calf · chestnut", price: "From $1,280", alt: "Full brogue country shoe", media: { kind: "photo", src: SHOE_IMG } },
        { sku: "MNK-110", name: "Double-Monk", type: "Monk Strap", cloth: "Polished calf · burgundy", price: "From $1,320", alt: "Double-monk strap shoe", media: { kind: "photo", src: SHOE_IMG } },
        { sku: "CHK-201", name: "The Chukka", type: "Suede Boot", cloth: "Snuff suede · crepe sole", price: "From $1,050", alt: "Suede chukka boot", media: { kind: "photo", src: SHOE_IMG } },
      ],
    },
  ],
};

/* ──────────────────────── TIES & SILKS ──────────────────────── */

const ties: Library = {
  slug: "ties",
  eyebrow: "The Silk Library",
  title: "Ties & Silks.",
  intro:
    "The smallest pieces, often the most considered. Hand-rolled in Como, 8-fold and 7-fold silks, ancient madders, knit silks, and the pocket squares that finish a jacket.",
  heroImage:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1800&auto=format&fit=crop",
  heroAlt: "A three-piece suit with a striped silk tie and pocket square",
  stats: [
    { label: "Mills in Como", value: "9" },
    { label: "Silks held in library", value: "200+" },
    { label: "Made by hand", value: "All" },
  ],
  sections: [
    {
      slug: "plain",
      title: "Plain Silks",
      note: "Solid grenadines and weaves. The base of any wardrobe.",
      items: [
        { sku: "PLN-001", name: "Burgundy Grenadine", type: "8-Fold Necktie", cloth: "Garza fina · Como", price: "$185", alt: "Burgundy grenadine tie", media: { kind: "tie", color: "#6e2639", pattern: "grenadine", accent: "#8b3a52" } },
        { sku: "PLN-002", name: "Midnight Twill", type: "8-Fold Necktie", cloth: "Twill silk · Como", price: "$185", alt: "Navy twill tie", media: { kind: "tie", color: "#1f2c4a", pattern: "solid" } },
        { sku: "PLN-003", name: "Charcoal Grenadine", type: "8-Fold Necktie", cloth: "Garza grossa · Como", price: "$185", alt: "Charcoal grenadine tie", media: { kind: "tie", color: "#2f2c2a", pattern: "grenadine" } },
        { sku: "PLN-004", name: "Forest Plain", type: "7-Fold Necktie", cloth: "Plain silk · Como", price: "$210", alt: "Forest green plain tie", media: { kind: "tie", color: "#2e4a3a", pattern: "solid" } },
      ],
    },
    {
      slug: "patterned",
      title: "Striped & Patterned",
      note: "Club stripes, fine stripes, paisleys and dotted silks.",
      items: [
        { sku: "PAT-101", name: "Madison Club Stripe", type: "8-Fold Necktie", cloth: "Como silk · burgundy on ivory", price: "$195", alt: "Burgundy club stripe tie", media: { kind: "tie", color: "#6e2639", accent: "#f6f1ea", pattern: "stripe-club" }, scale: 2 },
        { sku: "PAT-102", name: "Westbourne Fine Stripe", type: "8-Fold Necktie", cloth: "Como silk · navy / silver", price: "$195", alt: "Navy fine stripe tie", media: { kind: "tie", color: "#1f2c4a", accent: "#c9c1b3", pattern: "stripe-fine" } },
        { sku: "PAT-103", name: "Ascot Paisley", type: "8-Fold Necktie", cloth: "Como silk · navy / gold", price: "$210", alt: "Navy paisley tie", media: { kind: "tie", color: "#1f2c4a", accent: "#c9a961", pattern: "paisley" } },
        { sku: "PAT-104", name: "Spitalfields Dot", type: "8-Fold Necktie", cloth: "Como silk · burgundy / ivory", price: "$195", alt: "Burgundy dot tie", media: { kind: "tie", color: "#6e2639", accent: "#f6f1ea", pattern: "dot" } },
        { sku: "PAT-105", name: "Regent Club Stripe", type: "8-Fold Necktie", cloth: "Como silk · forest / cream", price: "$195", alt: "Forest club stripe tie", media: { kind: "tie", color: "#2e4a3a", accent: "#ddd0bb", pattern: "stripe-club" } },
        { sku: "PAT-106", name: "Holborn Paisley", type: "8-Fold Necktie", cloth: "Como silk · burgundy / sand", price: "$210", alt: "Burgundy paisley tie", media: { kind: "tie", color: "#6e2639", accent: "#ddd0bb", pattern: "paisley" } },
      ],
    },
    {
      slug: "knit",
      title: "Knit Silks",
      note: "Square-bottom knits in matte silk and Cashmere blends.",
      items: [
        { sku: "KNT-201", name: "Knit Silk · Wine", type: "Knit Tie", cloth: "Matte silk · square-end", price: "$160", alt: "Wine knit silk tie", media: { kind: "tie", color: "#4f1b29", pattern: "grenadine" } },
        { sku: "KNT-202", name: "Knit Silk · Navy", type: "Knit Tie", cloth: "Matte silk · square-end", price: "$160", alt: "Navy knit silk tie", media: { kind: "tie", color: "#15243f", pattern: "grenadine" } },
        { sku: "KNT-203", name: "Knit Silk · Charcoal", type: "Knit Tie", cloth: "Matte silk · square-end", price: "$160", alt: "Charcoal knit silk tie", media: { kind: "tie", color: "#27241f", pattern: "grenadine" } },
      ],
    },
  ],
};

export const libraries: Record<string, Library> = {
  tailoring,
  shoes,
  ties,
};

export const librarySlugs = Object.keys(libraries);
