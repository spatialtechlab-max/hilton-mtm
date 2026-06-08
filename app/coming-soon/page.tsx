import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hilton Made to Measure · Opening soon",
  description:
    "Three generations of tailors in Manama. Our new digital atelier opens soon.",
};

/**
 * Coming-soon takeover served on the apex hiltonmtm.com domain while
 * the storefront finishes development. Middleware rewrites every path
 * on the apex to this route. The full storefront stays accessible
 * through the existing Vercel URL and any non-apex domain.
 *
 * Uses a fixed full-screen overlay so it sits above the root layout's
 * Navigation / Footer / Concierge without needing a separate layout
 * tree. Sized with viewport-relative units throughout so it adapts to
 * every phone / tablet / monitor without horizontal scroll.
 */
export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-ivory-100)] overflow-y-auto">
      <div className="min-h-full flex flex-col">
        <div
          className="flex-1 flex flex-col items-center justify-center text-center px-[max(1.25rem,env(safe-area-inset-left))] py-[clamp(2rem,6vw,5rem)]"
          style={{
            paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
            paddingRight: "max(1.25rem, env(safe-area-inset-right))",
          }}
        >
          {/* Logo — transparent PNG of the burgundy M lockup. Scales
              from ~144px on the smallest phones up to ~320px on
              ultrawide. Fluid via clamp so there's no jump at any
              breakpoint. */}
          <div
            className="relative mx-auto"
            style={{
              width: "clamp(9rem, 22vw, 20rem)",
              aspectRatio: "479 / 404",
            }}
          >
            <Image
              src="/logo-burgundy.png"
              alt="Hilton Made to Measure"
              fill
              priority
              sizes="(min-width: 1024px) 22vw, 50vw"
              className="object-contain select-none"
              draggable={false}
            />
          </div>

          <span className="mt-[clamp(2rem,4vw,3rem)] text-eyebrow text-[var(--color-burgundy-700)]">
            Since 1970 · Manama, Bahrain
          </span>

          <h1
            className="text-display mt-[clamp(1rem,2.5vw,1.5rem)] leading-[0.95] text-[var(--color-charcoal-900)] max-w-[16ch] mx-auto"
            style={{ fontSize: "clamp(2rem, 7vw, 6rem)" }}
          >
            Opening soon.
          </h1>

          <p
            className="text-display italic text-[var(--color-burgundy-700)] leading-tight mt-[clamp(0.75rem,1.5vw,1.25rem)]"
            style={{ fontSize: "clamp(1.125rem, 2.4vw, 1.75rem)" }}
          >
            Tailored, not merely fitted.
          </p>

          <p className="mt-[clamp(2rem,4vw,3rem)] max-w-md text-[clamp(0.95rem,1.2vw,1.05rem)] text-[var(--color-charcoal-700)] leading-relaxed">
            Our new digital atelier opens soon. In the meantime, the
            tailoring house remains open by appointment.
          </p>

          <dl className="mt-[clamp(2.5rem,5vw,3.5rem)] grid grid-cols-1 sm:grid-cols-3 gap-x-[clamp(2rem,4vw,3rem)] gap-y-[clamp(1.5rem,3vw,2rem)] text-left w-full max-w-3xl">
            <div>
              <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Visit</dt>
              <dd className="mt-2 text-[clamp(0.9rem,1.1vw,1rem)] text-[var(--color-charcoal-900)] leading-relaxed">
                Shop No. 119, Shaikh Abdulla Avenue
                <br />
                Manama, Kingdom of Bahrain
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Call</dt>
              <dd className="mt-2 text-[clamp(0.9rem,1.1vw,1rem)] text-[var(--color-charcoal-900)]">
                <a
                  href="tel:+97317555000"
                  className="hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  +973 17 555 000
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Write</dt>
              <dd className="mt-2 text-[clamp(0.9rem,1.1vw,1rem)] text-[var(--color-charcoal-900)] break-words">
                <a
                  href="mailto:atelier@hiltonmtm.com"
                  className="hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  atelier@hiltonmtm.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <footer
          className="border-t border-black/10 py-[clamp(1rem,2vw,1.5rem)] text-center"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)] px-4">
            © Hilton Tailoring House · Three generations of tailors
          </p>
        </footer>
      </div>
    </div>
  );
}
