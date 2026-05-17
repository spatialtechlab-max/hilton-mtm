import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";

type Tile = {
  category: string;
  title: string;
  href: string;
  image: string;
  alt: string;
};

const featured: Tile = {
  category: "Tailoring",
  title: "Suits & Jackets",
  href: "/collection#suits",
  image:
    "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1800&auto=format&fit=crop",
  alt: "A bespoke jacket being shaped on the form",
};

const right: Tile[] = [
  {
    category: "Footwear",
    title: "Handmade Shoes",
    href: "/collection#shoes",
    image:
      "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
    alt: "Hand-welted brown brogue Oxfords",
  },
  {
    category: "Accessories",
    title: "Ties & Silks",
    href: "/collection#ties",
    image:
      "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop",
    alt: "A man in a burgundy blazer with silk tie and pocket square",
  },
];

export function Categories() {
  return (
    <section className="py-32 md:py-44">
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
          {right.map((tile, i) => (
            <Reveal key={tile.title} delay={0.1 + i * 0.08}>
              <CategoryTile tile={tile} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ tile, large = false }: { tile: Tile; large?: boolean }) {
  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden hover-grow ${
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[16/10]"
      }`}
    >
      <Image
        src={tile.image}
        alt={tile.alt}
        fill
        sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
        className="object-cover"
      />
      {/* Gradient for label legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10 text-[var(--color-ivory-100)] flex items-end justify-between gap-6">
        <div>
          <span className="text-eyebrow text-[var(--color-ivory-100)]/75">{tile.category}</span>
          <h3
            className={`text-display mt-2 leading-tight transition-colors group-hover:text-[var(--color-burgundy-300)] ${
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
