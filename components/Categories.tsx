"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";
import { fetchGarments, type Garment } from "@/lib/garments";
import { fetchAllMediaSlots } from "@/lib/media";

type Tile = {
  slot: string;
  category: string;
  title: string;
  href: string;
  /** The mtm_garments slug this tile maps to. The tile only shows when
   *  that garment is Live — same gate the Design Yours picker uses, so
   *  the homepage and the customizer never contradict each other. */
  garment: string;
  /** "cover" for full-bleed editorial images, "contain" for transparent product photos */
  fit?: "cover" | "contain";
};

const slotMap = Object.fromEntries(MEDIA_SLOTS.map((s) => [s.key, s]));

// Per client direction: the homepage Categories tile + the matching
// library hero + the Design Yours picker tile all read from the SAME
// library.<slug>.cover slot, so the atelier uploads one image and it
// shows up in all three places.
const featured: Tile = {
  slot: "library.suits.cover",
  category: "Tailoring",
  title: "Suits",
  href: "/library/suits",
  garment: "suit",
  fit: "cover",
};

const rightTop: Tile[] = [
  { slot: "library.jackets.cover", category: "Standalone", title: "Jackets", href: "/library/jackets", garment: "jacket", fit: "cover" },
  { slot: "library.shirts.cover", category: "Shirting", title: "Shirts", href: "/library/shirts", garment: "shirt", fit: "cover" },
];

// Shoes and ties moved to the dedicated <Accessories> section (any Live
// garment with zero customizer steps renders there, straight to
// add-to-cart). This grid is now the customizable wardrobe only.
const bottom: Tile[] = [
  { slot: "library.trousers.cover", category: "Tailored", title: "Trousers", href: "/library/trousers", garment: "trouser", fit: "cover" },
];

export function Categories() {
  // Live garment slugs + their ERP categories, and any admin-uploaded
  // cover overrides. We resolve everything client-side (same as the
  // Design Yours picker) so hiding a garment in /admin/garments removes
  // its homepage tile on the next load, with no rebuild.
  const [activeSlugs, setActiveSlugs] = useState<Set<string> | null>(null);
  const [erpByGarment, setErpByGarment] = useState<Record<string, string[]>>({});
  const [liveErp, setLiveErp] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, { url: string; alt: string }>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchGarments({ activeOnly: true }),
      fetchAllMediaSlots().catch(() => ({})),
      fetch("/api/erp-categories").then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
    ])
      .then(([g, m, erp]) => {
        if (cancelled) return;
        const garments = g as Garment[];
        setActiveSlugs(new Set(garments.map((x) => x.slug)));
        const ec: Record<string, string[]> = {};
        for (const x of garments) ec[x.slug] = x.erp_categories ?? [];
        setErpByGarment(ec);
        const map: Record<string, { url: string; alt: string }> = {};
        for (const [slot, row] of Object.entries(m as Record<string, { url?: string; alt?: string }>)) {
          if (row?.url) map[slot] = { url: row.url, alt: row.alt ?? "" };
        }
        setOverrides(map);
        const cats: string[] = (erp as { categories?: string[] }).categories ?? [];
        setLiveErp(new Set(cats.map((c) => c.toUpperCase())));
      })
      .catch(() => { if (!cancelled) setActiveSlugs(new Set()); });
    return () => { cancelled = true; };
  }, []);

  // Same notation as Design Yours: a tile shows only when its garment is
  // Live AND (has no ERP categories, or at least one is in the live feed).
  const isVisible = (t: Tile): boolean => {
    if (!activeSlugs || !activeSlugs.has(t.garment)) return false;
    const cats = erpByGarment[t.garment] ?? [];
    if (cats.length === 0) return true;
    return cats.some((c) => liveErp.has(c.toUpperCase()));
  };

  const featuredOn = isVisible(featured);
  const rightTopOn = rightTop.filter(isVisible);
  const bottomOn = bottom.filter(isVisible);

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

        {/* Until garments load we hold the space (min-height) rather than
            flash a tile that might be Hidden — the exact thing the atelier
            doesn't want to see contradicted. */}
        {activeSlugs === null ? (
          <div className="min-h-[40vh]" />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {featuredOn && (
                <Reveal className="lg:row-span-2">
                  <CategoryTile tile={featured} resolve={resolveImage} large />
                </Reveal>
              )}
              {rightTopOn.map((tile, i) => (
                <Reveal key={tile.title} delay={0.1 + i * 0.08}>
                  <CategoryTile tile={tile} resolve={resolveImage} />
                </Reveal>
              ))}
            </div>

            {bottomOn.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-6 lg:mt-8">
                {bottomOn.map((tile, i) => (
                  <Reveal key={tile.title} delay={i * 0.08}>
                    <CategoryTile tile={tile} resolve={resolveImage} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );

  function resolveImage(tile: Tile): { image: string; alt: string } {
    const ov = overrides[tile.slot];
    const slotDef = slotMap[tile.slot];
    return {
      image: ov?.url || slotDef?.fallback || "/products/no-image.svg",
      alt: ov?.alt || slotDef?.fallbackAlt || tile.title,
    };
  }
}

function CategoryTile({
  tile, resolve, large = false,
}: {
  tile: Tile;
  resolve: (t: Tile) => { image: string; alt: string };
  large?: boolean;
}) {
  const fit = tile.fit ?? "cover";
  const tileBg = fit === "contain" ? "bg-[var(--color-ivory-200)]" : "";
  const imgClass = fit === "contain" ? "object-contain p-10 md:p-14" : "object-cover";
  const labelTone = fit === "contain"
    ? "text-[var(--color-charcoal-900)]"
    : "text-[var(--color-ivory-100)]";
  const labelHover = fit === "contain"
    ? "group-hover:text-[var(--color-burgundy-700)]"
    : "group-hover:text-[var(--color-burgundy-300)]";

  const { image, alt } = resolve(tile);

  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden hover-grow ${tileBg} ${
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[16/10]"
      }`}
    >
      <Image
        src={image}
        alt={alt}
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
