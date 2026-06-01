import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";

type Mill = {
  name: string;
  src: string;
  since?: string;
  /** Pixel cap so each mark reads at a similar VISUAL weight in the row.
   *  Word-mark logos (Zegna, Loro Piana, Reda) sit tall; crested marks with
   *  a strapline (Cerruti, Dormeuil, Angelico) sit short. The numbers
   *  compensate for the cropping of the source files. */
  cap: number;
};

// Eight mills that supply the house. Each cap is hand-picked from looking at
// the raw asset; we trust the source files' aspect ratios but normalise the
// final on-screen height so the row reads as a balanced museum-label band.
const mills: Mill[] = [
  { name: "Lanificio F.lli Cerruti", since: "1881", src: "/partners/cerruti.webp",     cap: 74 },
  { name: "Ermenegildo Zegna",                       src: "/partners/zegna.png",        cap: 50 },
  { name: "Dormeuil",                                src: "/partners/dormeuil.png",     cap: 88 },
  { name: "Loro Piana",                              src: "/partners/loro-piana.png",   cap: 64 },
  { name: "Reda",                  since: "1865",    src: "/partners/reda.png",         cap: 78 },
  { name: "Scabal",                                  src: "/partners/scabal.png",       cap: 92 },
  { name: "Angelico",              since: "1959",    src: "/partners/angelico.webp",    cap: 60 },
  { name: "Carlo Barbera",                           src: "/partners/carlo-barbera.jpg", cap: 70 },
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

        {/* Logos in original colour, normalised by visual height. White cards
            on the source files drop into the page background via mix-blend-
            multiply so the page reads as a single calm band of marks, not a
            row of jpegs. */}
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-y-14 gap-x-10 md:gap-x-16 items-center">
          {mills.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.05} as="li">
              <div
                className="relative w-full grid place-items-center"
                style={{ height: m.cap + 12 }}
                title={m.since ? `${m.name} · since ${m.since}` : m.name}
              >
                <Image
                  src={m.src}
                  alt={m.name}
                  width={320}
                  height={m.cap}
                  sizes="(min-width: 1024px) 14vw, 40vw"
                  style={{
                    maxHeight: m.cap,
                    width: "auto",
                    mixBlendMode: "multiply",
                  }}
                  className="object-contain"
                />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
