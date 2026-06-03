import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/Button";
import { CtaBanner } from "@/components/CtaBanner";
import { Categories } from "@/components/Categories";
import { Partners } from "@/components/Partners";
import { AtelierStrip } from "@/components/AtelierStrip";
import { ShowroomFeature } from "@/components/ShowroomFeature";
import { PlaceholderBadge, isPlaceholder } from "@/components/PlaceholderBadge";
import { MediaImage } from "@/components/MediaImage";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

const HOME_HERO = MEDIA_SLOTS.find((s) => s.key === "home.hero")!;


export default function HomePage() {
  return (
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative h-[100svh] min-h-[680px] w-full overflow-hidden">
        <MediaImage
          slot={HOME_HERO.key}
          fallback={HOME_HERO.fallback}
          fallbackAlt={HOME_HERO.fallbackAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Cinematic overlay: darker top-left so the headline reads on it, light center for the image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-charcoal-900)]/80 via-[var(--color-charcoal-900)]/35 to-[var(--color-charcoal-900)]/85" />
        <div className="absolute inset-0 bg-[var(--color-charcoal-900)]/15" />

        <div className="absolute inset-0 flex flex-col">
          <div className="container-editorial flex-1 flex flex-col justify-end pb-16 md:pb-20 pt-28 text-[var(--color-ivory-100)]">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-ivory-100)]/80">
                Since 1970 · Manama, Bahrain
              </span>
            </Reveal>

            <h1 className="text-display mt-6 text-[clamp(3rem,8.5vw,8.5rem)] leading-[0.95] max-w-[14ch]">
              <SplitReveal text="Tailored," delay={0.05} />
              <br />
              <SplitReveal text="not merely fitted." delay={0.25} />
            </h1>

            <Reveal delay={0.45}>
              <p className="mt-10 max-w-md text-[1.1rem] text-[var(--color-ivory-200)]/90 leading-relaxed">
                Impeccably tailored suits and crisp shirting. Footwear and the finishing touches.
                At Hilton MTM, we don&rsquo;t just sell garments — we craft them around you.
              </p>
            </Reveal>

            <Reveal delay={0.6}>
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Button href="/book" variant="ivory">Book a Fitting</Button>
                <Button href="/collection" variant="ghost" showArrow>
                  <span className="text-[var(--color-ivory-100)]">View the Collection</span>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* hero footer */}
          <div className="container-editorial pb-8 flex justify-between items-end text-[var(--color-ivory-100)]/70">
            <span className="text-eyebrow">N° 01 · Spring/Summer Collection</span>
            <Link href="#introduction" className="text-eyebrow link-underline hidden md:inline-block">
              Scroll
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES — full house showcase */}
      <Categories />

      {/* ─────────────────────────── INTRODUCTION ─────────────────────────── */}
      <section id="introduction" className="py-16 md:py-24">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">An introduction</span>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05]">
              <SplitReveal
                text="Every piece in our collection is merely a starting point — the beginning of a conversation about your personal style."
                staggerWord={0.025}
              />
            </h2>
            <Reveal delay={0.4}>
              <div className="mt-12 flex items-center gap-6">
                <Link
                  href="/heritage"
                  className="text-eyebrow link-underline text-[var(--color-burgundy-700)]"
                >
                  Read our heritage
                </Link>
                <ArrowRight size={16} className="text-[var(--color-burgundy-700)]" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── HOUSE OF CLOTH (partner mills) ────────── */}
      <Partners />

      {/* "A wardrobe, considered." Collection grid retired per client
          direction — the homepage now flows Categories → Atelier
          strip directly without the curated 4-tile interlude. */}

      {/* ─────────────────────────── ATELIER PHOTO STRIP ─────────────────────── */}
      <AtelierStrip />

      {/* ─────────────────────────── MARQUEE ─────────────────────────── */}
      <section className="py-16 border-y border-black/10 bg-[var(--color-ivory-100)] text-[var(--color-burgundy-700)]">
        <Marquee
          items={["Made to Measure", "Hand Cut", "Natural Canvas", "Single Maker", "Three Hundred Hours"]}
          separator="✦"
        />
      </section>

      {/* ─────────────────────────── PROCESS TEASE ─────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">The Journey</span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.25rem,4.5vw,4rem)] mt-6 leading-[1.02]">
              <SplitReveal text="Five chapters, one wardrobe." />
            </h2>
            <Reveal delay={0.3}>
              <p className="mt-8 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                From your first consultation to delivery, the process is unhurried by design.
                We aim for garments that outlast the trends that surround them.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-10">
                <Button href="/process" variant="outline">Read the Process</Button>
              </div>
            </Reveal>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6 space-y-0 border-t border-black/10">
            {[
              {
                n: "01",
                t: "Consultation",
                d: "An hour at the atelier, in person or over a video call.",
              },
              {
                n: "02",
                t: "Measure",
                d: "Thirty-two measurements taken twice. The second to verify.",
              },
              {
                n: "03",
                t: "Cloth & Cut",
                d: "Selection from forty-seven curated mills and the cutter's notes.",
              },
              {
                n: "04",
                t: "Fittings",
                d: "Two basted fittings, then a final to confirm the line.",
              },
              {
                n: "05",
                t: "Delivery",
                d: "Hand-pressed, hung in canvas, delivered to your door.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07} as="li">
                <div className="grid grid-cols-12 gap-4 items-baseline py-8 border-b border-black/10 group">
                  <span className="col-span-2 text-display text-[1.5rem] text-[var(--color-burgundy-700)]">
                    {s.n}
                  </span>
                  <h3 className="col-span-4 text-display text-[2rem] text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                    {s.t}
                  </h3>
                  <p className="col-span-6 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {s.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────────── SHOWROOM FEATURE ─────────────────────── */}
      <ShowroomFeature />

      {/* ─────────────────────────── CTA ─────────────────────────── */}
      <CtaBanner />
    </>
  );
}
