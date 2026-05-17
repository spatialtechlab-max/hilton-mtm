import Image from "next/image";
import { Button } from "./Button";
import { Reveal, SplitReveal } from "./Reveal";

export function CtaBanner({
  title = "Begin your wardrobe.",
  body = "A private fitting at the Madison Avenue atelier, by appointment.",
  ctaLabel = "Book a Fitting",
  href = "/book",
  image = "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=2000&auto=format&fit=crop",
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  href?: string;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[var(--color-charcoal-900)]/65" />
      </div>
      <div className="container-editorial py-32 md:py-44 text-[var(--color-ivory-100)]">
        <Reveal>
          <span className="text-eyebrow text-[var(--color-ivory-300)]/80">An invitation</span>
        </Reveal>
        <h2 className="text-display mt-6 text-[clamp(3rem,7vw,6.5rem)] max-w-4xl leading-[0.95]">
          <SplitReveal text={title} />
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl text-[var(--color-ivory-200)]/85 text-[1.1rem] leading-relaxed">
            {body}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-12">
            <Button href={href} variant="ivory">{ctaLabel}</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
