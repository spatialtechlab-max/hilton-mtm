/**
 * Each category on the home page (Tailoring, Footwear, Accessories) takes
 * the visitor to its own *library* — a curated room dedicated to that one
 * thing. Not the full collection, not a product list. A single, considered
 * presentation of one kind of made-to-order work.
 */

export type LibraryItem = {
  name: string;
  type: string;
  cloth?: string;
  price: string;
  image: string;
  alt: string;
  /** Editorial size hint for the grid. 1 = standard, 2 = wide */
  scale?: 1 | 2;
};

export type Library = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  /** Three quick stats to show below the hero (e.g. mills, hours, choices) */
  stats: { label: string; value: string }[];
  /** Sub-categories / sections inside the library (e.g. Suits / Jackets / Overcoats) */
  sections: {
    title: string;
    note: string;
    items: LibraryItem[];
  }[];
};

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
      title: "Suits",
      note: "Two- and three-piece, drawn for one body, kept for life.",
      items: [
        {
          name: "Walden Two-Piece",
          type: "Two-Piece",
          cloth: "Worsted wool · Huddersfield",
          price: "From $2,400",
          image:
            "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop",
          alt: "Navy two-piece suit",
          scale: 2,
        },
        {
          name: "Beacon Three-Piece",
          type: "Three-Piece",
          cloth: "Flannel · Fox Brothers",
          price: "From $2,950",
          image:
            "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1600&auto=format&fit=crop",
          alt: "Tweed three-piece suit",
        },
      ],
    },
    {
      title: "Jackets & Sport Coats",
      note: "Standalone tailoring for less formal hours.",
      items: [
        {
          name: "Marlow Sport Coat",
          type: "Sport Coat",
          cloth: "Hopsack · Loro Piana",
          price: "From $1,850",
          image:
            "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1600&auto=format&fit=crop",
          alt: "Hopsack sport coat",
        },
        {
          name: "Linden Linen",
          type: "Summer Jacket",
          cloth: "Pure linen · Solbiati",
          price: "From $1,650",
          image:
            "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=1600&auto=format&fit=crop",
          alt: "Linen summer jacket",
        },
      ],
    },
    {
      title: "Overcoats & Eveningwear",
      note: "For the cold months and the late ones.",
      items: [
        {
          name: "Severn Topcoat",
          type: "Overcoat",
          cloth: "Camel hair · Abraham Moon",
          price: "From $3,200",
          image:
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1600&auto=format&fit=crop",
          alt: "Camel-hair topcoat",
        },
        {
          name: "Hawthorn Evening",
          type: "Dinner Suit",
          cloth: "Black barathea · Holland & Sherry",
          price: "From $3,800",
          image:
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
          alt: "Black-tie eveningwear",
          scale: 2,
        },
      ],
    },
  ],
};

const shoes: Library = {
  slug: "shoes",
  eyebrow: "The Shoe Library",
  title: "Handmade Shoes.",
  intro:
    "Cut from a last drawn for the foot itself. Goodyear-welted in Northampton from single hides of polished or country calf. A pair kept for thirty years rather than three.",
  heroImage:
    "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1800&auto=format&fit=crop",
  heroAlt: "A pair of hand-welted brown brogue Oxfords",
  stats: [
    { label: "Hours per pair", value: "≈ 80" },
    { label: "Lasts available", value: "12" },
    { label: "Lead time", value: "10 weeks" },
  ],
  sections: [
    {
      title: "The City Shoe",
      note: "For boardrooms, dinners, and the days that demand polish.",
      items: [
        {
          name: "The Oxford",
          type: "Plain-Toe Oxford",
          cloth: "Polished calf · Northampton",
          price: "From $1,150",
          image:
            "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
          alt: "Brown brogue Oxford shoes",
          scale: 2,
        },
        {
          name: "The Cap-Toe",
          type: "Cap-Toe Oxford",
          cloth: "Black calf · museum finish",
          price: "From $1,180",
          image:
            "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
          alt: "Cap-toe Oxford in black",
        },
      ],
    },
    {
      title: "Country & Weekend",
      note: "Heavier soles, country calf, made for the gravel drive.",
      items: [
        {
          name: "The Country Brogue",
          type: "Full Brogue",
          cloth: "Country calf · Goodyear-welted",
          price: "From $1,280",
          image:
            "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
          alt: "Full brogue country shoe",
        },
        {
          name: "The Chukka",
          type: "Suede Boot",
          cloth: "Snuff suede · crepe sole",
          price: "From $1,050",
          image:
            "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
          alt: "Suede chukka boot",
        },
      ],
    },
  ],
};

const ties: Library = {
  slug: "ties",
  eyebrow: "The Silk Library",
  title: "Ties & Silks.",
  intro:
    "The smallest pieces, often the most considered. Hand-rolled in Como, 8-fold and 7-fold silks, ancient madders, knit silks, and the pocket squares that finish a jacket.",
  heroImage:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1800&auto=format&fit=crop",
  heroAlt: "A three-piece suit with silk tie and pocket square",
  stats: [
    { label: "Mills in Como", value: "9" },
    { label: "Silks held in library", value: "200+" },
    { label: "Made by hand", value: "All" },
  ],
  sections: [
    {
      title: "Neckties",
      note: "8-fold and 7-fold silks, hand-rolled at the tip.",
      items: [
        {
          name: "Madison Striped",
          type: "8-Fold Necktie",
          cloth: "Como silk · burgundy stripe",
          price: "From $185",
          image:
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
          alt: "Burgundy striped silk tie",
          scale: 2,
        },
        {
          name: "Plain Knit Silk",
          type: "Knit Tie",
          cloth: "Como silk · matte finish",
          price: "From $160",
          image:
            "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop",
          alt: "Solid knit silk tie",
        },
      ],
    },
    {
      title: "Pocket Squares & Cravats",
      note: "Hand-rolled silks for the breast pocket and the open collar.",
      items: [
        {
          name: "Como Square",
          type: "Pocket Square",
          cloth: "Hand-rolled silk · 38 cm",
          price: "From $95",
          image:
            "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop",
          alt: "White silk pocket square",
        },
        {
          name: "Atelier Cravat",
          type: "Day Cravat",
          cloth: "Ancient madder · Macclesfield",
          price: "From $220",
          image:
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
          alt: "Madder silk day cravat",
        },
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
