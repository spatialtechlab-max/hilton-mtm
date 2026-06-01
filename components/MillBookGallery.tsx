import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";

// Six editorial photographs of the swatch books that live at the atelier.
// They double as proof of pedigree — the mills printed on the bindings are
// the same houses listed in the homepage `<Partners />` row.
const books = [
  { src: "/atelier/vbc-book.jpg",           alt: "Vitale Barberis Canonico swatch book and cloth folios",   cap: "Vitale Barberis Canonico" },
  { src: "/atelier/zegna-mediterranea.jpg", alt: "Ermenegildo Zegna 'Mediterranea' folio with horn buttons", cap: "Zegna · Mediterranea" },
  { src: "/atelier/trofeo-book.jpg",        alt: "Trofeo Summer swatch book opened across the bench",       cap: "Trofeo · Summer" },
  { src: "/atelier/carnet-jackets.jpg",     alt: "Carnet jacketing swatches fanned with horn buttons",      cap: "Carnet · Jackets" },
  { src: "/atelier/alumo-shirting.jpg",     alt: "Alumo shirting swatches and the year's shirting cards",   cap: "Alumo · Shirting" },
  { src: "/atelier/pocket-squares.jpg",     alt: "Silk pocket squares on the showroom rack",                cap: "From the silk room" },
];

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
              A walk through the swatch folios that live on the bench — the
              same houses, in cloth.
            </p>
          </Reveal>
        </div>

        {/* Three across on desktop, two on tablet, two on mobile.
            Uniform 3:4 aspect for a calmer, tighter editorial grid. */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {books.map((b, i) => (
            <Reveal key={b.src} delay={i * 0.06}>
              <figure className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-ivory-100)] hover-grow">
                  <Image
                    src={b.src}
                    alt={b.alt}
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
