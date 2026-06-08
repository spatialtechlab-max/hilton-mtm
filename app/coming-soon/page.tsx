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
 * tree. z-[100] covers everything.
 */
export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-ivory-100)] flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative w-20 h-20 md:w-24 md:h-24 mb-10">
          <Image
            src="/logo-full.png"
            alt="Hilton Made to Measure"
            fill
            priority
            sizes="96px"
            className="object-contain"
          />
        </div>

        <span className="text-eyebrow text-[var(--color-burgundy-700)]">
          Since 1970 · Manama, Bahrain
        </span>

        <h1 className="text-display text-[clamp(2.5rem,7vw,6rem)] mt-6 leading-[0.95] text-[var(--color-charcoal-900)]">
          Hilton Made to Measure.
        </h1>

        <p className="mt-5 text-display italic text-[clamp(1.25rem,2.5vw,1.75rem)] text-[var(--color-burgundy-700)] leading-tight">
          Tailored, not merely fitted.
        </p>

        <p className="mt-12 max-w-md text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
          Our new digital atelier opens soon. In the meantime, the
          tailoring house remains open by appointment.
        </p>

        <dl className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-8 text-left max-w-3xl">
          <div>
            <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Visit</dt>
            <dd className="mt-2 text-[0.95rem] text-[var(--color-charcoal-900)] leading-relaxed">
              Shop No. 119, Shaikh Abdulla Avenue
              <br />
              Manama, Kingdom of Bahrain
            </dd>
          </div>
          <div>
            <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Call</dt>
            <dd className="mt-2 text-[0.95rem] text-[var(--color-charcoal-900)]">
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
            <dd className="mt-2 text-[0.95rem] text-[var(--color-charcoal-900)]">
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

      <footer className="border-t border-black/10 py-6 text-center">
        <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)]">
          © Hilton Tailoring House · Three generations of tailors
        </p>
      </footer>
    </div>
  );
}
