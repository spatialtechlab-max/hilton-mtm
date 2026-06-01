import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";

// Six editorial photographs of the swatch books that live at the atelier.
// They double as proof of pedigree — the mills printed on the bindings are
// the same houses listed in the homepage `<Partners />` row.
const books = [
  { src: "/atelier/vbc-book.jpg",          alt: "Vitale Barberis Canonico swatch book and cloth folios",     cap: "Vitale Barberis Canonico",  aspect: "aspect-[4/5]" },
  { src: "/atelier/zegna-mediterranea.jpg", alt: "Ermenegildo Zegna 'Mediterranea' folio with horn buttons",   cap: "Zegna · Mediterranea",      aspect: "aspect-[3/4]" },
  { src: "/atelier/trofeo-book.jpg",        alt: "Trofeo Summer swatch book opened across the bench",         cap: "Trofeo · Summer",           aspect: "aspect-[3/2]" },
  { src: "/atelier/carnet-jackets.jpg",     alt: "Carnet jacketing swatches fanned with horn buttons",        cap: "Carnet · Jackets",          aspect: "aspect-[3/4]" },
  { src: "/atelier/alumo-shirting.jpg",     alt: "Alumo shirting swatches and the year's shirting cards",     cap: "Alumo · Shirting",          aspect: "aspect-[3/4]" },
  { src: "/atelier/pocket-squares.jpg",     alt: "Silk pocket squares on the showroom rack",                  cap: "From the silk room",        aspect: "aspect-[4/5]" },
];

export function MillBookGallery() {
  return (
    <section className="py-16 md:py-24 bg-[var(--color-ivory-200)]">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                From the cloth library
              </span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.25rem,5vw,4rem)] mt-6 leading-[1.02]">
              <SplitReveal text="The library, opened." />
            </h2>
          </div>
          <Reveal delay={0.2}>
            <p className="md:max-w-sm text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
              A walk through the swatch folios that live on the bench — the
              same houses, in cloth.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {books.map((b, i) => (
            <Reveal key={b.src} delay={i * 0.06}>
              <figure className="group">
                <div
                  className={`relative ${b.aspect} overflow-hidden bg-[var(--color-ivory-100)] hover-grow`}
                >
                  <Image
                    src={b.src}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 768px) 32vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-eyebrow text-[var(--color-charcoal-500)]">
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
