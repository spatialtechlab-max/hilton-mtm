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
  // Note: the homepage Categories tiles, the library hero, and the
  // Design Yours picker all share a single library.<slug>.cover slot
  // per garment now — defined further down. The retired
  // home.category.* keys are no longer rendered anywhere; admin only
  // sees one Library cover row per garment.
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
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
    fallbackAlt: "A bespoke navy windowpane suit, hand-finished",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.suits.cover",
    group: "Library",
    label: "Suits library cover",
    description: "Used in three places: the homepage Categories tile, the /library/suits hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
    fallbackAlt: "A bespoke navy windowpane suit, hand-finished",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.jackets.cover",
    group: "Library",
    label: "Jackets library cover",
    description: "Used in three places: the homepage Categories tile, the /library/jackets hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback: "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial/1585_pic_cropped.jpg",
    fallbackAlt: "A standalone bespoke jacket on the form",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.shirts.cover",
    group: "Library",
    label: "Shirts library cover",
    description: "Used in three places: the homepage Categories tile, the /library/shirts hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1800&auto=format&fit=crop",
    fallbackAlt: "A crisp white made-to-measure dress shirt",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.trousers.cover",
    group: "Library",
    label: "Trousers library cover",
    description: "Used in three places: the homepage Categories tile, the /library/trousers hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1800&auto=format&fit=crop",
    fallbackAlt: "Tailored wool trousers",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.shoes.cover",
    group: "Library",
    label: "Shoes library cover",
    description: "Used in three places: the homepage Categories tile, the /library/shoes hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback: "/products/shoes/5308-marrone.png",
    fallbackAlt: "Double-monk in vintage marrone, polished calf and suede combination",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.ties.cover",
    group: "Library",
    label: "Ties library cover",
    description: "Used in three places: the homepage Categories tile, the /library/ties hero, and the Design Yours picker tile on /customize. Upload once and it shows everywhere.",
    fallback: "/products/ties/HBTS082.webp",
    fallbackAlt: "Navy paisley silk tie in 8-fold Como silk",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.belts.cover",
    group: "Library",
    label: "Belts library cover",
    description: "Hero photo for /library/belts.",
    fallback: "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial/679_pic_cropped.jpg",
    fallbackAlt: "A leather dress belt",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "library.cloths.cover",
    group: "Library",
    label: "Cloths library cover",
    description: "Hero photo for /library/cloths.",
    fallback: "https://erp.hiltontailoringhouse.com/uploads/item_rawmaterial/1542_pic_cropped.jpg",
    fallbackAlt: "A roll of suiting fabric",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "heritage.hero",
    group: "Editorial",
    label: "Heritage page — hero photo",
    description:
      "The landscape image beside 'Heritage.' at the top of /heritage.",
    fallback:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "An archive photograph of the original atelier",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
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
    label: "Made to Measure page — hero photo",
    description:
      "The landscape image beside 'Made to Measure.' at the top of /made-to-measure. Use a wide shot (wider than tall) so it doesn't get cropped.",
    fallback:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1400&auto=format&fit=crop",
    fallbackAlt: "A basted jacket on the cutting table",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },
  {
    key: "process.instore",
    group: "Editorial",
    label: "Made to Measure page — In-Store Experience photo",
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
    label: "Made to Measure page — Online Experience photo",
    description:
      "The portrait image beside 'The Online Experience.' on /process.",
    fallback:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    fallbackAlt: "A bespoke jacket detail",
    aspect: "4/5",
    recommendedSize: "1600 × 2000 px",
  },

  // ── Homepage atelier strip ──
  {
    key: "home.atelier.1",
    group: "Home",
    label: "Atelier strip — frame 1 (Drawing the curve)",
    description: "First photo in the three-up atelier strip on the homepage.",
    fallback: "/atelier/drawing-the-curve.jpg",
    fallbackAlt: "Hand-drawing the curve of the lapel on tissue",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "home.atelier.2",
    group: "Home",
    label: "Atelier strip — frame 2 (The cut)",
    description: "Second photo in the three-up atelier strip on the homepage.",
    fallback: "/atelier/the-cut.jpg",
    fallbackAlt: "Master tailor making the first cut on dark cloth",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "home.atelier.3",
    group: "Home",
    label: "Atelier strip — frame 3 (Tie wall)",
    description: "Third photo in the three-up atelier strip on the homepage.",
    fallback: "/atelier/tie-wall.jpg",
    fallbackAlt: "The atelier's silk tie wall",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },

  // ── Heritage mill-book gallery ──
  {
    key: "heritage.mill.1",
    group: "Editorial",
    label: "Heritage — mill folio 1 (Vitale Barberis Canonico)",
    description: "First panel in the swatch-folio gallery near the bottom of /heritage.",
    fallback: "/atelier/vbc-book.jpg",
    fallbackAlt: "Vitale Barberis Canonico swatch book and cloth folios",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "heritage.mill.2",
    group: "Editorial",
    label: "Heritage — mill folio 2 (Zegna Mediterranea)",
    description: "Second panel in the swatch-folio gallery on /heritage.",
    fallback: "/atelier/zegna-mediterranea.jpg",
    fallbackAlt: "Ermenegildo Zegna 'Mediterranea' folio with horn buttons",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "heritage.mill.3",
    group: "Editorial",
    label: "Heritage — mill folio 3 (Trofeo Summer)",
    description: "Third panel in the swatch-folio gallery on /heritage.",
    fallback: "/atelier/trofeo-book.jpg",
    fallbackAlt: "Trofeo Summer swatch book opened across the bench",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "heritage.mill.4",
    group: "Editorial",
    label: "Heritage — mill folio 4 (Carnet Jackets)",
    description: "Fourth panel in the swatch-folio gallery on /heritage.",
    fallback: "/atelier/carnet-jackets.jpg",
    fallbackAlt: "Carnet jacketing swatches fanned with horn buttons",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "heritage.mill.5",
    group: "Editorial",
    label: "Heritage — mill folio 5 (Alumo Shirting)",
    description: "Fifth panel in the swatch-folio gallery on /heritage.",
    fallback: "/atelier/alumo-shirting.jpg",
    fallbackAlt: "Alumo shirting swatches and the year's shirting cards",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },
  {
    key: "heritage.mill.6",
    group: "Editorial",
    label: "Heritage — mill folio 6 (Silk room)",
    description: "Sixth panel in the swatch-folio gallery on /heritage.",
    fallback: "/atelier/pocket-squares.jpg",
    fallbackAlt: "Silk pocket squares on the showroom rack",
    aspect: "4/5",
    recommendedSize: "1200 × 1500 px",
  },

  // ── /book hero ──
  {
    key: "book.hero",
    group: "Editorial",
    label: "Book a Fitting — hero photo",
    description: "The hero image on the /book page.",
    fallback:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1400&auto=format&fit=crop",
    fallbackAlt: "The Hilton Tailoring House atelier",
    aspect: "3/2",
    recommendedSize: "1800 × 1200 px",
  },

];
