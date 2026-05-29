import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";

const timeline = [
  {
    year: "1970",
    title: "The Foundation",
    body:
      "Master tailor Joseph Francis D'Souza opens the doors to the original Hilton Tailors in the historic Manama Souq, establishing a standard for superior craftsmanship and personal service.",
  },
  {
    year: "2005",
    title: "A New Generation",
    body:
      "George joins his father in the family business, bringing fresh vision and international training to the company. He opens the first new outlet under the name Hilton Bespoke.",
  },
  {
    year: "2011",
    title: "The Next Chapter in Zinj",
    body:
      "The official birth of the Hilton Bespoke flagship in Zinj — a new space dedicated entirely to high-end, highly personalised bespoke tailoring and premium global fabrics.",
  },
  {
    year: "2016",
    title: "Expanding the Vision",
    body:
      "The Hilton Made to Measure outlet opens, creating a new, streamlined path for clients to experience our custom clothing and signature fit.",
  },
  {
    year: "2019",
    title: "The House is Formed",
    body:
      "The official launch of our mother brand, Hilton Tailoring House — unifying Hilton Tailors, Hilton Bespoke and Hilton Made to Measure under one trusted name in Bahrain.",
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
        eyebrow="Since 1970"
        title="Heritage."
        intro="Three generations of tailors. One workshop, born in the Manama Souq. A passion for the craft that began with a single pair of hands and has only grown."
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
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Our story</span>
            </Reveal>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-display text-[clamp(2rem,4vw,3.75rem)] leading-[1.15]">
              <SplitReveal
                text="Founded in 1970 by master tailor Joseph Francis D'Souza, our company began as Hilton Tailors in the vibrant heart of the Manama Souq."
                staggerWord={0.02}
              />
            </h2>
            <Reveal delay={0.2}>
              <p className="text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-2xl">
                Teaching himself the complex art of cutting at an early age, Joseph built a lasting reputation through his meticulous nature, hard work, and a genuine dedication to his clients.
              </p>
            </Reveal>
            <Reveal delay={0.28}>
              <p className="text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-2xl">
                Joseph's son, George, grew up immersed in the family business. After studying the trade abroad, George returned to build upon his father's legacy — introducing international fabric brands and a more personalised, high-end experience to a discerning clientele.
              </p>
            </Reveal>
            <Reveal delay={0.36}>
              <p className="text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-2xl">
                Today, under the banner of Hilton Tailoring House, we take pride in a dedicated team of master craftsmen — many of whom were personally trained by Joseph himself. Every skilled professional in our workshop specialises in a particular aspect of tailoring. Together, we work toward a single goal: exceptional, comfortable, perfectly fitted garments that elevate your personal style.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Atelier image full bleed */}
      <section>
        <div className="relative h-[60vh] min-h-[420px] w-full">
          <Image
            src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2400&auto=format&fit=crop"
            alt="The Hilton Tailoring House atelier floor in Manama"
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
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Five decades</span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.25rem,4.5vw,4rem)] mt-6 leading-[1.02]">
              <SplitReveal text="The Evolution of Hilton Tailoring House." />
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
