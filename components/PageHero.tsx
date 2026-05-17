import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image: { src: string; alt: string };
}) {
  return (
    <section className="relative pt-32 md:pt-40 pb-20 lg:pb-28">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-7">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">{eyebrow}</span>
          </Reveal>
          <h1 className="text-display text-[clamp(3rem,7.5vw,7rem)] mt-6 leading-[0.95]">
            <SplitReveal text={title} />
          </h1>
          {intro && (
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-xl text-[1.1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                {intro}
              </p>
            </Reveal>
          )}
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.35}>
            <div className="relative aspect-[4/5] overflow-hidden hover-grow grain">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
