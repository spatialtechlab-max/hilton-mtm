import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";

// A single editorial feature panel — the showroom shot of a double-breasted
// commission on the form. Sits between the process tease and the final CTA.
export function ShowroomFeature() {
  return (
    <section className="py-16 md:py-24 bg-[var(--color-ivory-200)]">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-7">
          <Reveal>
            <div className="relative aspect-[4/5] lg:aspect-[5/4] overflow-hidden">
              <Image
                src="/atelier/showroom-double-breasted.jpg"
                alt="A bespoke double-breasted suit on the form at the Hilton atelier"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">
              Recently in the atelier
            </span>
          </Reveal>
          <h2 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-5 leading-[1.05]">
            <SplitReveal text="A navy double-breasted, finished this week." />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Six button, peak lapel, soft Neapolitan shoulder. Three hundred
              hours, four fittings, one commission. Visit the showroom on
              Shaikh Abdulla Avenue to see the work in person.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <div className="mt-8 flex flex-wrap gap-5">
              <Link
                href="/book"
                className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
              >
                Book a fitting <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link
                href="/customize"
                className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] text-[var(--color-charcoal-900)] px-6 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                Design your own
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
