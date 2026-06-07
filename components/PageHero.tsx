import Image from "next/image";
import { Reveal, SplitReveal } from "./Reveal";
import { PlaceholderBadge, isPlaceholder } from "./PlaceholderBadge";
import { MediaImage } from "./MediaImage";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  slot,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image: { src: string; alt: string };
  /** When provided, the hero photo becomes admin-editable via this
   *  media slot. The image prop continues to act as the fallback. */
  slot?: string;
}) {
  return (
    <section className="relative pt-28 md:pt-32 pb-12 lg:pb-16">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">{eyebrow}</span>
          </Reveal>
          <h1 className="text-display text-[clamp(2.75rem,6vw,5rem)] mt-4 leading-[0.98]">
            <SplitReveal text={title} />
          </h1>
          {intro && (
            <Reveal delay={0.25}>
              <p className="mt-6 max-w-md text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                {intro}
              </p>
            </Reveal>
          )}
        </div>
        <div>
          <Reveal delay={0.35}>
            <div className="relative aspect-[3/4] overflow-hidden hover-grow grain">
              {slot ? (
                <MediaImage
                  slot={slot}
                  fallback={image.src}
                  fallbackAlt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <>
                  {isPlaceholder(image.src) && <PlaceholderBadge />}
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
