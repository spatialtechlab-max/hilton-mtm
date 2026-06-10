import { Reveal, SplitReveal } from "./Reveal";
import { MediaImage } from "./MediaImage";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

// Six editorial photographs of the swatch books that live at the atelier.
// They double as proof of pedigree — the mills printed on the bindings are
// the same houses listed in the homepage `<Partners />` row.
const captions: Record<number, string> = {
  1: "Vitale Barberis Canonico",
  2: "Zegna · Mediterranea",
  3: "Trofeo · Summer",
  4: "Carnet · Jackets",
  5: "Alumo · Shirting",
  6: "From the silk room",
};
const books = [1, 2, 3, 4, 5, 6].map((i) => ({
  slot: MEDIA_SLOTS.find((s) => s.key === `heritage.mill.${i}`)!,
  cap: captions[i],
}));

export function MillBookGallery() {
  return (
    <section className="py-14 md:py-20 bg-[var(--color-ivory-200)]">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 md:mb-14">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                From the cloth library
              </span>
            </Reveal>
            <h2 className="text-display text-[clamp(2rem,4vw,3.25rem)] mt-5 leading-[1.04]">
              <SplitReveal text="The library, opened." />
            </h2>
          </div>
          <Reveal delay={0.2}>
            <p className="md:max-w-sm text-[0.9rem] text-[var(--color-charcoal-700)] leading-relaxed">
              A walk through the swatch folios that live on the bench: the
              same houses, in cloth.
            </p>
          </Reveal>
        </div>

        {/* Three across on desktop, two on tablet, two on mobile.
            Uniform 3:4 aspect for a calmer, tighter editorial grid. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {books.map((b, i) => (
            <Reveal key={b.slot.key} delay={i * 0.06}>
              <figure className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-ivory-100)] hover-grow">
                  <MediaImage
                    slot={b.slot.key}
                    fallback={b.slot.fallback}
                    fallbackAlt={b.slot.fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 32vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2.5 text-eyebrow text-[var(--color-charcoal-500)] text-[0.62rem]">
                  {b.cap}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
