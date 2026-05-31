"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Logo } from "./Logo";
import { nav, site } from "@/lib/site";

/**
 * Cream footer — stays inside the brand palette (burgundy on cream) instead
 * of the previous dark slab. Sits on a slightly deeper cream than the page
 * background so the visitor can still see where the page ends.
 */
export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // Frontend-only confirmation for now — wire to a real list when chosen.
    setSubscribed(true);
    setEmail("");
    window.setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <footer className="bg-[var(--color-ivory-200)] text-[var(--color-charcoal-900)] border-t border-black/5">
      <div className="container-editorial pt-24 pb-10">
       <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Logo variant="full" tone="burgundy" href={null} className="-ml-2" />
            <p
              className="mt-8 max-w-md text-[var(--color-charcoal-700)] leading-relaxed"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", lineHeight: 1.4 }}
            >
              A garment is finished when nothing else can be removed. We measure, we listen,
              we cut. What remains is yours.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow text-[var(--color-burgundy-700)] mb-6">Atelier</h4>
            <ul className="space-y-3 text-[0.95rem]">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow text-[var(--color-burgundy-700)] mb-6">Visit</h4>
            <address className="not-italic text-[0.95rem] text-[var(--color-charcoal-800)] leading-relaxed">
              {site.address.line1}
              <br />
              {site.address.city}
            </address>
            <a
              href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
              className="block mt-4 text-[0.95rem] text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="block text-[0.95rem] text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              {site.email}
            </a>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-eyebrow text-[var(--color-burgundy-700)] mb-6">Correspondence</h4>
            <p className="text-[0.95rem] text-[var(--color-charcoal-800)] leading-relaxed mb-5">
              A quarterly letter on cloth, craft, and the things we are working on.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="flex border-b border-[var(--color-charcoal-900)]/25 focus-within:border-[var(--color-burgundy-700)] transition-colors"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 bg-transparent py-3 text-[0.95rem] placeholder:text-[var(--color-charcoal-500)]/70 focus:outline-none"
              />
              <button
                type="submit"
                className="text-eyebrow text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)] transition-colors py-3 pl-4 inline-flex items-center gap-2"
              >
                {subscribed ? <><Check size={14} strokeWidth={1.5} /> Thank you</> : "Subscribe"}
              </button>
            </form>
            <div className="flex gap-6 mt-8 text-eyebrow text-[var(--color-charcoal-700)]">
              <a href={site.social.instagram} className="hover:text-[var(--color-burgundy-700)] transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-black/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[0.78rem] text-[var(--color-charcoal-500)]">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/contact" className="hover:text-[var(--color-burgundy-700)] transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-[var(--color-burgundy-700)] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[var(--color-burgundy-700)] transition-colors">Accessibility</Link>
          </div>
        </div>
       </div>
      </div>
    </footer>
  );
}
