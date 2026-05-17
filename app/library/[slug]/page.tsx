import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";
import { TieIllustration } from "@/components/TieIllustration";
import { libraries, librarySlugs, type LibraryItem } from "@/lib/libraries";

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
  const lib = libraries[slug];
  if (!lib) notFound();

  const totalItems = lib.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <section className="pt-32 md:pt-40 pb-12">
        <div className="container-editorial">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-10"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              The House
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">{lib.eyebrow}</span>
              </Reveal>
              <h1 className="text-display text-[clamp(3rem,8vw,7.5rem)] mt-6 leading-[0.95]">
                <SplitReveal text={lib.title} />
              </h1>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-xl text-[1.1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  {lib.intro}
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-8 flex items-center gap-3 text-eyebrow text-[var(--color-charcoal-500)]">
                  <span>{totalItems} pieces in this library</span>
                  <span aria-hidden>·</span>
                  <span>Made to measure</span>
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={0.3}>
                <div className="relative aspect-[4/5] overflow-hidden hover-grow grain">
                  <Image
                    src={lib.heroImage}
                    alt={lib.heroAlt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── STATS RAIL ─────────────── */}
      <section className="border-y border-black/10 py-10">
        <div className="container-editorial grid grid-cols-3 gap-6 items-baseline">
          {lib.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="flex flex-col">
                <span className="text-eyebrow text-[var(--color-charcoal-500)]">{s.label}</span>
                <span className="text-display text-[clamp(2rem,4vw,3.25rem)] mt-2 leading-none text-[var(--color-burgundy-700)]">
                  {s.value}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── SUB-SECTION TABS ─────────────── */}
      <section className="border-b border-black/10">
        <div className="container-editorial flex items-center gap-1 overflow-x-auto py-6 no-scrollbar">
          <a
            href="#all"
            className="text-eyebrow shrink-0 px-5 py-3 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]"
          >
            All
          </a>
          {lib.sections.map((section) => (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              className="text-eyebrow shrink-0 px-5 py-3 border border-transparent text-[var(--color-charcoal-700)] hover:text-[var(--color-burgundy-700)] hover:border-black/15 transition-colors"
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
            className={`py-20 md:py-28 ${sIdx > 0 ? "border-t border-black/10" : ""}`}
          >
            <div className="container-editorial">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-xl">
                  <Reveal>
                    <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                      N° {String(sIdx + 1).padStart(2, "0")}
                    </span>
                  </Reveal>
                  <h2 className="text-display text-[clamp(2.25rem,4.5vw,4rem)] mt-4 leading-[1.02]">
                    <SplitReveal text={section.title} />
                  </h2>
                </div>
                <Reveal delay={0.15}>
                  <p className="md:max-w-sm text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {section.note}
                  </p>
                </Reveal>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-12">
                {section.items.map((item, i) => (
                  <Reveal
                    key={item.sku}
                    delay={(i % 3) * 0.06}
                    className={item.scale === 2 ? "col-span-2 lg:col-span-4" : "lg:col-span-2"}
                  >
                    <ProductCard item={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─────────────── OTHER LIBRARIES ─────────────── */}
      <section className="py-24 md:py-32 border-t border-black/10">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Continue browsing</span>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {librarySlugs
              .filter((s) => s !== slug)
              .map((s) => {
                const other = libraries[s];
                return (
                  <Reveal key={s}>
                    <Link
                      href={`/library/${s}`}
                      className="group relative block aspect-[16/9] overflow-hidden hover-grow"
                    >
                      <Image
                        src={other.heroImage}
                        alt={other.heroAlt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-8 text-[var(--color-ivory-100)] flex items-end justify-between">
                        <div>
                          <span className="text-eyebrow text-[var(--color-ivory-100)]/75">
                            {other.eyebrow}
                          </span>
                          <h3 className="text-display text-[2.25rem] mt-2 leading-tight">
                            {other.title}
                          </h3>
                        </div>
                        <ArrowUpRight
                          size={24}
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

function ProductCard({ item }: { item: LibraryItem }) {
  const aspect = item.scale === 2 ? "aspect-[5/4]" : "aspect-[4/5]";

  return (
    <Link href="#" className="group block">
      <div className={`relative ${aspect} overflow-hidden bg-[var(--color-ivory-200)] hover-grow`}>
        {item.media.kind === "photo" ? (
          <Image
            src={item.media.src}
            alt={item.alt}
            fill
            sizes={item.scale === 2 ? "(min-width: 1024px) 67vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
            className="object-cover"
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

        <span className="absolute top-3 right-3 text-eyebrow text-[var(--color-charcoal-500)] bg-[var(--color-ivory-100)]/90 px-2 py-1 text-[0.6rem] tracking-[0.2em]">
          {item.sku}
        </span>
      </div>

      <div className="mt-5">
        <span className="text-eyebrow text-[var(--color-charcoal-500)]">{item.type}</span>
        <h3 className="text-display text-[1.5rem] mt-2 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
          {item.name}
        </h3>
        {item.cloth && (
          <p className="text-[0.825rem] text-[var(--color-charcoal-500)] mt-1">{item.cloth}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[0.875rem] text-[var(--color-charcoal-700)]">{item.price}</span>
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
