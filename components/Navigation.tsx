"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Shield, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";
import { useAuth } from "./AuthProvider";
import { useCart } from "@/lib/cart";
import { isAdmin } from "@/lib/admin";
import { NotificationBell } from "./NotificationBell";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { count: cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // usePathname() is null/placeholder during static prerender and the first
  // client render of statically-generated routes, so `pathname === "/"` came
  // up false on the home page and left the hero nav stuck in its opaque
  // inner-page state (the earlier scroll-only fix never touched this).
  // Re-derive the real path on the client so the home hero reliably gets the
  // transparent, dark-overlay nav.
  const [clientPath, setClientPath] = useState<string | null>(null);
  useEffect(() => {
    setClientPath(window.location.pathname);
  }, [pathname]);
  const activePath = clientPath ?? pathname;

  // Only the home page has a dark, full-bleed hero behind the nav.
  // Inner pages use a light background, so the nav should always be in
  // its "scrolled" dark-on-light state.
  const isHome = activePath === "/";
  const onDark = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    // The browser's automatic scroll restoration and the back/forward
    // bfcache resume a page WITHOUT firing a scroll event, and the hero
    // images settle the layout a beat after mount. Any of these can leave
    // the nav stuck in the wrong (opaque) state at the very top until the
    // visitor scrolls. Re-derive the state on the next frame, shortly
    // after, and on every pageshow so it always matches the real scroll.
    const raf = requestAnimationFrame(onScroll);
    const settle = setTimeout(onScroll, 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onScroll);
    };
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
              const active = activePath === item.href;
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
            {/* Notifications bell — visible to anyone, fills with live order
                status changes when signed in. */}
            <div className="hidden lg:inline-flex">
              <NotificationBell tone={onDark ? "light" : "dark"} />
            </div>

            {/* Cart — always visible, with item-count badge */}
            <Link
              href="/cart"
              aria-label={`Your cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className={`hidden lg:inline-flex relative items-center justify-center w-10 h-10 transition-colors ${
                onDark
                  ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
                  : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
              }`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[0.6rem] font-medium tracking-normal bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account / Sign in (desktop) */}
            {user ? (
              <AccountMenu
                user={user}
                onDark={onDark}
                onSignOut={async () => { await signOut(); router.push("/"); }}
              />
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

            {/* Book a Fitting hidden per atelier request (code kept). */}
            <Link
              href="/book"
              className={`hidden items-center gap-2 px-5 py-3 text-eyebrow transition-colors ${
                onDark
                  ? "bg-[var(--color-ivory-100)] text-[var(--color-charcoal-900)] hover:bg-white"
                  : "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-800)]"
              }`}
            >
              Book a Fitting
            </Link>

            {/* Cart icon on mobile — always visible */}
            <Link
              href="/cart"
              aria-label={`Your cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className={`lg:hidden relative inline-flex items-center justify-center w-10 h-10 ${
                onDark ? "text-[var(--color-ivory-100)]" : "text-[var(--color-charcoal-900)]"
              }`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[0.6rem] font-medium tracking-normal bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
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
                {/* Book a Fitting hidden per atelier request (code kept). */}
                <Link
                  href="/book"
                  className="hidden w-full text-center bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] py-5 text-eyebrow"
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

/**
 * Desktop-only profile pop-over. Opens on hover, stays open as long as
 * the user is over the trigger or the panel. A short close delay lets
 * the cursor drift across the gap between them. Also opens on click so
 * keyboard / touch users get the same affordance.
 *
 * Shows the user's email + name + a couple of quick links so the most
 * common ask — signing out without leaving the page they're on — is
 * one click away.
 */
function AccountMenu({
  user,
  onDark,
  onSignOut,
}: {
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null };
  onDark: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const email = user.email ?? "";
  const name =
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ??
    "";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    isAdmin(email).then((a) => { if (!cancelled) setAdmin(a); });
    return () => { cancelled = true; };
  }, [email]);

  function show() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpen(true);
  }
  function hideSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <div
      className="hidden lg:block relative"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <button
        type="button"
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center w-10 h-10 transition-colors ${
          onDark
            ? "text-[var(--color-ivory-100)]/85 hover:text-[var(--color-ivory-100)]"
            : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
        }`}
      >
        <User size={20} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[var(--color-ivory-100)] border border-black/10 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)]"
          >
            <div className="px-5 py-4 border-b border-black/10 flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] inline-flex items-center justify-center text-display text-[1rem]">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                {name && (
                  <p className="text-[0.95rem] text-[var(--color-charcoal-900)] truncate leading-tight">
                    {name}
                  </p>
                )}
                <p className="text-[0.78rem] text-[var(--color-charcoal-500)] flex items-start gap-1.5 mt-0.5 min-w-0">
                  <Mail size={11} strokeWidth={1.5} className="shrink-0 mt-[3px]" />
                  <span className="break-all">{email}</span>
                </p>
              </div>
            </div>

            <div className="py-2">
              <Link
                href="/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.9rem] text-[var(--color-charcoal-800)] hover:bg-[var(--color-ivory-200)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                <User size={15} strokeWidth={1.5} /> Your account
              </Link>
              <Link
                href="/cart"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.9rem] text-[var(--color-charcoal-800)] hover:bg-[var(--color-ivory-200)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                <ShoppingBag size={15} strokeWidth={1.5} /> Your cart
              </Link>
              {admin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-[0.9rem] text-[var(--color-charcoal-800)] hover:bg-[var(--color-ivory-200)] hover:text-[var(--color-burgundy-700)] transition-colors"
                >
                  <Shield size={15} strokeWidth={1.5} /> Atelier admin
                </Link>
              )}
            </div>

            <div className="border-t border-black/10">
              <button
                type="button"
                role="menuitem"
                onClick={async () => { setOpen(false); await onSignOut(); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-[0.9rem] text-[var(--color-burgundy-700)] hover:bg-[var(--color-burgundy-50)] transition-colors text-left"
              >
                <LogOut size={15} strokeWidth={1.5} /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
