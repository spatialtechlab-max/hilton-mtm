import { Button } from "./Button";
import { Reveal, SplitReveal } from "./Reveal";

/**
 * Closing CTA on every page. Stays inside the brand palette (burgundy on
 * cream) rather than the previous dark photo overlay. A thin top divider
 * separates it from the section above; the burgundy headline carries the
 * brand voice without needing a heavy image bed.
 *
 * No Reveal wrappers on the body content — when the previous dark version
 * was loaded with a deep-link scroll position the Reveals' IntersectionObserver
 * sometimes didn't fire and the whole block stayed at opacity 0. The
 * SplitReveal on the headline still does the word-by-word entrance.
 */
export function CtaBanner({
  title = "Begin your wardrobe.",
  body = "A private fitting at our Manama tailoring house, by appointment.",
  ctaLabel = "Design Yours",
  // Default destination is the Design Yours configurator — the in-store
  // fitting is still reachable via the explicit Contact link in the
  // primary nav. Pages that need a different destination pass `href`
  // through (heritage → /contact, collection → /contact).
  href = "/customize",
}: {
  title?: string;
  body?: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <section className="bg-[var(--color-ivory-100)] border-t border-black/10">
      <div className="container-editorial py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
        <div className="lg:col-span-8">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">An invitation</span>
          </Reveal>
          <h2 className="text-display mt-6 text-[clamp(2.25rem,4.5vw,4.5rem)] leading-[0.95] text-[var(--color-burgundy-700)]">
            <SplitReveal text={title} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              {body}
            </p>
          </Reveal>
        </div>
        <div className="lg:col-span-4 lg:justify-self-end">
          <Reveal delay={0.3}>
            <Button href={href} variant="solid">{ctaLabel}</Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
