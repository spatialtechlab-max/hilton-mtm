import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";

const timeline = [
  {
    year: "1962",
    title: "A small room on West 38th",
    body:
      "Edmund Hilton opens a single-room workshop above a hat-maker on the edge of New York's Garment District with one cutting table and a borrowed iron.",
  },
  {
    year: "1974",
    title: "The first commission abroad",
    body:
      "A standing order from a Boston shipping family takes the firm to London for a season, and the cutting techniques never leave the bench.",
  },
  {
    year: "1989",
    title: "Madison Avenue",
    body:
      "Three generations later, the atelier moves to its current floor on Madison: north-facing daylight, oak benches, and a single bell over the door.",
  },
  {
    year: "2014",
    title: "The cloth library",
    body:
      "A permanent library of forty-seven mills is established: Huddersfield, Biella, Como, Yorkshire. Accessible only to clients of the house.",
  },
  {
    year: "Today",
    title: "The same patient hand",
    body:
      "Fourteen people. Three hundred hours per suit. One garment, made well, for one body. Nothing has changed and nothing needs to.",
  },
];

const values = [
  {
    n: "I.",
    t: "Slow is a virtue.",
    d: "We have never sold a same-day suit and never will.",
  },
  {
    n: "II.",
    t: "The pattern is a promise.",
    d: "Every pattern is drawn for one body, kept for life, and revised as the body changes.",
  },
  {
    n: "III.",
    t: "Cloth before colour.",
    d: "We choose the weight, then the weave, then the cloth, and only then the colour.",
  },
  {
    n: "IV.",
    t: "Honest seams.",
    d: "Nothing is fused. The canvas is natural. The lining is bemberg. The shoulder is hand-padded.",
  },
];

export default function HeritagePage() {
  return (
    <>
      <PageHero
        eyebrow="Since 1962"
        title="Heritage."
        intro="Six decades on Madison Avenue. Three generations of cutters. One pattern at a time."
        image={{
          src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
          alt: "An archive photograph of the original atelier",
        }}
      />

      {/* Statement */}
      <section className="py-24 md:py-36 border-t border-black/10">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Our position</span>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <h2 className="text-display text-[clamp(2rem,4vw,3.75rem)] leading-[1.15]">
              <SplitReveal
                text="We are not a brand of the moment. We are a small house that believes the quietest garment in the room is also the most considered. Tailoring is the practice of removing what is not necessary. What remains, when done well, is the wearer."
                staggerWord={0.02}
              />
            </h2>
          </div>
        </div>
      </section>

      {/* Atelier image full bleed */}
      <section>
        <div className="relative h-[60vh] min-h-[420px] w-full">
          <Image
            src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop"
            alt="The Madison Avenue atelier floor"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="py-32 md:py-44">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Six decades</span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.25rem,4.5vw,4rem)] mt-6 leading-[1.02]">
              <SplitReveal text="A chronology." />
            </h2>
          </div>
          <ol className="lg:col-span-7 lg:col-start-6 border-t border-black/10">
            {timeline.map((e, i) => (
              <Reveal key={e.year} delay={i * 0.08} as="li">
                <div className="grid grid-cols-12 gap-4 py-10 border-b border-black/10 group">
                  <span className="col-span-3 lg:col-span-2 text-display text-[1.75rem] text-[var(--color-burgundy-700)]">
                    {e.year}
                  </span>
                  <div className="col-span-9 lg:col-span-10">
                    <h3 className="text-display text-[1.75rem] text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                      {e.title}
                    </h3>
                    <p className="mt-3 text-[0.975rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-2xl">
                      {e.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 md:py-44 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)]">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-300)]">The house rules</span>
          </Reveal>
          <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-6 max-w-3xl leading-[1.02]">
            <SplitReveal text="Four principles we will not surrender." />
          </h2>
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
            {values.map((v, i) => (
              <Reveal key={v.n} delay={i * 0.08}>
                <div className="flex gap-8 items-start">
                  <span className="text-display text-[2.5rem] text-[var(--color-burgundy-300)] leading-none">
                    {v.n}
                  </span>
                  <div>
                    <h3 className="text-display text-[2rem] leading-[1.1]">{v.t}</h3>
                    <p className="mt-4 text-[1rem] text-[var(--color-ivory-200)]/80 leading-relaxed">
                      {v.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="A house, not a brand."
        body="Come and meet the people who make the garments. The kettle is always on."
        ctaLabel="Visit the Atelier"
        href="/contact"
      />
    </>
  );
}
