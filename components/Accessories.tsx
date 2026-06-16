"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import {
  fetchGarments,
  fetchGarmentStepCounts,
  isAccessoryGarment,
  libraryCoverSlotForGarment,
  type Garment,
} from "@/lib/garments";
import { fetchAllMediaSlots } from "@/lib/media";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

/**
 * Home-page "Accessories" section. Renders every Live garment that has
 * ZERO customizer steps — ties, belts, shoes, cufflinks, anything the
 * atelier marks Live without assigning a single module. These aren't
 * designed, so they skip Design Yours entirely: each tile links to the
 * garment's library where the customer adds it straight to the cart.
 *
 * Fully data-driven: the moment the admin sets a garment Live with no
 * modules, it appears here; the moment they add a module, it leaves here
 * and joins the customizer. An accessory with no live ERP stock is hidden
 * so the section never shows an empty shelf.
 */

const slotMap = Object.fromEntries(MEDIA_SLOTS.map((s) => [s.key, s]));

type Tile = {
  slug: string;
  title: string;
  eyebrow: string;
  href: string;
  image: string;
  alt: string;
};

export function Accessories() {
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchGarments({ activeOnly: true }),
      fetchGarmentStepCounts().catch(() => ({})),
      fetchAllMediaSlots().catch(() => ({})),
      fetch("/api/erp-categories").then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
    ])
      .then(([g, counts, m, erp]) => {
        if (cancelled) return;
        const garments = g as Garment[];
        const stepCounts = counts as Record<string, number>;
        const overrides: Record<string, { url: string; alt: string }> = {};
        for (const [slot, row] of Object.entries(m as Record<string, { url?: string; alt?: string }>)) {
          if (row?.url) overrides[slot] = { url: row.url, alt: row.alt ?? "" };
        }
        const liveErp = new Set(
          ((erp as { categories?: string[] }).categories ?? []).map((c) => c.toUpperCase()),
        );

        const built: Tile[] = garments
          // Accessory = Live garment with no customizer steps.
          .filter((x) => isAccessoryGarment(x.slug, stepCounts))
          // Only show accessories that actually have live ERP stock, so the
          // section never paints an empty shelf. (No erp_categories at all =
          // a manually-curated row — keep it.)
          .filter((x) => {
            const cats = x.erp_categories ?? [];
            if (cats.length === 0) return true;
            return cats.some((c) => liveErp.has(c.toUpperCase()));
          })
          .map((x) => {
            const slotKey = libraryCoverSlotForGarment(x.slug);
            const ov = overrides[slotKey];
            const image = ov?.url || x.tile_image || slotMap[slotKey]?.fallback || "/products/no-image.svg";
            const alt = ov?.alt || slotMap[slotKey]?.fallbackAlt || x.label;
            return {
              slug: x.slug,
              title: x.label,
              eyebrow: x.tile_eyebrow || "Accessory",
              // The garment's own slug resolves on /library via its
              // erp_categories, where each piece has an Add-to-cart button.
              href: `/library/${x.slug}`,
              image,
              alt,
            };
          });

        setTiles(built);
      })
      .catch(() => { if (!cancelled) setTiles([]); });
    return () => { cancelled = true; };
  }, []);

  // Until we know, hold the space rather than flash an empty heading.
  if (tiles === null) return <section className="py-8" />;
  if (tiles.length === 0) return null;

  return (
    <section className="py-16 md:py-24 border-t border-black/10">
      <div className="container-editorial">
        <div className="max-w-2xl mb-12 md:mb-16">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">The Finishing Touches</span>
          </Reveal>
          <h2 className="text-display text-[clamp(2rem,4.5vw,4rem)] mt-6 leading-[0.98]">
            <SplitReveal text="Accessories." />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Ready to wear, ready to ship. Shoes, ties and the small details that finish a
              wardrobe — chosen, not commissioned. Add them straight to your cart.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tiles.map((tile, i) => (
            <Reveal key={tile.slug} delay={i * 0.06}>
              <AccessoryTile tile={tile} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccessoryTile({ tile }: { tile: Tile }) {
  return (
    <Link
      href={tile.href}
      className="group relative block aspect-[16/10] overflow-hidden hover-grow bg-[var(--color-ivory-200)]"
    >
      <Image
        src={tile.image}
        alt={tile.alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-contain p-10 md:p-12"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-[var(--color-charcoal-900)] flex items-end justify-between gap-6">
        <div>
          <span className="text-eyebrow text-[var(--color-charcoal-500)]">{tile.eyebrow}</span>
          <h3 className="text-display mt-2 leading-tight text-[clamp(1.375rem,2vw,2rem)] transition-colors group-hover:text-[var(--color-burgundy-700)]">
            {tile.title}
          </h3>
        </div>
        <ArrowUpRight
          size={22}
          strokeWidth={1.4}
          className="shrink-0 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
