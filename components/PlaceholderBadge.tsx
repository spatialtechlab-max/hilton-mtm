/**
 * Small "PLACEHOLDER" pill rendered on top of any image that isn't real
 * client photography — i.e. anything sourced from Unsplash. Lets the team
 * spot fake content at a glance during the review. Real assets (ERP feed,
 * hiltonmtm.com photos, /public/products) never trigger this.
 *
 * Drop the badge inside the same relative container as the <Image />.
 */
export function isPlaceholder(src: string | undefined | null): boolean {
  if (!src) return false;
  return /unsplash\.com/i.test(src);
}

export function PlaceholderBadge({ className }: { className?: string }) {
  return (
    <span
      className={`absolute top-3 left-3 z-20 inline-block bg-[var(--color-charcoal-900)]/85 text-[var(--color-ivory-100)] px-2 py-1 text-[0.55rem] tracking-[0.25em] uppercase backdrop-blur-sm pointer-events-none ${className ?? ""}`}
    >
      Placeholder
    </span>
  );
}
