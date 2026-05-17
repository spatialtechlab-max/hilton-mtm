/**
 * Each category on the home page (Tailoring, Footwear, Accessories) takes
 * the visitor to its own *library* — a curated room dedicated to that one
 * thing. Real product photography for ties and shoes lives in
 * /public/products and is referenced by relative path.
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
  sale?: string;
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
/* No real suit photography from the client yet — keeping the editorial
   Unsplash menswear shots as placeholders until we receive them.       */

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
        { sku: "WLD-201", name: "Walden", type: "Two-Piece", cloth: "Worsted wool · Huddersfield", price: "From $2,400", alt: "Navy worsted two-piece suit", media: { kind: "photo", src: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "BCN-301", name: "Beacon", type: "Three-Piece", cloth: "Tweed · Fox Brothers", price: "From $2,950", alt: "Blue tweed three-piece suit", media: { kind: "photo", src: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "MDS-210", name: "Madison", type: "Two-Piece", cloth: "Windowpane wool · Loro Piana", price: "From $2,650", alt: "Navy windowpane suit", media: { kind: "photo", src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "ATL-205", name: "Atelier Cutaway", type: "Two-Piece", cloth: "Mohair-wool · Smith Woollens", price: "From $2,800", alt: "Navy cutaway suit at the atelier", media: { kind: "photo", src: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1600&auto=format&fit=crop" } },
      ],
    },
    {
      slug: "jackets",
      title: "Jackets & Sport Coats",
      note: "Standalone tailoring for less formal hours.",
      items: [
        { sku: "MRL-110", name: "Marlow", type: "Sport Coat", cloth: "Hopsack · Loro Piana", price: "From $1,850", alt: "Hopsack sport coat", media: { kind: "photo", src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "LND-115", name: "Linden Linen", type: "Summer Jacket", cloth: "Pure linen · Solbiati", price: "From $1,650", alt: "Linen summer jacket", media: { kind: "photo", src: "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "BRG-118", name: "Burgundy Hopsack", type: "Sport Coat", cloth: "Hopsack · Holland & Sherry", price: "From $1,950", alt: "Burgundy hopsack sport coat", media: { kind: "photo", src: "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop" } },
      ],
    },
    {
      slug: "overcoats",
      title: "Overcoats & Eveningwear",
      note: "For the cold months and the late ones.",
      items: [
        { sku: "SVR-410", name: "Severn Topcoat", type: "Overcoat", cloth: "Camel hair · Abraham Moon", price: "From $3,200", alt: "Camel-hair topcoat", media: { kind: "photo", src: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "CRL-420", name: "Carlyle Pea Coat", type: "Pea Coat", cloth: "Melton wool · navy", price: "From $2,800", alt: "Navy pea coat", media: { kind: "photo", src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop" } },
        { sku: "HTH-510", name: "Hawthorn Evening", type: "Dinner Suit", cloth: "Black barathea · Holland & Sherry", price: "From $3,800", alt: "Black-tie eveningwear", media: { kind: "photo", src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop" } },
      ],
    },
  ],
};

/* ──────────────────────── SHOES ──────────────────────── */
/* All real product photography from hiltonmtm.com.  */

const shoes: Library = {
  slug: "shoes",
  eyebrow: "The Shoe Library",
  title: "Handmade Shoes.",
  intro:
    "Magnanni and Zampiere lasts, hand-finished in Spain and Italy. Whole cuts, monk-straps, brogues and patent eveningwear, in calf, suede, and combinations of both.",
  heroImage: "/products/shoes/5308-marrone.png",
  heroAlt: "Double-monk in vintage marrone, polished calf and suede combination",
  stats: [
    { label: "Lasts in the workshop", value: "12" },
    { label: "Available finishes", value: "30+" },
    { label: "Lead time", value: "10 weeks" },
  ],
  sections: [
    {
      slug: "evening",
      title: "Eveningwear",
      note: "Patent calf and museum finishes — for the late hours.",
      items: [
        { sku: "12563", name: "Negro Black", type: "Patent Derby", cloth: "Magnanni · patent calf", price: "د.ب 1,000", alt: "Patent black Derby by Magnanni", media: { kind: "photo", src: "/products/shoes/12563-negro.png" } },
        { sku: "50127", name: "Negro Whole Cut", type: "Whole-Cut Oxford", cloth: "Polished calf · black", price: "د.ب 1,000", alt: "Black whole-cut Oxford", media: { kind: "photo", src: "/products/shoes/50127-negro.png" } },
        { sku: "17005", name: "Negro al Tono", type: "Patina Oxford", cloth: "Magnanni · museum finish", price: "د.ب 1,000", alt: "Black museum-finish Oxford", media: { kind: "photo", src: "/products/shoes/17005-negro-al-tono.png" } },
      ],
    },
    {
      slug: "city",
      title: "The City Shoe",
      note: "For boardrooms, dinners, and the days that demand polish.",
      items: [
        { sku: "13232", name: "Negro Magnani", type: "Plain-Toe Oxford", cloth: "Magnanni · calf · black", price: "د.ب 1,000", alt: "Plain-toe Oxford in black", media: { kind: "photo", src: "/products/shoes/13232-negro.png" } },
        { sku: "19568", name: "Conac", type: "Cognac Derby", cloth: "Magnanni · burnished calf", price: "د.ب 1,000", alt: "Cognac Derby in burnished calf", media: { kind: "photo", src: "/products/shoes/19568-conac.png" } },
        { sku: "17587", name: "Conac Marron", type: "Oxford", cloth: "Magnanni · museum patina", price: "د.ب 1,000", alt: "Marron museum-patina Oxford", media: { kind: "photo", src: "/products/shoes/17587-conac-marron.png" } },
        { sku: "20166", name: "Azul Magnanni", type: "Suede Oxford", cloth: "Magnanni · navy suede", price: "د.ب 1,000", alt: "Navy suede Oxford by Magnanni", media: { kind: "photo", src: "/products/shoes/20166-azul.png" } },
        { sku: "5054", name: "Vintage Grafite", type: "Grafite Oxford", cloth: "Zampiere · vintage finish", price: "د.ب 1,000", alt: "Graphite vintage Oxford by Zampiere", media: { kind: "photo", src: "/products/shoes/5054-grafite.png" } },
        { sku: "5396", name: "Cuoio", type: "Tan Derby", cloth: "Zampiere · cuoio calf", price: "د.ب 1,000", alt: "Cuoio tan Derby by Zampiere", media: { kind: "photo", src: "/products/shoes/5396-cuoio.png" } },
      ],
    },
    {
      slug: "weekend",
      title: "Weekend & Country",
      note: "Suede combinations, monk-straps and country calf.",
      items: [
        { sku: "5308", name: "Vintage Marrone", type: "Double Monk", cloth: "Zampiere · calf & suede", price: "د.ب 1,000", alt: "Double-monk in vintage marrone, calf and suede", media: { kind: "photo", src: "/products/shoes/5308-marrone.png" }, scale: 2 },
        { sku: "5227", name: "Muflone Cuoio", type: "Country Brogue", cloth: "Zampiere · muflone calf", price: "د.ب 1,000", alt: "Muflone country brogue by Zampiere", media: { kind: "photo", src: "/products/shoes/5227-muflone.png" } },
        { sku: "43248-AZ", name: "Azul Combination", type: "Suede Loafer", cloth: "Navy suede & calf", price: "د.ب 1,000", alt: "Navy suede and calf loafer", media: { kind: "photo", src: "/products/shoes/43248-azul.png" } },
        { sku: "43248-MA", name: "Marron Combination", type: "Suede Loafer", cloth: "Marron suede & calf", price: "د.ب 1,000", alt: "Marron suede and calf loafer", media: { kind: "photo", src: "/products/shoes/43248-marron.png" } },
        { sku: "50104-AZ", name: "Azul Penny", type: "Penny Loafer", cloth: "Polished navy calf", price: "د.ب 1,000", alt: "Navy penny loafer", media: { kind: "photo", src: "/products/shoes/50104-azul.png" } },
        { sku: "50104-MA", name: "Maroon Penny", type: "Penny Loafer", cloth: "Polished maroon calf", price: "د.ب 1,000", alt: "Maroon penny loafer", media: { kind: "photo", src: "/products/shoes/50104-maroon.png" } },
      ],
    },
  ],
};

/* ──────────────────────── TIES & SILKS ──────────────────────── */
/* All real product photography from hiltonmtm.com.  */

const ties: Library = {
  slug: "ties",
  eyebrow: "The Silk Library",
  title: "Ties & Silks.",
  intro:
    "Hand-rolled silks from the Como mills. Paisleys, club stripes, dots, and the quiet plain weaves that anchor a wardrobe. Every tie is 8-fold, with hand-stitched bartacks and slip-stitch keepers.",
  heroImage: "/products/ties/HBTS082.webp",
  heroAlt: "Navy paisley silk tie in 8-fold Como silk",
  stats: [
    { label: "Mills in Como", value: "9" },
    { label: "Silks held in library", value: "200+" },
    { label: "Made by hand", value: "All" },
  ],
  sections: [
    {
      slug: "new",
      title: "New Season",
      note: "The latest silks to land at the Madison atelier.",
      items: [
        { sku: "HBTS086", name: "Sienna Paisley", type: "8-Fold Necktie", cloth: "Como silk · paisley", price: "د.ب 100", alt: "Sienna paisley tie", media: { kind: "photo", src: "/products/ties/HBTS086.webp" } },
        { sku: "HBTS085", name: "Indigo Club", type: "8-Fold Necktie", cloth: "Como silk · club stripe", price: "د.ب 100", alt: "Indigo club stripe tie", media: { kind: "photo", src: "/products/ties/HBTS085.webp" } },
        { sku: "HBTS084", name: "Wine Geometric", type: "8-Fold Necktie", cloth: "Como silk · geometric", price: "د.ب 100", alt: "Wine geometric tie", media: { kind: "photo", src: "/products/ties/HBTS084.webp" } },
        { sku: "HBTS083", name: "Royal Block", type: "8-Fold Necktie", cloth: "Como silk · block weave", price: "د.ب 100", alt: "Royal block weave tie", media: { kind: "photo", src: "/products/ties/HBTS083.webp" } },
        { sku: "HBTS082", name: "Navy Paisley", type: "8-Fold Necktie", cloth: "Como silk · paisley", price: "د.ب 100", alt: "Navy paisley tie", media: { kind: "photo", src: "/products/ties/HBTS082.webp" } },
        { sku: "HBTS081", name: "Cardinal Florals", type: "8-Fold Necktie", cloth: "Como silk · florals", price: "د.ب 100", alt: "Cardinal florals tie", media: { kind: "photo", src: "/products/ties/HBTS081.webp" } },
        { sku: "HBTS080", name: "Garnet Medallion", type: "8-Fold Necktie", cloth: "Como silk · medallion", price: "د.ب 100", alt: "Garnet medallion tie", media: { kind: "photo", src: "/products/ties/HBTS080.webp" } },
        { sku: "HBTS079", name: "Ink Striped", type: "8-Fold Necktie", cloth: "Como silk · diagonal", price: "د.ب 100", alt: "Ink striped tie", media: { kind: "photo", src: "/products/ties/HBTS079.webp" } },
      ],
    },
    {
      slug: "library",
      title: "The Library",
      note: "The house archive — patterns held in stock at all times.",
      items: [
        { sku: "HBTS001", name: "Cardinal Paisley", type: "8-Fold Necktie", cloth: "Como silk · paisley", price: "د.ب 100", alt: "Cardinal paisley tie", media: { kind: "photo", src: "/products/ties/HBTS001.webp" } },
        { sku: "HBTS002", name: "Botanical Print", type: "8-Fold Necktie", cloth: "Como silk · print", price: "د.ب 100", alt: "Botanical print tie", media: { kind: "photo", src: "/products/ties/HBTS002.webp" } },
        { sku: "HBTS003", name: "Estate Foulard", type: "8-Fold Necktie", cloth: "Como silk · foulard", price: "د.ب 100", alt: "Estate foulard tie", media: { kind: "photo", src: "/products/ties/HBTS003.webp" } },
        { sku: "HBTS004", name: "Marina Stripe", type: "8-Fold Necktie", cloth: "Como silk · stripe", price: "د.ب 100", alt: "Marina stripe tie", media: { kind: "photo", src: "/products/ties/HBTS004.webp" } },
        { sku: "HBTS005", name: "Crest Motif", type: "8-Fold Necktie", cloth: "Como silk · crest", price: "د.ب 100", alt: "Crest motif tie", media: { kind: "photo", src: "/products/ties/HBTS005.webp" } },
        { sku: "HBTS006", name: "Garden Floral", type: "8-Fold Necktie", cloth: "Como silk · floral", price: "د.ب 100", alt: "Garden floral tie", media: { kind: "photo", src: "/products/ties/HBTS006.webp" } },
        { sku: "HBTS007", name: "Salon Dot", type: "8-Fold Necktie", cloth: "Como silk · dot", price: "د.ب 100", alt: "Salon dot tie", media: { kind: "photo", src: "/products/ties/HBTS007.webp" } },
        { sku: "HBTS008", name: "Trellis Weave", type: "8-Fold Necktie", cloth: "Como silk · trellis", price: "د.ب 100", alt: "Trellis weave tie", media: { kind: "photo", src: "/products/ties/HBTS008.webp" } },
        { sku: "HBTS009", name: "Drawing Room", type: "8-Fold Necktie", cloth: "Como silk · pattern", price: "د.ب 100", alt: "Drawing room pattern tie", media: { kind: "photo", src: "/products/ties/HBTS009.webp" } },
        { sku: "HBTS010", name: "Atelier Print", type: "8-Fold Necktie", cloth: "Como silk · print", price: "د.ب 100", alt: "Atelier print tie", media: { kind: "photo", src: "/products/ties/HBTS010.webp" } },
        { sku: "HBTS011", name: "Heritage Stripe", type: "8-Fold Necktie", cloth: "Como silk · stripe", price: "د.ب 100", alt: "Heritage stripe tie", media: { kind: "photo", src: "/products/ties/HBTS011.webp" } },
        { sku: "HBTS012", name: "Court Paisley", type: "8-Fold Necktie", cloth: "Como silk · paisley", price: "د.ب 100", alt: "Court paisley tie", media: { kind: "photo", src: "/products/ties/HBTS012.webp" } },
        { sku: "HBTS013", name: "Library Solid", type: "8-Fold Necktie", cloth: "Como silk · solid", price: "د.ب 100", alt: "Library solid tie", media: { kind: "photo", src: "/products/ties/HBTS013.webp" } },
        { sku: "HBTS014", name: "Curator Pattern", type: "8-Fold Necktie", cloth: "Como silk · pattern", price: "د.ب 100", alt: "Curator pattern tie", media: { kind: "photo", src: "/products/ties/HBTS014.webp" } },
        { sku: "HBTS015", name: "Reserve Motif", type: "8-Fold Necktie", cloth: "Como silk · motif", price: "د.ب 100", alt: "Reserve motif tie", media: { kind: "photo", src: "/products/ties/HBTS015.webp" } },
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
