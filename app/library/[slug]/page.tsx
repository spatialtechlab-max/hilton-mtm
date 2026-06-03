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
import { fetchErpItems, sectionsFromErp, isErpBacked, ERP_CATEGORIES_FOR_SLUG } from "@/lib/erp";
import { MediaImage } from "@/components/MediaImage";
import { LibraryFilteredGrid } from "@/components/LibraryFilteredGrid";

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

  // ERP-backed libraries build their sections at request time from the
  // live ERP feed (ISR-cached for ~5 min). If the ERP returns nothing
  // for the slug we render an honest empty-state ("No ERP details
  // found") rather than fall back to placeholder editorial — the
  // atelier needs to upload items into the right ERP category for
  // them to appear, and silently substituting fake data has been a
  // recurring source of confusion. Non-ERP-backed slugs (the curated
  // lookbook pages) keep their static sections.
  const erpBacked = isErpBacked(slug);
  const sections = erpBacked
    ? sectionsFromErp(slug, await fetchErpItems())
    : baseLib.sections;
  const lib = { ...baseLib, sections };
  const noErpData = erpBacked && sections.length === 0;

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
                  <MediaImage
                    slot={`library.${slug}.cover`}
                    fallback={lib.heroImage}
                    fallbackAlt={lib.heroAlt}
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

      {/* Stats rail retired — they were curated copy, not ERP data. */}

      {/* Brand sub-section anchors retired — the grid below renders
          every piece side-by-side regardless of brand, so the
          per-brand jump targets had no DOM to anchor into. The brand
          stays printed on each card. */}

      {/* ─────────────── EMPTY STATE ─────────────── */}
      {noErpData && (
        <section className="py-24 md:py-32 border-t border-black/10">
          <div className="container-editorial max-w-2xl">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                No ERP details found
              </span>
              <h2 className="text-display text-[clamp(1.75rem,3vw,2.5rem)] mt-3 leading-tight">
                This library is awaiting items from the atelier.
              </h2>
              <p className="mt-5 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                Nothing has been catalogued under {ERP_CATEGORIES_FOR_SLUG[slug as keyof typeof ERP_CATEGORIES_FOR_SLUG]?.join(" · ") ?? slug.toUpperCase()} in the ERP yet.
                As soon as the atelier uploads items under one of those categories — with a
                cropped swatch and at least one on-form garment photo — they&rsquo;ll appear
                here automatically.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────── ALL ITEMS ─────────────── */}
      {/* Flat, side-by-side grid. Brand-by-brand headings turned the
          page into a stack of one-item rows once the catalogue thinned
          out (Raymond / Nobility / VBC each on their own line), so we
          collapse every section into a single dense grid and keep the
          brand on the card itself. The brand sub-section tabs at the
          top still anchor-jump because each card gets the brand id. */}
      {!noErpData && (
        <section className="py-14 md:py-20" id="all">
          <div className="container-editorial">
            <LibraryFilteredGrid
              items={lib.sections.flatMap((s) => s.items)}
              slug={slug}
            />
          </div>
        </section>
      )}

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
      {/* 4:5 aspect (was 3:4) — smaller card so the grid lays out five
          across on desktop without dwarfing the rest of the page. */}
      <div className={`relative aspect-[4/5] overflow-hidden hover-grow ${tileBg}`}>
        {item.media.kind === "photo" && isPlaceholder(item.media.src) && <PlaceholderBadge />}
        {item.media.kind === "photo" ? (
          <Image
            src={item.media.src}
            alt={item.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
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

      <div className="mt-3">
        <span className="text-eyebrow text-[var(--color-charcoal-500)]">{item.type}</span>
        <h3 className="text-display text-[1.05rem] mt-1 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
          {item.name}
        </h3>
        {item.cloth && (
          <p className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">{item.cloth}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {/* Only real ERP prices render — static editorial items have
              price="" so the line collapses rather than displaying made-up
              numbers. */}
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
