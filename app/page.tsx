import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/Button";
import { CtaBanner } from "@/components/CtaBanner";
import { Categories } from "@/components/Categories";

const collection = [
  {
    name: "The Two-Piece",
    type: "Suit",
    price: "From $2,400",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop",
    href: "/collection#suits",
  },
  {
    name: "The Oxford",
    type: "Shoe",
    price: "From $1,150",
    image:
      "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1600&auto=format&fit=crop",
    href: "/collection#shoes",
  },
  {
    name: "Madison Silk Tie",
    type: "Accessory",
    price: "From $185",
    image:
      "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1600&auto=format&fit=crop",
    href: "/collection#ties",
  },
  {
    name: "The Evening Shirt",
    type: "Shirting",
    price: "From $290",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop",
    href: "/collection#shirts",
  },
];

const press = [
  "Esquire",
  "GQ",
  "Robb Report",
  "The Rake",
  "Monocle",
  "Financial Times",
];

const testimonials = [
  {
    quote:
      "I have worn bespoke for thirty years. The Hilton cut is the first in a generation that surprised me.",
    name: "Edward Marsh",
    role: "Investor, London",
  },
  {
    quote:
      "Precise, patient, and entirely unrushed. The fitting felt more like a conversation than a transaction.",
    name: "Daniela Costa",
    role: "Creative Director, Milan",
  },
  {
    quote:
      "A dinner jacket that has outlasted three of my watches. That is the only review that matters.",
    name: "Hiroshi Tanaka",
    role: "Architect, Tokyo",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative h-[100svh] min-h-[680px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop"
          alt="A master tailor at the cutting table, Hilton atelier"
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
                Est. 1962 · Made to Measure
              </span>
            </Reveal>

            <h1 className="text-display mt-6 text-[clamp(3rem,8.5vw,8.5rem)] leading-[0.95] max-w-[14ch]">
              <SplitReveal text="Tailored," delay={0.05} />
              <br />
              <SplitReveal text="not merely fitted." delay={0.25} />
            </h1>

            <Reveal delay={0.45}>
              <p className="mt-10 max-w-md text-[1.1rem] text-[var(--color-ivory-200)]/90 leading-relaxed">
                A full bespoke house on Madison Avenue. Suits, shirts, hand-welted shoes,
                silks and the accessories that finish a wardrobe. Made for one body, kept for life.
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

      {/* ─────────────────────────── PRESS MARQUEE ─────────────────────────── */}
      <section className="py-10 border-b border-black/5 bg-[var(--color-ivory-100)]">
        <div className="container-editorial flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <span className="text-eyebrow text-[var(--color-charcoal-500)] shrink-0">
            As featured in
          </span>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-[var(--color-charcoal-700)]">
            {press.map((p) => (
              <span key={p} className="text-display text-[1.5rem] tracking-wide opacity-70">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES — full house showcase */}
      <Categories />

      {/* ─────────────────────────── INTRODUCTION ─────────────────────────── */}
      <section id="introduction" className="py-32 md:py-48">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">An introduction</span>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05]">
              <SplitReveal
                text="A garment is finished when nothing else can be removed. We measure, we listen, we cut. What remains is yours."
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

      {/* FEATURE / EDITORIAL SPLIT */}
      <section className="relative bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] py-32 md:py-44 overflow-hidden">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-6 relative">
            <Reveal>
              <div className="relative aspect-[4/5] w-full overflow-hidden hover-grow">
                <Image
                  src="https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1600&auto=format&fit=crop"
                  alt="A bespoke jacket in progress at the Hilton atelier"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="hidden lg:block absolute -bottom-12 -right-12 w-[58%] aspect-[3/4] overflow-hidden border-8 border-[var(--color-charcoal-900)] hover-grow">
                <Image
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200&auto=format&fit=crop"
                  alt="Cloth swatches in a wooden tray"
                  fill
                  sizes="30vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-300)]">The Atelier</span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-6 leading-[1.02]">
              <SplitReveal text="Three hundred hours. One garment." />
            </h2>
            <Reveal delay={0.3}>
              <p className="mt-8 text-[1.05rem] text-[var(--color-ivory-200)]/85 leading-relaxed">
                Every Hilton suit begins as a paper pattern drawn for one body. It is cut by a
                single hand, basted, fitted, and re-fitted until the cloth answers to the shoulder.
                Nothing is fused. Nothing is rushed.
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <dl className="mt-12 grid grid-cols-2 gap-y-8 gap-x-6">
                {[
                  { k: "Hours per suit", v: "≈ 300" },
                  { k: "Fittings included", v: "3" },
                  { k: "Mills curated", v: "47" },
                  { k: "Lead time", v: "8 weeks" },
                ].map((s) => (
                  <div key={s.k} className="border-l border-[var(--color-ivory-300)]/25 pl-5">
                    <dt className="text-eyebrow text-[var(--color-ivory-300)]/70">{s.k}</dt>
                    <dd className="text-display text-[2rem] mt-2">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal delay={0.55}>
              <div className="mt-12">
                <Button href="/process" variant="ivory">The Process</Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── COLLECTION GRID ─────────────────────────── */}
      <section className="py-32 md:py-44">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <Reveal>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">The Collection</span>
              </Reveal>
              <h2 className="text-display text-[clamp(2.5rem,6vw,5.5rem)] mt-6 leading-[0.98]">
                <SplitReveal text="A wardrobe, considered." />
              </h2>
            </div>
            <Reveal delay={0.2}>
              <Link
                href="/collection"
                className="text-eyebrow link-underline text-[var(--color-charcoal-900)]"
              >
                Browse all garments →
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {collection.map((item, i) => (
              <Reveal key={item.name} delay={i * 0.08}>
                <Link href={item.href} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-ivory-200)] hover-grow">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-6 flex items-baseline justify-between">
                    <div>
                      <span className="text-eyebrow text-[var(--color-charcoal-500)]">
                        {item.type}
                      </span>
                      <h3 className="text-display text-[1.6rem] mt-2 text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-[0.85rem] text-[var(--color-charcoal-500)]">
                      {item.price}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── MARQUEE ─────────────────────────── */}
      <section className="py-16 border-y border-black/10 bg-[var(--color-ivory-100)] text-[var(--color-burgundy-700)]">
        <Marquee
          items={["Made to Measure", "Hand Cut", "Natural Canvas", "Single Maker", "Three Hundred Hours"]}
          separator="✦"
        />
      </section>

      {/* ─────────────────────────── PROCESS TEASE ─────────────────────────── */}
      <section className="py-32 md:py-44">
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

      {/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */}
      <section className="py-32 md:py-44 bg-[var(--color-ivory-200)]/40 grain">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">In their words</span>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <figure className="flex flex-col h-full">
                  <span className="text-display text-[5rem] leading-none text-[var(--color-burgundy-700)]/40 -mb-4">
                    “
                  </span>
                  <blockquote className="text-display text-[1.5rem] leading-[1.35] text-[var(--color-charcoal-900)]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-auto pt-10">
                    <div className="text-eyebrow text-[var(--color-charcoal-900)]">{t.name}</div>
                    <div className="text-[0.8rem] text-[var(--color-charcoal-500)] mt-1">{t.role}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── CTA ─────────────────────────── */}
      <CtaBanner />
    </>
  );
}
