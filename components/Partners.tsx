import { Reveal, SplitReveal } from "./Reveal";

type Mill = {
  name: string;
  src: string;
  since?: string;
  /** Final on-screen pixel height. Tuned by eye for visual parity, NOT by
   *  the raw aspect ratio of the source file, because the source crops
   *  vary wildly across the eight mills. */
  h: number;
};

// Heights recalibrated AFTER each source PNG was alpha-keyed (whites
// dropped to transparent — fixing Dormeuil's baked-in checker) AND
// trimmed flush to the mark.
//
// The squarer marks (Loro Piana 1.79:1, Scabal 1:1, Carlo Barbera 1.32:1)
// were finishing well below the cell width, leaving them visually smaller
// than the wide wordmarks. Bumped their caps so they fill the cell.
const mills: Mill[] = [
  { name: "Lanificio F.lli Cerruti", since: "1881", src: "/partners/cerruti.png",       h: 92 },
  { name: "Ermenegildo Zegna",                       src: "/partners/zegna.png",        h: 36 },
  { name: "Dormeuil",                                src: "/partners/dormeuil.png",     h: 110 },
  { name: "Loro Piana",                              src: "/partners/loro-piana.png",   h: 120 },
  { name: "Reda",                  since: "1865",    src: "/partners/reda.png",         h: 100 },
  { name: "Scabal",                                  src: "/partners/scabal.png",       h: 170 },
  { name: "Angelico",              since: "1959",    src: "/partners/angelico.png",     h: 60 },
  { name: "Carlo Barbera",                           src: "/partners/carlo-barbera.png", h: 145 },
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

      </div>

      {/* Marquee — continuous horizontal scroll. Two duplicate tracks
          translate -50% over one cycle so the loop is seamless. Pauses
          on hover so customers can study a specific mark.

          The track explicitly carries the same ivory background as the
          section so mixBlendMode: multiply on the logos has something
          cream to blend against — without it, the transform-induced
          stacking context isolates the imgs from the page bg and
          white-card logos (Loro Piana, Reda, Scabal) render their card
          on top of the cream. */}
      <div
        className="relative overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
      >
        <div className="partners-marquee flex w-max items-center gap-x-16 md:gap-x-24 py-4 bg-[var(--color-ivory-100)]">
          {[...mills, ...mills].map((m, i) => (
            <div
              key={`${m.name}-${i}`}
              className="relative shrink-0 grid place-items-center"
              style={{ height: 120 }}
              title={m.since ? `${m.name} · since ${m.since}` : m.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.src}
                alt={m.name}
                loading="lazy"
                decoding="async"
                style={{
                  maxHeight: m.h,
                  width: "auto",
                  mixBlendMode: "multiply",
                }}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .partners-marquee {
          animation: partners-scroll 45s linear infinite;
          will-change: transform;
        }
        .partners-marquee:hover { animation-play-state: paused; }
        @keyframes partners-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .partners-marquee { animation: none; }
        }
      `}</style>
    </section>
  );
}
