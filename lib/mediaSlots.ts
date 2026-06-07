/**
 * Editorial slot registry. Lives in a non-client module so server
 * components (the homepage hero, library covers etc.) can read
 * MEDIA_SLOTS at build time without going through the "use client"
 * boundary in lib/media.ts (where the Supabase-using helpers live).
 */

export type MediaSlot = {
  key: string;
  group: "Home" | "Library" | "Editorial";
  label: string;
  description: string;
  fallback: string;
  fallbackAlt: string;
  /** Recommended aspect — for the admin preview only. */
  aspect: string;
  /** Recommended pixel dimensions, shown on the admin row so the
   *  atelier can give the photographer concrete numbers. Width × height. */
  recommendedSize: string;
};

export const MEDIA_SLOTS: MediaSlot[] = [
  {
    key: "home.hero",
    group: "Home",
    label: "Homepage hero banner",
    description:
      "The full-bleed image at the top of the homepage. Lands behind the headline.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "Tailor finishing a navy jacket at the cutting bench",
    aspect: "16/10",
    recommendedSize: "2400 × 1500 px",
  },
  {
    key: "home.collection.1",
    group: "Home",
    label: "Homepage Collection — tile 1 (Suit)",
    description: "First tile in the four-up A wardrobe, considered. strip.",
    fallback:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "The Two-Piece suit",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "home.collection.2",
    group: "Home",
    label: "Homepage Collection — tile 2 (Shoe)",
    description: "Second tile in the four-up A wardrobe, considered. strip.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Vintage Marrone double-monk",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "home.collection.3",
    group: "Home",
    label: "Homepage Collection — tile 3 (Tie)",
    description: "Third tile in the four-up A wardrobe, considered. strip.",
    fallback: "/products/ties/HBTS082.webp",
    fallbackAlt: "Navy paisley silk tie",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "home.collection.4",
    group: "Home",
    label: "Homepage Collection — tile 4 (Shirt)",
    description: "Fourth tile in the four-up A wardrobe, considered. strip.",
    fallback:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "The Evening Shirt",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "home.category.suits",
    group: "Home",
    label: "Homepage Category — Suits",
    description: "Large featured tile in the homepage Categories block.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
    fallbackAlt: "A bespoke navy suit on the form",
    aspect: "4/5",
    recommendedSize: "1600 × 2000 px",
  },
  {
    key: "home.category.jackets",
    group: "Home",
    label: "Homepage Category — Jackets",
    description: "Standalone jackets / sport coats tile on the homepage.",
    fallback: "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial/1585_pic_cropped.jpg",
    fallbackAlt: "A standalone Delfino sport coat",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "home.category.shirts",
    group: "Home",
    label: "Homepage Category — Shirts",
    description: "Top-right tile in the homepage Categories block.",
    fallback:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "A crisp made-to-measure dress shirt",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "home.category.trousers",
    group: "Home",
    label: "Homepage Category — Trousers",
    description: "Tile in the homepage Categories block.",
    fallback:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "Tailored wool trousers",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "home.category.shoes",
    group: "Home",
    label: "Homepage Category — Handmade Shoes",
    description: "Bottom tile in the homepage Categories block.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Vintage marrone double-monk",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "home.category.ties",
    group: "Home",
    label: "Homepage Category — Ties & Silks",
    description: "Bottom tile in the homepage Categories block.",
    fallback: "/products/ties/HBTS082.webp",
    fallbackAlt: "Navy paisley silk tie",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "home.showroom",
    group: "Home",
    label: "Homepage — Recently in the atelier",
    description:
      "Large feature photo for the 'A navy double-breasted, finished this week.' band on the homepage.",
    fallback: "/atelier/showroom-double-breasted.jpg",
    fallbackAlt: "A bespoke double-breasted suit on the form at the Hilton atelier",
    aspect: "5/4",
    recommendedSize: "2000 × 1600 px",
  },
  {
    key: "library.tailoring.cover",
    group: "Library",
    label: "Tailoring library cover",
    description: "Hero photo for /library/tailoring — suits & jackets.",
    fallback:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "A bespoke navy windowpane suit, hand-finished",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.shirts.cover",
    group: "Library",
    label: "Shirts library cover",
    description: "Hero photo for /library/shirts.",
    fallback: "/atelier/alumo-shirting.jpg",
    fallbackAlt: "Alumo shirting swatches",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.trousers.cover",
    group: "Library",
    label: "Trousers library cover",
    description: "Hero photo for /library/trousers.",
    fallback: "/atelier/trofeo-book.jpg",
    fallbackAlt: "Trofeo trouser cloth book",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.shoes.cover",
    group: "Library",
    label: "Shoes library cover",
    description: "Hero photo for /library/shoes.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Double-monk in vintage marrone leather",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.ties.cover",
    group: "Library",
    label: "Ties library cover",
    description: "Hero photo for /library/ties.",
    fallback: "/atelier/tie-wall.jpg",
    fallbackAlt: "The atelier's silk tie wall",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.belts.cover",
    group: "Library",
    label: "Belts library cover",
    description: "Hero photo for /library/belts.",
    fallback: "/atelier/pocket-squares.jpg",
    fallbackAlt: "Magnanni and Gufo belt buckles on the bench",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "library.cloths.cover",
    group: "Library",
    label: "Cloths library cover",
    description: "Hero photo for /library/cloths.",
    fallback: "/atelier/vbc-book.jpg",
    fallbackAlt: "Vitale Barberis Canonico swatch book",
    aspect: "16/10",
    recommendedSize: "1800 × 1125 px",
  },
  {
    key: "heritage.hero",
    group: "Editorial",
    label: "Heritage page — hero photo",
    description:
      "The portrait image beside 'Heritage.' at the top of /heritage.",
    fallback:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "An archive photograph of the original atelier",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "heritage.atelier",
    group: "Editorial",
    label: "Heritage page — atelier full-bleed photo",
    description:
      "The wide image mid-page on /heritage, between the founder's story and the timeline.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "The Hilton Tailoring House atelier floor in Manama",
    aspect: "16/10",
    recommendedSize: "2400 × 1500 px",
  },
  {
    key: "process.hero",
    group: "Editorial",
    label: "Process page — hero photo",
    description:
      "The portrait image beside 'Made to Measure.' at the top of /process. Use a portrait shot (taller than wide) so it doesn't get cropped.",
    fallback:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1400&auto=format&fit=crop",
    fallbackAlt: "A basted jacket on the cutting table",
    aspect: "3/4",
    recommendedSize: "1200 × 1600 px",
  },
  {
    key: "process.instore",
    group: "Editorial",
    label: "Process page — In-Store Experience photo",
    description:
      "The portrait image beside 'The In-Store Experience.' on /process.",
    fallback:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "The master tailor at work",
    aspect: "4/5",
    recommendedSize: "1600 × 2000 px",
  },
  {
    key: "process.online",
    group: "Editorial",
    label: "Process page — Online Experience photo",
    description:
      "The portrait image beside 'The Online Experience.' on /process.",
    fallback:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "A bespoke jacket detail",
    aspect: "4/5",
    recommendedSize: "1600 × 2000 px",
  },
];
