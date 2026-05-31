import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { PlaceholderBadge, isPlaceholder } from "./PlaceholderBadge";

type Tile = {
  category: string;
  title: string;
  href: string;
  image: string;
  alt: string;
  /** "cover" for full-bleed editorial images, "contain" for transparent product photos */
  fit?: "cover" | "contain";
};

const featured: Tile = {
  category: "Tailoring",
  title: "Suits & Jackets",
  href: "/library/tailoring",
  image:
    "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
  alt: "A bespoke jacket being shaped on the form",
  fit: "cover",
};

const rightTop: Tile[] = [
  {
    category: "Shirting",
    title: "Shirts",
    href: "/library/shirts",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop",
    alt: "A crisp made-to-measure dress shirt",
    fit: "cover",
  },
  {
    category: "Tailored",
    title: "Trousers",
    href: "/library/trousers",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1600&auto=format&fit=crop",
    alt: "Tailored wool trousers",
    fit: "cover",
  },
];

const bottom: Tile[] = [
  {
    category: "Footwear",
    title: "Handmade Shoes",
    href: "/library/shoes",
    image: "/products/shoes/5308-marrone.png",
    alt: "Vintage marrone double-monk by Zampiere",
    fit: "contain",
  },
  {
    category: "Accessories",
    title: "Ties & Silks",
    href: "/library/ties",
    image: "/products/ties/HBTS082.webp",
    alt: "Navy paisley 8-fold silk necktie",
    fit: "contain",
  },
];

export function Categories() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">The House</span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.5rem,6vw,5.5rem)] mt-6 leading-[0.98]">
              <SplitReveal text="A complete wardrobe, made by hand." />
            </h2>
          </div>
          <Reveal delay={0.2}>
            <Link
              href="/collection"
              className="text-eyebrow link-underline text-[var(--color-charcoal-900)]"
            >
              Browse all categories →
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Featured tile — left, full height on desktop */}
          <Reveal className="lg:row-span-2">
            <CategoryTile tile={featured} large />
          </Reveal>

          {/* Two stacked tiles — right */}
          {rightTop.map((tile, i) => (
            <Reveal key={tile.title} delay={0.1 + i * 0.08}>
              <CategoryTile tile={tile} />
            </Reveal>
          ))}
        </div>

        {/* Footwear + accessories row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8">
          {bottom.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 0.08}>
              <CategoryTile tile={tile} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ tile, large = false }: { tile: Tile; large?: boolean }) {
  const fit = tile.fit ?? "cover";
  // Product tiles (transparent png/webp) sit on a slightly deeper cream
  // so they read as a display case against the page background.
  const tileBg = fit === "contain" ? "bg-[var(--color-ivory-200)]" : "";
  const imgClass = fit === "contain" ? "object-contain p-10 md:p-14" : "object-cover";

  // Dark labels read better on transparent-product tiles (no full image to
  // wash out behind them); the editorial cover tile keeps the white-on-dark
  // gradient treatment.
  const labelTone = fit === "contain"
    ? "text-[var(--color-charcoal-900)]"
    : "text-[var(--color-ivory-100)]";
  const labelHover = fit === "contain"
    ? "group-hover:text-[var(--color-burgundy-700)]"
    : "group-hover:text-[var(--color-burgundy-300)]";

  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden hover-grow ${tileBg} ${
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[16/10]"
      }`}
    >
      {isPlaceholder(tile.image) && <PlaceholderBadge />}
      <Image
        src={tile.image}
        alt={tile.alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={imgClass}
      />

      {/* Gradient only on cover tiles — product tiles already have a calm bg */}
      {fit === "cover" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      )}

      <div className={`absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10 ${labelTone} flex items-end justify-between gap-6`}>
        <div>
          <span className={`text-eyebrow ${
            fit === "contain" ? "text-[var(--color-charcoal-500)]" : "text-[var(--color-ivory-100)]/75"
          }`}>
            {tile.category}
          </span>
          <h3
            className={`text-display mt-2 leading-tight transition-colors ${labelHover} ${
              large ? "text-[clamp(2rem,4vw,3.5rem)]" : "text-[clamp(1.75rem,2.4vw,2.5rem)]"
            }`}
          >
            {tile.title}
          </h3>
        </div>
        <ArrowUpRight
          size={large ? 28 : 22}
          strokeWidth={1.4}
          className="shrink-0 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
