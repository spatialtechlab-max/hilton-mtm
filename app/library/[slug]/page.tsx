import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";
import { TieIllustration } from "@/components/TieIllustration";
import { PlaceholderBadge, isPlaceholder } from "@/components/PlaceholderBadge";
import { libraries, librarySlugs, type LibraryItem } from "@/lib/libraries";
import { fetchErpItems, sectionsFromErp, isErpBacked } from "@/lib/erp";

export function generateStaticParams() {
  return librarySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lib = libraries[slug];
  if (!lib) return {};
  return {
    title: lib.title.replace(/\.$/, ""),
    description: lib.intro,
  };
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseLib = libraries[slug];
  if (!baseLib) notFound();

  // ERP-backed libraries (ties / belts / cloths) build their sections at
  // request time from the live ERP feed (ISR-cached for ~5 min).
  const sections = isErpBacked(slug)
    ? sectionsFromErp(slug, await fetchErpItems())
    : baseLib.sections;
  const lib = { ...baseLib, sections };

  const totalItems = lib.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <section className="pt-28 md:pt-32 pb-10 md:pb-14">
        <div className="container-editorial">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-6"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              The House
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Reveal>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">{lib.eyebrow}</span>
              </Reveal>
              <h1 className="text-display text-[clamp(2.75rem,6vw,5rem)] mt-4 leading-[0.98]">
                <SplitReveal text={lib.title} />
              </h1>
              <Reveal delay={0.2}>
                <p className="mt-6 max-w-md text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  {lib.intro}
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-6 flex items-center gap-3 text-eyebrow text-[var(--color-charcoal-500)]">
                  <span>{totalItems} pieces in this library</span>
                  <span aria-hidden>·</span>
                  <span>Made to measure</span>
                </div>
              </Reveal>
            </div>
            <div>
              <Reveal delay={0.3}>
                <div
                  className={`relative aspect-[3/4] overflow-hidden hover-grow ${
                    lib.heroImage.startsWith("/products/") ? "bg-[var(--color-ivory-200)]" : "grain"
                  }`}
                >
                  {isPlaceholder(lib.heroImage) && <PlaceholderBadge />}
                  <Image
                    src={lib.heroImage}
                    alt={lib.heroAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className={
                      lib.heroImage.startsWith("/products/")
                        ? "object-contain p-8 md:p-12"
                        : "object-cover"
                    }
                    priority
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── STATS RAIL ─────────────── */}
      <section className="border-y border-black/10 py-5">
        <div className="container-editorial grid grid-cols-3 gap-6 items-baseline">
          {lib.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="flex flex-col">
                <span className="text-eyebrow text-[var(--color-charcoal-500)]">{s.label}</span>
                <span className="text-display text-[clamp(1.25rem,2.4vw,1.75rem)] mt-1 leading-none text-[var(--color-burgundy-700)]">
                  {s.value}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── SUB-SECTION TABS ─────────────── */}
      <section className="border-b border-black/10">
        <div className="container-editorial flex items-center gap-1 overflow-x-auto py-3 no-scrollbar">
          <a
            href="#all"
            className="text-eyebrow shrink-0 px-3 py-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]"
          >
            All
          </a>
          {lib.sections.map((section) => (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              className="text-eyebrow shrink-0 px-3 py-2 border border-transparent text-[var(--color-charcoal-700)] hover:text-[var(--color-burgundy-700)] hover:border-black/15 transition-colors"
            >
              {section.title} <span className="opacity-50 ml-2">{section.items.length}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ─────────────── SECTIONS ─────────────── */}
      <div id="all">
        {lib.sections.map((section, sIdx) => (
          <section
            key={section.slug}
            id={section.slug}
            className={`py-14 md:py-20 ${sIdx > 0 ? "border-t border-black/10" : ""}`}
          >
            <div className="container-editorial">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div className="max-w-xl">
                  <Reveal>
                    <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                      N° {String(sIdx + 1).padStart(2, "0")}
                    </span>
                  </Reveal>
                  <h2 className="text-display text-[clamp(2rem,3.5vw,3rem)] mt-3 leading-[1.05]">
                    <SplitReveal text={section.title} />
                  </h2>
                </div>
                <Reveal delay={0.15}>
                  <p className="md:max-w-sm text-[0.875rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {section.note}
                  </p>
                </Reveal>
              </div>

              {/* Uniform 4-up grid on desktop, like Suitsupply / Indochino.
                  All cards same size — no scale=2 mixing — to keep the rhythm. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
                {section.items.map((item, i) => (
                  <Reveal
                    key={item.sku}
                    delay={(i % 4) * 0.05}
                  >
                    <ProductCard item={item} slug={slug} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─────────────── OTHER LIBRARIES ─────────────── */}
      <section className="py-16 md:py-24 border-t border-black/10">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Continue browsing</span>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {librarySlugs
              .filter((s) => s !== slug)
              .map((s) => {
                const other = libraries[s];
                return (
                  <Reveal key={s}>
                    <Link
                      href={`/library/${s}`}
                      className={`group relative block aspect-[5/4] overflow-hidden hover-grow ${
                        other.heroImage.startsWith("/products/") ? "bg-[var(--color-ivory-200)]" : ""
                      }`}
                    >
                      {isPlaceholder(other.heroImage) && <PlaceholderBadge />}
                      <Image
                        src={other.heroImage}
                        alt={other.heroAlt}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className={
                          other.heroImage.startsWith("/products/")
                            ? "object-contain p-10"
                            : "object-cover"
                        }
                      />
                      {/* Dark gradient only on photographic editorial tiles */}
                      {!other.heroImage.startsWith("/products/") && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      )}
                      <div className={`absolute inset-x-0 bottom-0 p-6 flex items-end justify-between gap-3 ${
                        other.heroImage.startsWith("/products/")
                          ? "text-[var(--color-charcoal-900)]"
                          : "text-[var(--color-ivory-100)]"
                      }`}>
                        <div>
                          <span className={`text-eyebrow ${
                            other.heroImage.startsWith("/products/")
                              ? "text-[var(--color-charcoal-500)]"
                              : "text-[var(--color-ivory-100)]/75"
                          }`}>
                            {other.eyebrow}
                          </span>
                          <h3 className="text-display text-[1.5rem] mt-1.5 leading-tight">
                            {other.title}
                          </h3>
                        </div>
                        <ArrowUpRight
                          size={20}
                          strokeWidth={1.4}
                          className="shrink-0 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}

/* ──────────────────────── PRODUCT CARD ──────────────────────── */

function ProductCard({ item, slug }: { item: LibraryItem; slug: string }) {
  // All cards uniform — the legacy `scale: 2` is ignored so the grid keeps
  // a steady rhythm (the way Suitsupply / Indochino lay out their grids).
  // Transparent product cutouts (shoes from hiltonmtm) sit in a display case
  // with padding; editorial Unsplash/ERP shots fill the frame edge-to-edge.
  const isProductPhoto =
    item.media.kind === "photo" && item.media.src.startsWith("/products/");
  const imgClass = isProductPhoto
    ? "object-contain p-5 md:p-6"
    : "object-cover";
  const tileBg = isProductPhoto
    ? "bg-[var(--color-ivory-200)]"
    : "bg-[var(--color-ivory-200)]";

  return (
    <Link href={`/library/${slug}/${item.sku}`} className="group block">
      <div className={`relative aspect-[3/4] overflow-hidden hover-grow ${tileBg}`}>
        {item.media.kind === "photo" && isPlaceholder(item.media.src) && <PlaceholderBadge />}
        {item.media.kind === "photo" ? (
          <Image
            src={item.media.src}
            alt={item.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={imgClass}
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

      <div className="mt-4">
        <span className="text-eyebrow text-[var(--color-charcoal-500)]">{item.type}</span>
        <h3 className="text-display text-[1.25rem] mt-1.5 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
          {item.name}
        </h3>
        {item.cloth && (
          <p className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">{item.cloth}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[0.875rem] text-[var(--color-charcoal-900)]">{item.price}</span>
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
