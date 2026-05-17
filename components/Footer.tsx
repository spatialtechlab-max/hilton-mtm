import Link from "next/link";
import { Logo } from "./Logo";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)]">
      <div className="container-editorial pt-24 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Logo variant="full" tone="ivory" href={null} className="-ml-2" />
            <p
              className="mt-8 max-w-md text-[var(--color-ivory-200)]/80 text-[1.0625rem] leading-relaxed"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", lineHeight: 1.4 }}
            >
              A garment is finished when nothing else can be removed. We measure, we listen,
              we cut. What remains is yours.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow text-[var(--color-ivory-300)]/80 mb-6">Atelier</h4>
            <ul className="space-y-3 text-[0.95rem]">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-[var(--color-ivory-100)]/85 hover:text-[var(--color-burgundy-300)] transition-colors"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow text-[var(--color-ivory-300)]/80 mb-6">Visit</h4>
            <address className="not-italic text-[0.95rem] text-[var(--color-ivory-100)]/85 leading-relaxed">
              {site.address.line1}
              <br />
              {site.address.city}
            </address>
            <a
              href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
              className="block mt-4 text-[0.95rem] text-[var(--color-ivory-100)]/85 hover:text-[var(--color-burgundy-300)]"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="block text-[0.95rem] text-[var(--color-ivory-100)]/85 hover:text-[var(--color-burgundy-300)]"
            >
              {site.email}
            </a>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-eyebrow text-[var(--color-ivory-300)]/80 mb-6">Correspondence</h4>
            <p className="text-[0.95rem] text-[var(--color-ivory-100)]/85 leading-relaxed mb-5">
              A quarterly letter on cloth, craft, and the things we are working on.
            </p>
            <form className="flex border-b border-[var(--color-ivory-300)]/30 focus-within:border-[var(--color-burgundy-300)] transition-colors">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-transparent py-3 text-[0.95rem] placeholder:text-[var(--color-ivory-300)]/40 focus:outline-none"
              />
              <button
                type="submit"
                className="text-eyebrow text-[var(--color-ivory-100)] hover:text-[var(--color-burgundy-300)] transition-colors py-3 pl-4"
              >
                Subscribe
              </button>
            </form>
            <div className="flex gap-6 mt-8 text-eyebrow text-[var(--color-ivory-300)]/80">
              <a href={site.social.instagram} className="hover:text-[var(--color-burgundy-300)]">
                Instagram
              </a>
              <a href={site.social.linkedin} className="hover:text-[var(--color-burgundy-300)]">
                LinkedIn
              </a>
              <a href={site.social.pinterest} className="hover:text-[var(--color-burgundy-300)]">
                Pinterest
              </a>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-[var(--color-ivory-300)]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[0.78rem] text-[var(--color-ivory-300)]/60">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[var(--color-ivory-100)]">Privacy</Link>
            <Link href="#" className="hover:text-[var(--color-ivory-100)]">Terms</Link>
            <Link href="#" className="hover:text-[var(--color-ivory-100)]">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
