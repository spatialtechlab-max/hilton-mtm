"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { MediaImageClient } from "./MediaImageClient";
import { fetchGarments, type Garment } from "@/lib/garments";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

/**
 * Landing tiles for /customize when the visitor hasn't picked a garment
 * yet. Reads the atelier-managed garment list from `mtm_garments`
 * (admin can rotate seasonally via /admin/garments), so a garment
 * toggled Hidden disappears from this picker the next time it renders.
 *
 * Each tile routes into the customizer with the correct ?category= slug
 * so the existing flow (fabric → tier/spec → measure → review) handles
 * the rest.
 */

type Tile = {
  category: string;
  title: string;
  href: string;
  image: string;
  alt: string;
  /** When set, the tile reads its photo from this /admin/media slot
   *  (e.g. library.shirts.cover) so the picker stays in sync with the
   *  matching library hero. The `image` field acts as the fallback. */
  slot?: string;
  /** "cover" for editorial photographs, "contain" for transparent pngs */
  fit?: "cover" | "contain";
};

/** Per-slug hero imagery + alt text. Keyed so adding a Garment row in
 *  /admin/garments with a known slug picks up the curated photo; an
 *  unknown slug (e.g. "chinos") falls through to GENERIC_TILE. */
const TILE_ASSETS: Record<string, { image: string; alt: string }> = {
  suit:    { image: "/atelier/showroom-double-breasted.jpg", alt: "A navy double-breasted suit on the form in the Manama atelier" },
  jacket:  { image: "/atelier/the-cut.jpg",                  alt: "A master cutter at work on a sport coat" },
  shirt:   { image: "/atelier/alumo-shirting.jpg",           alt: "Alumo shirting swatches" },
  trouser: { image: "/atelier/trofeo-book.jpg",              alt: "Trofeo trouser cloth book" },
};

const GENERIC_TILE = {
  image: "/atelier/the-cut.jpg",
  alt: "The Hilton atelier at work",
};

// Map each garment slug to the matching library slug so Design Yours
// routes into the same browse → PDP → Customise flow that the
// Made to Measure nav uses. Anything not in the map falls back to
// /library/<garment-slug> if the slug already exists, or the
// customizer landing.
const LIBRARY_FOR_GARMENT: Record<string, string> = {
  suit: "suits",
  jacket: "jackets",
  shirt: "shirts",
  trouser: "trousers",
};

function tileFor(g: Garment, featured: boolean): Tile {
  const assets = TILE_ASSETS[g.slug] ?? GENERIC_TILE;
  const librarySlug = LIBRARY_FOR_GARMENT[g.slug] ?? g.slug;
  // The garments that map onto a real library page read their tile
  // photo from that library's cover slot — so editing the cover in
  // /admin/media updates BOTH the library hero and the Design Yours
  // tile in one place. When no admin override exists yet, the tile
  // must fall back to the SAME image the library page uses, not the
  // legacy /atelier/* swatch — otherwise the picker and the library
  // hero render two different photos for the same garment.
  const hasLibrary = g.slug in LIBRARY_FOR_GARMENT;
  const slotKey = hasLibrary ? `library.${librarySlug}.cover` : "";
  const slotFallback = slotKey
    ? MEDIA_SLOTS.find((s) => s.key === slotKey)?.fallback
    : undefined;
  return {
    category: g.tile_eyebrow || (featured ? "Bespoke commission" : "Made to measure"),
    title: `Design a ${g.label.toLowerCase()}`,
    href: `/library/${librarySlug}`,
    // Priority: per-garment override from /admin/garments → the
    // registry fallback for the matching library cover → the legacy
    // hardcoded asset (last resort, only hits for chinos / overcoat
    // when no per-garment image is set).
    image: g.tile_image || slotFallback || assets.image,
    alt: assets.alt,
    slot: hasLibrary ? slotKey : undefined,
    fit: "cover",
  };
}

