"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { fetchGarments, fetchGarmentStepCounts, isAccessoryGarment, libraryCoverSlotForGarment, librarySlugForGarment, type Garment } from "@/lib/garments";
import { fetchAllMediaSlots } from "@/lib/media";
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
  /** Null when the atelier hasn't uploaded a cover for this garment yet —
   *  the tile then renders an editorial placeholder instead of a generic
   *  cutting-bench fallback, so it's visually obvious to the admin that
   *  the cover is missing without misleading the customer. */
  image: string | null;
  alt: string;
  /** When set, the tile reads its photo from this /admin/media slot
   *  (e.g. library.shirts.cover) so the picker stays in sync with the
   *  matching library hero. The `image` field acts as the fallback. */
  slot?: string;
  /** "cover" for editorial photographs, "contain" for transparent pngs */
  fit?: "cover" | "contain";
};

/** Per-slug hero imagery + alt text for the four built-in garments. A
 *  custom garment (chinos, overcoat, tuxedo) deliberately has NO entry
 *  here — when its cover hasn't been uploaded the tile renders an empty
 *  editorial placeholder rather than a misleading generic photo. */
const TILE_ASSETS: Record<string, { image: string; alt: string }> = {
  suit:    { image: "/atelier/showroom-double-breasted.jpg", alt: "A navy double-breasted suit on the form in the Manama atelier" },
  jacket:  { image: "/atelier/the-cut.jpg",                  alt: "A master cutter at work on a sport coat" },
  shirt:   { image: "/atelier/alumo-shirting.jpg",           alt: "Alumo shirting swatches" },
  trouser: { image: "/atelier/trofeo-book.jpg",              alt: "Trofeo trouser cloth book" },
};

// Built-in garments whose library lives at a plural slug
// (/library/suits, /library/jackets …). Anything else with ERP
// backing routes to /library/<own-slug> directly, which the dynamic
// library resolver picks up from the mtm_garments row.
const BUILTIN_LIBRARY_GARMENTS = new Set(["suit", "jacket", "shirt", "trouser"]);

function tileFor(g: Garment, featured: boolean): Tile {
  const assets = TILE_ASSETS[g.slug];
  const slotKey = libraryCoverSlotForGarment(g.slug);
  const slotFallback = MEDIA_SLOTS.find((s) => s.key === slotKey)?.fallback;
  const image = g.tile_image || slotFallback || assets?.image || null;
  // Routing priority:
  //   1. Built-in garments → /library/<plural>
  //   2. Any other garment with at least one ERP categoryName attached
  //      → /library/<own-slug> (dynamic library resolver)
  //   3. No ERP backing → /customize?category=<slug>, which surfaces the
  //      "online customizer isn't open yet" empty state.
  const hasErp = (g.erp_categories ?? []).length > 0;
  const isBuiltin = BUILTIN_LIBRARY_GARMENTS.has(g.slug);
  const href = isBuiltin
    ? `/library/${librarySlugForGarment(g.slug)}`
    : hasErp
      ? `/library/${g.slug}`
      : `/customize?category=${g.slug}`;
  return {
    // One consistent eyebrow across every tile. Previously each garment
    // showed its own tile_eyebrow ("Two-piece commission", "Standalone",
    // "Shirting"…) while accessories fell back to "Made to measure", so the
    // grid read inconsistently. The atelier wants them unified.
    category: "Made to measure",
    title: `Design a ${g.label.toLowerCase()}`,
    href,
    image,
    alt: assets?.alt ?? g.label,
    slot: slotKey,
    fit: "cover",
  };
}

