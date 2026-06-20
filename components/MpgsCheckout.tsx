"use client";

/**
 * Embedded MPGS hosted-checkout panel. Given a session id, it loads
 * Mastercard's checkout.js and renders their payment form inside an overlay on
 * our own page. Card data is entered on Mastercard's iframe, never our DOM.
 *
 * On completion MPGS redirects the parent window to the session's returnUrl
 * (/checkout/return), so this component doesn't handle success itself — it only
 * shows the form and a Cancel that returns the customer to the cart.
 *
 * We can't restyle the iframe's inner card fields (cross-origin), so the premium
 * feel comes from the frame around it: an ivory atelier panel with a burgundy
 * accent, the amount in display type, and a quiet line on how the card is handled.
 */
import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";

const CHECKOUT_JS =
  process.env.NEXT_PUBLIC_MPGS_CHECKOUT_JS ||
  "https://afs.gateway.mastercard.com/static/checkout/checkout.min.js";

type CheckoutGlobal = {
  configure: (opts: { session: { id: string } }) => void;
  showEmbeddedPage: (selector: string) => void;
};
declare global {
  interface Window { Checkout?: CheckoutGlobal }
}

function loadCheckoutJs(): Promise<CheckoutGlobal> {
  return new Promise((resolve, reject) => {
    if (window.Checkout) return resolve(window.Checkout);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_JS}"]`);
    const onReady = () => (window.Checkout ? resolve(window.Checkout) : reject(new Error("Checkout failed to load")));
    if (existing) { existing.addEventListener("load", onReady); existing.addEventListener("error", () => reject(new Error("Checkout failed to load"))); return; }
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.addEventListener("load", onReady);
    s.addEventListener("error", () => reject(new Error("Checkout failed to load")));
    document.head.appendChild(s);
  });
}

function fmtBhd(n: number): string {
  return `BHD ${n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export default function MpgsCheckout({
  sessionId, onCancel, amount,
}: {
  sessionId: string;
  onCancel: () => void;
  amount?: number | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    loadCheckoutJs()
      .then((Checkout) => {
        if (cancelled) return;
        Checkout.configure({ session: { id: sessionId } });
        // Defer one frame so the #mpgs-embed target is painted first.
        requestAnimationFrame(() => { try { Checkout.showEmbeddedPage("#mpgs-embed"); } catch (e) { setError(e instanceof Error ? e.message : "Could not start payment."); } });
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the payment form."); });
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[var(--color-charcoal-900)]/70 px-4 py-8 backdrop-blur-md md:py-12">
      <div className="w-full max-w-lg overflow-hidden bg-[var(--color-ivory-100)] shadow-[0_40px_120px_-30px_rgba(40,20,24,0.7)]">
        {/* Burgundy accent rule */}
        <div className="h-[3px] w-full bg-[var(--color-burgundy-700)]" />

        {/* Header: title + amount */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-[var(--color-burgundy-700)]"><Lock size={15} strokeWidth={1.5} /></span>
            <div>
              <p className="text-eyebrow text-[0.6rem] tracking-[0.22em] text-[var(--color-charcoal-400)]">Secure checkout</p>
              <p className="text-display text-[1.35rem] leading-tight text-[var(--color-charcoal-900)]">Card payment</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel payment"
              className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center text-[var(--color-charcoal-400)] transition-colors hover:text-[var(--color-burgundy-700)]"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
            {amount != null && (
              <div className="text-right">
                <p className="text-eyebrow text-[0.55rem] tracking-[0.2em] text-[var(--color-charcoal-400)]">Amount</p>
                <p className="text-display text-[1.2rem] leading-none text-[var(--color-burgundy-700)]">{fmtBhd(amount)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Body: Mastercard's form, framed on a white card */}
        {error ? (
          <div className="px-7 pb-8 text-sm leading-relaxed text-[var(--color-burgundy-700)]">
            {error}
            <button type="button" onClick={onCancel} className="mt-4 block text-eyebrow text-[0.7rem] underline">Back to cart</button>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <div className="border border-black/[0.07] bg-white shadow-[0_2px_18px_-8px_rgba(40,20,24,0.25)]">
              <div id="mpgs-embed" className="min-h-[27rem]" />
            </div>
          </div>
        )}

        {/* Trust line */}
        <div className="flex items-center gap-2.5 border-t border-black/[0.06] bg-[var(--color-ivory-200)]/50 px-7 py-4">
          <span className="shrink-0 text-[var(--color-charcoal-400)]"><Lock size={12} strokeWidth={1.5} /></span>
          <p className="text-[0.66rem] leading-relaxed text-[var(--color-charcoal-500)]">
            Card details are entered directly with Mastercard over an encrypted connection.
            Hilton never sees or stores your card number.
          </p>
        </div>
      </div>
    </div>
  );
}
