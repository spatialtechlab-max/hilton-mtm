import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { MediaImage } from "./MediaImage";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

type Tile = {
  slot: string;
  category: string;
  title: string;
  href: string;
  /** "cover" for full-bleed editorial images, "contain" for transparent product photos */
  fit?: "cover" | "contain";
};

const slotMap = Object.fromEntries(MEDIA_SLOTS.map((s) => [s.key, s]));

const featured: Tile = {
  slot: "home.category.suits",
  category: "Tailoring",
  title: "Suits",
  href: "/library/suits",
  fit: "cover",
};

const rightTop: Tile[] = [
  {
    slot: "home.category.jackets",
    category: "Standalone",
    title: "Jackets",
    href: "/library/jackets",
    fit: "cover",
  },
  {
    slot: "home.category.shirts",
    category: "Shirting",
    title: "Shirts",
    href: "/library/shirts",
    fit: "cover",
  },
];

const bottom: Tile[] = [
  {
    slot: "home.category.trousers",
    category: "Tailored",
    title: "Trousers",
    href: "/library/trousers",
    fit: "cover",
  },
  {
    slot: "home.category.shoes",
    category: "Footwear",
    title: "Handmade Shoes",
    href: "/library/shoes",
    fit: "contain",
  },
  {
    slot: "home.category.ties",
    category: "Accessories",
    title: "Ties & Silks",
    href: "/library/ties",
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
            <h2 className="text-display text-[clamp(2rem,4.5vw,4rem)] mt-6 leading-[0.98]">
              <SplitReveal text="A complete wardrobe, made by hand." />
            </h2>
          </div>
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

        {/* Trousers + footwear + accessories row (three across so the
            new Jackets tile lands cleanly in the top group). */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-6 lg:mt-8">
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
  const tileBg = fit === "contain" ? "bg-[var(--color-ivory-200)]" : "";
  const imgClass = fit === "contain" ? "object-contain p-10 md:p-14" : "object-cover";
  const labelTone = fit === "contain"
    ? "text-[var(--color-charcoal-900)]"
    : "text-[var(--color-ivory-100)]";
  const labelHover = fit === "contain"
    ? "group-hover:text-[var(--color-burgundy-700)]"
    : "group-hover:text-[var(--color-burgundy-300)]";

  const slotDef = slotMap[tile.slot];

  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden hover-grow ${tileBg} ${
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[16/10]"
      }`}
    >
      <MediaImage
        slot={tile.slot}
        fallback={slotDef?.fallback ?? "/products/no-image.svg"}
        fallbackAlt={slotDef?.fallbackAlt ?? tile.title}
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
              large ? "text-[clamp(1.5rem,3vw,2.5rem)]" : "text-[clamp(1.375rem,2vw,2rem)]"
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
