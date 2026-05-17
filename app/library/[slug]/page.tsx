import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { CtaBanner } from "@/components/CtaBanner";
import { libraries, librarySlugs } from "@/lib/libraries";

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

      {/* ─────────────── SECTIONS ─────────────── */}
      {lib.sections.map((section, sIdx) => (
        <section key={section.title} className={`py-24 md:py-32 ${sIdx > 0 ? "border-t border-black/10" : ""}`}>
          <div className="container-editorial">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-14">
              {section.items.map((item, i) => (
                <Reveal
                  key={item.name}
                  delay={(i % 2) * 0.08}
                  className={item.scale === 2 ? "md:col-span-2 lg:col-span-4" : "lg:col-span-2"}
                >
                  <Link href="#" className="group block">
                    <div
                      className={`relative ${
                        item.scale === 2 ? "aspect-[5/4]" : "aspect-[4/5]"
                      } overflow-hidden bg-[var(--color-ivory-200)] hover-grow`}
                    >
                      <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        sizes={
                          item.scale === 2
                            ? "(min-width: 1024px) 67vw, 100vw"
                            : "(min-width: 1024px) 33vw, 50vw"
                        }
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-6 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-eyebrow text-[var(--color-charcoal-500)]">
                          {item.type}
                        </span>
                        <h3 className="text-display text-[1.85rem] mt-2 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                          {item.name}
                        </h3>
                        {item.cloth && (
                          <p className="text-[0.875rem] text-[var(--color-charcoal-500)] mt-1">
                            {item.cloth}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[0.875rem] text-[var(--color-charcoal-700)] block">
                          {item.price}
                        </span>
                        <ArrowUpRight
                          size={16}
                          strokeWidth={1.5}
                          className="inline-block mt-2 text-[var(--color-charcoal-500)] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

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
