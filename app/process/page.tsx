import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";
import { Button } from "@/components/Button";

const chapters = [
  {
    n: "01",
    title: "The Consultation",
    duration: "≈ 60 minutes",
    body:
      "Every commission begins with conversation. The shape of your day, the climate of the cities you move through, the ten things in your wardrobe you actually wear. From this, the brief.",
    image:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1600&auto=format&fit=crop",
  },
  {
    n: "02",
    title: "The Measure",
    duration: "≈ 45 minutes",
    body:
      "Thirty-two measurements taken twice. The second to verify. Posture, balance and stance noted by hand. No two patterns are drawn alike, even from the same numbers.",
    image:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1600&auto=format&fit=crop",
  },
  {
    n: "03",
    title: "Cloth & Cut",
    duration: "Selection over days",
    body:
      "From forty-seven mills we curate the season's bunches: Huddersfield worsteds, Biella flannels, the linens of Como. The cutter's pattern is then drawn in chalk on butcher paper.",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
  },
  {
    n: "04",
    title: "The Fittings",
    duration: "Two to three sessions",
    body:
      "A basted fitting in white thread reveals the shoulder line and the rake of the lapel. A second confirms the silhouette. Only then is the garment closed and finished by hand.",
    image:
      "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1600&auto=format&fit=crop",
  },
  {
    n: "05",
    title: "Delivery",
    duration: "8 to 10 weeks total",
    body:
      "Hand-pressed, hung in canvas, delivered to your door or pressed and ready in the changing room at Madison Avenue. The pattern is kept; the next commission begins from where this one ended.",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="The Method"
        title="Made to Measure."
        intro="Five chapters from your first telephone call to the day a garment hangs in your wardrobe. Unhurried by design, because the only way to make something well is slowly."
        image={{
          src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1400&auto=format&fit=crop",
          alt: "A basted jacket on the cutting table",
        }}
      />

      {/* Chapter sections */}
      {chapters.map((c, i) => {
        const reversed = i % 2 === 1;
        return (
          <section
            key={c.n}
            className={`py-24 md:py-36 ${i === 0 ? "border-t border-black/10" : ""}`}
          >
            <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <div className={`lg:col-span-6 ${reversed ? "lg:order-2" : ""}`}>
                <Reveal>
                  <div className="relative aspect-[4/5] overflow-hidden hover-grow">
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              </div>

              <div className={`lg:col-span-5 ${reversed ? "lg:col-start-1" : "lg:col-start-8"}`}>
                <Reveal>
                  <div className="flex items-baseline gap-5">
                    <span className="text-display text-[3rem] text-[var(--color-burgundy-700)] leading-none">
                      {c.n}
                    </span>
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">
                      {c.duration}
                    </span>
                  </div>
                </Reveal>
                <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-4 leading-[1.02]">
                  <SplitReveal text={c.title} />
                </h2>
                <Reveal delay={0.3}>
                  <p className="mt-8 text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {c.body}
                  </p>
                </Reveal>
              </div>
            </div>
          </section>
        );
      })}

      {/* Pricing rail */}
      <section className="bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] py-32">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-300)]">A note on price</span>
          </Reveal>
          <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-6 max-w-3xl leading-[1.02]">
            <SplitReveal text="Honest figures for honest work." />
          </h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-10">
            {[
              { tier: "Made to Measure", from: "$1,650", note: "Jacket only" },
              { tier: "Two-Piece Suit", from: "$2,400", note: "Jacket & trouser" },
              { tier: "Full Commission", from: "$5,200", note: "Suit, shirt, accessories" },
            ].map((p) => (
              <div key={p.tier} className="border-l border-[var(--color-ivory-300)]/25 pl-6">
                <h3 className="text-eyebrow text-[var(--color-ivory-300)]/80">{p.tier}</h3>
                <p className="text-display text-[3.5rem] mt-3 leading-none">{p.from}</p>
                <p className="mt-3 text-[0.95rem] text-[var(--color-ivory-200)]/70">{p.note}</p>
              </div>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div className="mt-16">
              <Button href="/book" variant="ivory">Begin a commission</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBanner
        title="Ready when you are."
        body="The first conversation is free. Bring a jacket you love and we will tell you why."
      />
    </>
  );
}