export function DesignYoursPicker() {
  const [garments, setGarments] = useState<Garment[] | null>(null);
  // Pre-resolved override URLs keyed by slot. We wait for these AND
  // garments before painting any tile — otherwise the registry
  // fallback would flash for a fraction of a second before the real
  // upload swapped in.
  const [overrides, setOverrides] = useState<Record<string, { url: string; alt: string }> | null>(null);
  // Live set of ERP categoryNames that currently have at least one
  // active item. Any garment whose erp_categories overlap with this
  // set gets a tile; the rest are hidden automatically. Built-in
  // garments without ERP backing (suit/jacket/shirt/trouser with
  // erp_categories array still populated) are also covered by this
  // check, so when SUITING disappears from the ERP the Suit tile
  // would hide too.
  const [liveErpCategories, setLiveErpCategories] = useState<Set<string> | null>(null);
  // Per-garment customizer step counts. A garment with zero steps is an
  // accessory (tie, shoes, cufflinks…) — it has nothing to design, so it's
  // dropped from this picker and shown in the home Accessories section instead.
  const [stepCounts, setStepCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchGarments({ activeOnly: true }),
      fetchAllMediaSlots().catch(() => ({})),
      fetch("/api/erp-categories").then((r) => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
      fetchGarmentStepCounts().catch(() => ({})),
    ])
      .then(([g, m, erp, counts]) => {
        if (cancelled) return;
        setGarments(g);
        setStepCounts(counts as Record<string, number>);
        const map: Record<string, { url: string; alt: string }> = {};
        for (const [slot, row] of Object.entries(m as Record<string, { url?: string; alt?: string }>)) {
          if (row?.url) map[slot] = { url: row.url, alt: row.alt ?? "" };
        }
        setOverrides(map);
        const cats: string[] = (erp as { categories?: string[] }).categories ?? [];
        setLiveErpCategories(new Set(cats.map((c) => c.toUpperCase())));
      })
      .catch(() => {
        if (cancelled) return;
        setGarments([]);
        setOverrides({});
        setLiveErpCategories(new Set());
        setStepCounts({});
      });
    return () => { cancelled = true; };
  }, []);

  // First load: render nothing until garments, overrides AND the live
  // ERP category set have arrived. Prevents the flash where a garment
  // tile paints, then disappears once we learn the ERP has nothing.
  if (!garments || !overrides || !liveErpCategories || !stepCounts) {
    return <section className="pt-32 md:pt-40 pb-20 md:pb-28 min-h-[50vh]" />;
  }

  // Filter out garments whose ERP categories aren't present in the live
  // ERP feed right now. A garment with no erp_categories at all stays
  // (those are manually-curated additions); a garment with erp_categories
  // but ZERO live items hides. Customers never see an empty shelf.
  const visibleGarments = garments.filter((g) => {
    // Accessories (zero customizer steps) belong in the home Accessories
    // section, not in Design Yours — there's nothing to design.
    if (isAccessoryGarment(g.slug, stepCounts)) return false;
    const cats = g.erp_categories ?? [];
    if (cats.length === 0) return true; // manually curated — keep
    return cats.some((c) => liveErpCategories.has(c.toUpperCase()));
  });

  const resolveTile = (g: Garment, featured: boolean): Tile => {
    const t = tileFor(g, featured);
    if (t.slot && overrides[t.slot]) {
      const ov = overrides[t.slot];
      return { ...t, image: ov.url, alt: ov.alt || t.alt };
    }
    return t;
  };

  // First active garment becomes the featured large tile; next two go in
  // the right column; everything else stacks below alongside the Sebastian
  // helper card.
  const featured = visibleGarments[0] ? resolveTile(visibleGarments[0], true) : null;
  const rightTop = visibleGarments.slice(1, 3).map((g) => resolveTile(g, false));
  const bottom = visibleGarments.slice(3).map((g) => resolveTile(g, false));

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
                same considered sequence: cloth first, then style, then
                measure, tuned to what you're making.
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
      {/* tile.image was already resolved against the override map in
          the parent before render — so this <Image> never paints the
          registry fallback first and then swaps. No flash.
          When the atelier hasn't uploaded a cover yet we render an
          editorial dark placeholder instead of any generic photo, so
          the missing image is obvious to the admin without misleading
          the customer about what they're commissioning. */}
      {tile.image ? (
        <Image
          src={tile.image}
          alt={tile.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={imgClass}
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--color-charcoal-900)]" aria-hidden />
      )}
      {fit === "cover" && tile.image && (
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
