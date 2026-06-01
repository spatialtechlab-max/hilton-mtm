import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";

type Mill = {
  name: string;
  src: string;
  since?: string;
  /** Some marks read low; nudge their height up to balance the row. */
  scale?: number;
};

// Eight mills that supply the house. Sequenced for visual rhythm — short word
// marks (Reda, Zegna) alternate with the wider crests so the row breathes.
const mills: Mill[] = [
  { name: "Lanificio F.lli Cerruti", since: "1881", src: "/partners/cerruti.webp", scale: 1.05 },
  { name: "Ermenegildo Zegna",                       src: "/partners/zegna.png",    scale: 0.7 },
  { name: "Dormeuil",                                src: "/partners/dormeuil.png", scale: 1.05 },
  { name: "Loro Piana",                              src: "/partners/loro-piana.png" },
  { name: "Reda",                  since: "1865",   src: "/partners/reda.png",     scale: 0.95 },
  { name: "Scabal",                                  src: "/partners/scabal.png",   scale: 1.1 },
  { name: "Angelico",              since: "1959",   src: "/partners/angelico.webp", scale: 0.8 },
  { name: "Carlo Barbera",                           src: "/partners/carlo-barbera.jpg" },
];

export function Partners() {
  return (
    <section
      id="house-of-cloth"
      className="py-20 md:py-28 border-y border-black/10 bg-[var(--color-ivory-100)]"
    >
      <div className="container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-14 md:mb-20">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                The House of Cloth
              </span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.5rem,5vw,4.25rem)] mt-6 leading-[1.02]">
              <SplitReveal text="Cloth from the world's finest mills." />
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.2}>
              <p className="text-[1rem] md:text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-prose">
                Every commission begins at the bolt. We work with the mills that
                set the standard for the wool, mohair and cashmere worlds —
                houses still weaving in Biella, in Yorkshire, in Huddersfield,
                some for nearly two centuries. Their cloth, our hand.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Logo grid — four across on desktop, two on mobile. Grayscale-and-soft
            on rest, color on hover, so the row reads as a single quiet band. */}
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-y-12 gap-x-8 md:gap-x-12 items-center">
          {mills.map((m, i) => {
            const s = m.scale ?? 1;
            const h = Math.round(64 * s);
            return (
              <Reveal key={m.name} delay={i * 0.05} as="li">
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="relative w-full grid place-items-center"
                    style={{ height: h }}
                  >
                    <Image
                      src={m.src}
                      alt={m.name}
                      width={260}
                      height={h}
                      sizes="(min-width: 1024px) 14vw, 40vw"
                      className="max-h-full w-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <span className="text-eyebrow text-[var(--color-charcoal-500)] text-[0.62rem]">
                    {m.name}
                    {m.since ? <span className="opacity-60"> · {m.since}</span> : null}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
