"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { TieIllustration } from "./TieIllustration";
import { PlaceholderBadge, isPlaceholder } from "./PlaceholderBadge";
import type { LibraryItem } from "@/lib/libraries";

/**
 * Library product grid with brand + colour filters across the top.
 * Filter values come from the items themselves (whatever the ERP
 * happens to have stocked today) so we don't hardcode "Navy / Grey /
 * Brown" — the chips reflect actual available stock.
 *
 * Multi-select within an axis (OR), AND across axes — picking "Delfino"
 * and "Brown" shows Delfino pieces in brown.
 */
export function LibraryFilteredGrid({
  items, slug,
}: {
  items: LibraryItem[];
  slug: string;
}) {
  const brands = useMemo(() => uniq(items.map((i) => i.brand)), [items]);
  const colors = useMemo(() => uniq(items.map((i) => i.color)), [items]);

  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set());

  const visible = items.filter((it) => {
    if (activeBrands.size > 0 && (!it.brand || !activeBrands.has(it.brand))) return false;
    if (activeColors.size > 0 && (!it.color || !activeColors.has(it.color))) return false;
    return true;
  });

  function toggle(set: Set<string>, val: string): Set<string> {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  }

  const showFilters = brands.length > 1 || colors.length > 1;

  return (
    <>
      {showFilters && (
        <div className="mb-8 md:mb-10 space-y-4">
          {brands.length > 1 && (
            <FilterRow
              label="Brand"
              all={brands}
              active={activeBrands}
              onToggle={(v) => setActiveBrands((s) => toggle(s, v))}
              onClear={() => setActiveBrands(new Set())}
            />
          )}
          {colors.length > 1 && (
            <FilterRow
              label="Colour"
              all={colors}
              active={activeColors}
              onToggle={(v) => setActiveColors((s) => toggle(s, v))}
              onClear={() => setActiveColors(new Set())}
            />
          )}
          {(activeBrands.size > 0 || activeColors.size > 0) && (
            <p className="text-[0.78rem] text-[var(--color-charcoal-500)] tabular-nums">
              {visible.length} of {items.length} pieces match
            </p>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-[0.95rem] text-[var(--color-charcoal-700)] py-10">
          No pieces match the selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-5 gap-y-8 md:gap-y-10">
          {visible.map((item, i) => (
            <Reveal key={item.sku} delay={(i % 5) * 0.04}>
              <ProductCard item={item} slug={slug} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

function FilterRow({
  label, all, active, onToggle, onClear,
}: {
  label: string;
  all: string[];
  active: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-eyebrow text-[var(--color-charcoal-500)] shrink-0 mr-1">
        {label}
      </span>
      <button
        type="button"
        onClick={onClear}
        className={`text-eyebrow shrink-0 px-3 py-1.5 border transition-colors ${
          active.size === 0
            ? "border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]"
            : "border-black/15 text-[var(--color-charcoal-700)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
        }`}
      >
        All
      </button>
      {all.map((v) => {
        const on = active.has(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className={`text-eyebrow shrink-0 px-3 py-1.5 border transition-colors ${
              on
                ? "border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]"
                : "border-black/15 text-[var(--color-charcoal-700)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

/** Same card the server component used to render — moved here so the
 *  client-side filtered grid keeps the visual rhythm. */
function ProductCard({ item, slug }: { item: LibraryItem; slug: string }) {
  // ERP product photos are studio shots on a white background. Keep
  // object-cover so the garment fills the tile (object-contain made
  // them look tiny with a halo of empty space), and apply
  // mix-blend-mode: multiply against the ivory tile so any white
  // pixels that survive the crop blend into the page colour.
  //
  // Transparent /products/ PNGs still use object-contain + padding —
  // they were designed to sit inside a display case.
  const isProductPhoto =
    item.media.kind === "photo" && item.media.src.startsWith("/products/");
  const isErpPhoto =
    item.media.kind === "photo" && item.media.src.includes("erp.hiltontailoringhouse.com");
  const imgClass = isProductPhoto ? "object-contain p-5 md:p-6" : "object-cover";
  const tileBg = isErpPhoto || isProductPhoto
    ? "bg-[var(--color-ivory-100)]"
    : "bg-[var(--color-ivory-200)]";

  return (
    <Link href={`/library/${slug}/${item.sku}`} className="group block">
      <div className={`relative aspect-[4/5] overflow-hidden hover-grow ${tileBg}`}>
        {item.media.kind === "photo" && isPlaceholder(item.media.src) && <PlaceholderBadge />}
        {item.media.kind === "photo" ? (
          <Image
            src={item.media.src}
            alt={item.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className={imgClass}
            style={isErpPhoto ? { mixBlendMode: "multiply" } : undefined}
            unoptimized={isErpPhoto}
          />
        ) : (
          <TieIllustration
            color={item.media.color}
            accent={item.media.accent}
            bg={item.media.bg}
            pattern={item.media.pattern}
            className="w-full h-full"
          />
        )}
        {item.sale && (
          <span className="absolute top-3 left-3 text-eyebrow bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-2.5 py-1.5 text-[0.6rem]">
            Sale · {item.sale}
          </span>
        )}
        <span className="absolute bottom-3 right-3 text-eyebrow text-[var(--color-charcoal-500)] bg-[var(--color-ivory-100)]/90 px-2 py-1 text-[0.6rem] tracking-[0.2em]">
          {item.sku}
        </span>
      </div>

      <div className="mt-3">
        <span className="text-eyebrow text-[var(--color-charcoal-500)]">{item.type}</span>
        <h3 className="text-display text-[1.05rem] mt-1 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
          {item.name}
        </h3>
        {item.cloth && (
          <p className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">{item.cloth}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[0.875rem] text-[var(--color-charcoal-900)]">
            {item.price && !/^From\b/i.test(item.price) ? item.price : ""}
          </span>
          <ArrowUpRight
            size={14}
            strokeWidth={1.5}
            className="text-[var(--color-charcoal-500)] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}

function uniq(values: (string | undefined)[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => Boolean(v && v.trim()))),
  ).sort();
}