export function DesignYoursPicker() {
  const [garments, setGarments] = useState<Garment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGarments({ activeOnly: true })
      .then((g) => { if (!cancelled) setGarments(g); })
      .catch(() => { if (!cancelled) setGarments([]); });
    return () => { cancelled = true; };
  }, []);

  // First load: render nothing until garments arrive — keeps SSR + client
  // markup stable and avoids a flash of stale hardcoded tiles.
  if (!garments) {
    return <section className="pt-32 md:pt-40 pb-20 md:pb-28 min-h-[50vh]" />;
  }

  // First active garment becomes the featured large tile; next two go in
  // the right column; everything else stacks below alongside the Sebastian
  // helper card.
  const featured = garments[0] ? tileFor(garments[0], true) : null;
  const rightTop = garments.slice(1, 3).map((g) => tileFor(g, false));
  const bottom = garments.slice(3).map((g) => tileFor(g, false));

  return (
    <section className="pt-32 md:pt-40 pb-20 md:pb-28">
      <div className="container-editorial">
        {/* Header — mirrors the eyebrow + headline rhythm of the rest of
            the customizer so the visitor knows they're in the right place. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12 md:mb-16">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Design Yours</span>
            </Reveal>
            <h1 className="text-display text-[clamp(2.75rem,6vw,5rem)] mt-5 leading-[0.98]">
              <SplitReveal text="What would you like to make?" />
            </h1>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.2}>
              <p className="mt-4 text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-prose">
                Pick the garment you'd like to commission. Each flow is the
                same considered sequence — cloth first, then style, then
                measure — tuned to what you're making.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Tiles — same masonry as the home page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {featured && (
            <Reveal className="lg:row-span-2">
              <CustomizeTile tile={featured} large />
            </Reveal>
          )}
          {rightTop.map((tile, i) => (
            <Reveal key={tile.href} delay={0.1 + i * 0.08}>
              <CustomizeTile tile={tile} />
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8">
          {bottom.map((tile, i) => (
            <Reveal key={tile.href} delay={i * 0.08}>
              <CustomizeTile tile={tile} />
            </Reveal>
          ))}
          {/* Quiet helper card on the right — sets expectation about pricing
              + leads visitors to Sebastian if they're undecided. */}
          <Reveal delay={0.08}>
            <div className="relative h-full min-h-[280px] flex flex-col justify-between p-8 lg:p-10 bg-[var(--color-ivory-200)]">
              <div>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                  Undecided?
                </span>
                <h3 className="text-display text-[clamp(1.5rem,2.4vw,2.25rem)] mt-3 leading-tight">
                  Let Sebastian point you to the right commission.
                </h3>
                <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  The concierge can recommend a tier and a cloth based on
                  the occasion you have in mind.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const bar = document.querySelector(
                      'button[aria-label="Open Sebastian, the concierge"]',
                    ) as HTMLButtonElement | null;
                    bar?.click();
                  }}
                  className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-6 py-3 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
                >
                  Ask Sebastian <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CustomizeTile({ tile, large = false }: { tile: Tile; large?: boolean }) {
  const fit = tile.fit ?? "cover";
  const tileBg = fit === "contain" ? "bg-[var(--color-ivory-200)]" : "";
  const imgClass = fit === "contain" ? "object-contain p-10 md:p-14" : "object-cover";
  const labelTone =
    fit === "contain"
      ? "text-[var(--color-charcoal-900)]"
      : "text-[var(--color-ivory-100)]";
  const labelHover =
    fit === "contain"
      ? "group-hover:text-[var(--color-burgundy-700)]"
      : "group-hover:text-[var(--color-burgundy-300)]";

  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden hover-grow ${tileBg} ${
        large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[16/10]"
      }`}
    >
      {tile.slot ? (
        <MediaImageClient
          slot={tile.slot}
          fallback={tile.image}
          fallbackAlt={tile.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={imgClass}
        />
      ) : (
        // Garments without a matching library page (e.g. chinos, overcoat)
        // still render the per-garment tile_image / hardcoded fallback.
        <MediaImageClient
          slot=""
          fallback={tile.image}
          fallbackAlt={tile.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={imgClass}
        />
      )}
      {fit === "cover" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      )}
      <div
        className={`absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10 ${labelTone} flex items-end justify-between gap-6`}
      >
        <div>
          <span
            className={`text-eyebrow ${
              fit === "contain"
                ? "text-[var(--color-charcoal-500)]"
                : "text-[var(--color-ivory-100)]/75"
            }`}
          >
            {tile.category}
          </span>
          <h3
            className={`text-display mt-2 leading-tight transition-colors ${labelHover} ${
              large
                ? "text-[clamp(2rem,4vw,3.5rem)]"
                : "text-[clamp(1.75rem,2.4vw,2.5rem)]"
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
