"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";
import { useAuth } from "./AuthProvider";

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Only the home page has a dark, full-bleed hero behind the nav.
  // Inner pages use a light background, so the nav should always be in
  // its "scrolled" dark-on-light state.
  const isHome = pathname === "/";
  const onDark = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || open || !isHome
            ? "bg-[var(--color-ivory-100)]/95 backdrop-blur-md border-b border-black/5"
            : "bg-gradient-to-b from-black/40 to-transparent"
        }`}
      >
        <div className="container-editorial flex items-center justify-between py-4 md:py-5">
          <Logo variant="compact" tone={onDark ? "ivory" : "burgundy"} />

          <nav className="hidden lg:flex items-center gap-9">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-eyebrow link-underline transition-colors ${
                    onDark
                      ? active
                        ? "text-[var(--color-ivory-100)]"
                        : "text-[var(--color-ivory-100)]/80 hover:text-[var(--color-ivory-100)]"
                      : active
                        ? "text-[var(--color-burgundy-700)]"
                        : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Account / Sign in (desktop) */}
            {user ? (
              <>
                <Link
                  href="/customize"
                  aria-label="Your cart"
                  className={`hidden lg:inline-flex items-center justify-center w-10 h-10 transition-colors ${
                    onDark
                      ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
                      : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                  }`}
                >
                  <ShoppingBag size={20} strokeWidth={1.5} />
                </Link>
                <Link
                  href="/account"
                  aria-label="Your account"
                  className={`hidden lg:inline-flex items-center justify-center w-10 h-10 transition-colors ${
                    onDark
                      ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
                      : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                  }`}
                >
                  <User size={20} strokeWidth={1.5} />
                </Link>
              </>
            ) : (
              <Link
                href="/account"
                className={`hidden lg:inline-flex items-center text-eyebrow link-underline transition-colors ${
                  onDark
                    ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
                    : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
                }`}
              >
                Sign in
              </Link>
            )}

            <Link
              href="/book"
              className={`hidden lg:inline-flex items-center gap-2 px-5 py-3 text-eyebrow transition-colors ${
                onDark
                  ? "bg-[var(--color-ivory-100)] text-[var(--color-charcoal-900)] hover:bg-white"
                  : "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-800)]"
              }`}
            >
              Book a Fitting
            </Link>

            {/* Cart icon on mobile too when signed in */}
            {user && (
              <Link
                href="/customize"
                aria-label="Your cart"
                className={`lg:hidden inline-flex items-center justify-center w-10 h-10 ${
                  onDark ? "text-[var(--color-ivory-100)]" : "text-[var(--color-charcoal-900)]"
                }`}
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`lg:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 ${
                onDark ? "text-[var(--color-ivory-100)]" : "text-[var(--color-charcoal-900)]"
              }`}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 bg-[var(--color-ivory-100)] lg:hidden"
          >
            <div className="container-editorial pt-28 pb-12 h-full flex flex-col">
              <nav className="flex flex-col gap-2">
                {nav.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="block text-display text-5xl md:text-6xl py-3 border-b border-black/10 text-[var(--color-charcoal-900)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto pt-10 space-y-3">
                <Link
                  href="/account"
                  className="flex w-full items-center justify-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] py-4 text-eyebrow"
                >
                  <User size={16} strokeWidth={1.5} />
                  {user ? "Your account" : "Sign in / Create account"}
                </Link>
                <Link
                  href="/book"
                  className="block w-full text-center bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] py-5 text-eyebrow"
                >
                  Book a Fitting
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
