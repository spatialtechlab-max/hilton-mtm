import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";

// Three reportage photographs from the cutting bench in Manama. They sit as
// a calm editorial band that proves the page's claim — hand-cut, in-house.
const moments = [
  {
    src: "/atelier/drawing-the-curve.jpg",
    alt: "A master cutter drawing the curve of a sleeve on midnight cloth",
    cap: "Drawing the curve",
  },
  {
    src: "/atelier/the-cut.jpg",
    alt: "Cutting against the chalked line with shears",
    cap: "Cutting against the line",
  },
  {
    src: "/atelier/tie-wall.jpg",
    alt: "A grid of folded silk neckties in the showroom",
    cap: "The tie wall",
  },
];

export function AtelierStrip() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">
                In the atelier
              </span>
            </Reveal>
            <h2 className="text-display text-[clamp(2.25rem,5vw,4rem)] mt-6 leading-[1.02]">
              <SplitReveal text="Made by hand, in Manama." />
            </h2>
          </div>
          <Reveal delay={0.2}>
            <Link
              href="/process"
              className="text-eyebrow inline-flex items-center gap-2 text-[var(--color-charcoal-900)] link-underline"
            >
              Read the process <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {moments.map((m, i) => (
            <Reveal key={m.src} delay={i * 0.08}>
              <figure className="group">
                <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[var(--color-ivory-200)] hover-grow">
                  <Image
                    src={m.src}
                    alt={m.alt}
                    fill
                    sizes="(min-width: 768px) 32vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-4 text-eyebrow text-[var(--color-charcoal-500)]">
                  N° {String(i + 1).padStart(2, "0")} · {m.cap}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
