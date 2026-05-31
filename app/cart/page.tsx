"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, removeFromCart, updateQty, clearCart } from "@/lib/cart";
import { useAuth } from "@/components/AuthProvider";
import { ProfileForm } from "@/components/ProfileForm";
import { AuthForm } from "@/components/AuthForm";
import { createOrderFromCart, fetchProfile, isProfileComplete, type Profile } from "@/lib/orders";

const fmt = (n: number) =>
  `د.ب ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function CartPage() {
  const { items, subtotal, count } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [phase, setPhase]     = useState<"cart" | "auth" | "profile">("cart");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // When the user signs in mid-checkout, advance phase automatically.
  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      setProfile(p);
      if (phase === "auth") setPhase(isProfileComplete(p) ? "cart" : "profile");
    });
  }, [user, phase]);

  async function startCheckout() {
    setError(null);
    if (items.length === 0) return;
    if (!user)              { setPhase("auth"); return; }
    let p = profile;
    if (!p) { p = await fetchProfile(user.id); setProfile(p); }
    if (!isProfileComplete(p)) { setPhase("profile"); return; }
    placeOrder(p!);
  }

  async function placeOrder(p: Profile) {
    if (!user) return;
    setPlacing(true);
    const { order, error } = await createOrderFromCart(items, p, user.email ?? "");
    if (error || !order) {
      setError(error ?? "Could not place the order.");
      setPlacing(false);
      setPhase("cart");
      return;
    }
    clearCart();
    router.push(`/account/orders/${order.order_number}`);
  }

  return (
    <div className="pt-28 md:pt-32 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Continue shopping
        </Link>

        <header className="mb-10">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Your cart</span>
          <h1 className="text-display text-[clamp(2.5rem,5vw,4rem)] mt-3 leading-[0.98]">
            {count === 0 ? "Empty for now." : `${count} item${count === 1 ? "" : "s"}.`}
          </h1>
        </header>

        {items.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] p-10 max-w-2xl">
            <ShoppingBag size={32} strokeWidth={1.4} className="text-[var(--color-burgundy-700)]" />
            <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Your cart is empty. Browse the libraries to find a piece, or design your own commission.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/library/tailoring"
                className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
              >
                Browse the house <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link
                href="/customize"
                className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-6 py-3 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
              >
                Design your own
              </Link>
            </div>
          </div>
        ) : phase === "cart" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16">
            {/* Line items */}
            <div className="space-y-6">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex gap-5 border-b border-black/10 pb-6"
                >
                  <Link
                    href={it.href}
                    className={`relative shrink-0 w-28 h-28 md:w-32 md:h-32 overflow-hidden bg-[var(--color-ivory-200)] hover-grow`}
                  >
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      sizes="128px"
                      className={it.contain ? "object-contain p-3" : "object-cover"}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">{it.type}</span>
                    <Link
                      href={it.href}
                      className="block text-display text-[1.25rem] mt-1 leading-tight text-[var(--color-charcoal-900)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      {it.name}
                    </Link>
                    {it.custom && (
                      <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-1.5">
                        Custom {it.custom.category}
                        {it.custom.tier ? ` · ${it.custom.tier}` : ""}
                        {it.custom.fabric ? ` · ${it.custom.fabric}` : ""}
                      </p>
                    )}

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="inline-flex items-center border border-black/15">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(it.id, it.qty - 1)}
                          className="px-2.5 py-2 hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          <Minus size={12} strokeWidth={1.5} />
                        </button>
                        <span className="px-3 text-[0.9rem] tabular-nums">{it.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQty(it.id, it.qty + 1)}
                          className="px-2.5 py-2 hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          <Plus size={12} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-display text-[1.1rem] text-[var(--color-charcoal-900)]">
                          {fmt(it.priceNum * it.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(it.id)}
                          className="block ml-auto mt-2 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 size={11} strokeWidth={1.5} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 self-start border border-black/10 p-6 lg:p-8 bg-[var(--color-ivory-200)]">
              <h2 className="text-eyebrow text-[var(--color-charcoal-500)]">Order summary</h2>
              <div className="mt-5 space-y-3 text-[0.9rem]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-charcoal-500)]">Subtotal</span>
                  <span className="text-[var(--color-charcoal-900)]">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-charcoal-500)]">Delivery</span>
                  <span className="text-[var(--color-charcoal-900)]">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-black/10 flex justify-between items-baseline">
                <span className="text-eyebrow text-[var(--color-charcoal-900)]">Total</span>
                <span className="text-display text-[1.5rem] text-[var(--color-burgundy-700)]">{fmt(subtotal)}</span>
              </div>

              <button
                type="button"
                onClick={startCheckout}
                disabled={placing || authLoading}
                className="mt-7 w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
              >
                {placing ? "Placing order…" : <>Place order <ArrowRight size={14} strokeWidth={1.5} /></>}
              </button>

              {error && (
                <p className="mt-3 text-[0.8rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
                  {error}
                </p>
              )}

              <p className="mt-4 text-[0.72rem] text-[var(--color-charcoal-500)] leading-relaxed">
                You&rsquo;ll sign in (or create an account) at checkout to save your pattern on file.
                Secure payment will be added soon — your atelier will confirm by email.
              </p>
            </aside>
          </div>
        ) : null}

        {/* ── Sign-in gate ── */}
        {phase === "auth" && (
          <div className="max-w-md mx-auto mt-10 border border-black/10 p-6 lg:p-8">
            <h2 className="text-display text-[1.5rem] leading-tight">Sign in to complete your order.</h2>
            <p className="mt-2 text-[0.85rem] text-[var(--color-charcoal-700)]">
              We&rsquo;ll save your pattern on file and confirm by email.
            </p>
            <div className="mt-6">
              <AuthForm />
            </div>
            <button type="button" onClick={() => setPhase("cart")} className="mt-6 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              ← Back to cart
            </button>
          </div>
        )}

        {/* ── Profile completion gate ── */}
        {phase === "profile" && user && (
          <div className="max-w-2xl mx-auto mt-10">
            <ProfileForm
              userId={user.id}
              initialName={(user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ?? ""}
              onSaved={(p) => { setProfile(p); placeOrder(p); }}
            />
            <button type="button" onClick={() => setPhase("cart")} className="mt-4 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              ← Back to cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
