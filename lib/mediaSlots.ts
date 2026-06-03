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
};

export const MEDIA_SLOTS: MediaSlot[] = [
  {
    key: "home.hero",
    group: "Home",
    label: "Homepage hero banner",
    description:
      "The full-bleed image at the top of the homepage. Lands behind the headline; needs to read at 2400×1500+.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "Tailor finishing a navy jacket at the cutting bench",
    aspect: "16/10",
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
  },
  {
    key: "library.shirts.cover",
    group: "Library",
    label: "Shirts library cover",
    description: "Hero photo for /library/shirts.",
    fallback: "/atelier/alumo-shirting.jpg",
    fallbackAlt: "Alumo shirting swatches",
    aspect: "16/10",
  },
  {
    key: "library.trousers.cover",
    group: "Library",
    label: "Trousers library cover",
    description: "Hero photo for /library/trousers.",
    fallback: "/atelier/trofeo-book.jpg",
    fallbackAlt: "Trofeo trouser cloth book",
    aspect: "16/10",
  },
  {
    key: "library.shoes.cover",
    group: "Library",
    label: "Shoes library cover",
    description: "Hero photo for /library/shoes.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Double-monk in vintage marrone leather",
    aspect: "16/10",
  },
  {
    key: "library.ties.cover",
    group: "Library",
    label: "Ties library cover",
    description: "Hero photo for /library/ties.",
    fallback: "/atelier/tie-wall.jpg",
    fallbackAlt: "The atelier's silk tie wall",
    aspect: "16/10",
  },
  {
    key: "library.belts.cover",
    group: "Library",
    label: "Belts library cover",
    description: "Hero photo for /library/belts.",
    fallback: "/atelier/pocket-squares.jpg",
    fallbackAlt: "Magnanni and Gufo belt buckles on the bench",
    aspect: "16/10",
  },
  {
    key: "library.cloths.cover",
    group: "Library",
    label: "Cloths library cover",
    description: "Hero photo for /library/cloths.",
    fallback: "/atelier/vbc-book.jpg",
    fallbackAlt: "Vitale Barberis Canonico swatch book",
    aspect: "16/10",
  },
  {
    key: "heritage.hero",
    group: "Editorial",
    label: "Heritage page hero",
    description: "The banner at the top of /heritage.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop",
    fallbackAlt: "Inside the Manama atelier",
    aspect: "16/10",
  },
];
