"use client";

/**
 * Embedded MPGS hosted-checkout panel. Given a session id, it loads
 * Mastercard's checkout.js and renders their payment form inside an overlay on
 * our own page. Card data is entered on Mastercard's iframe, never our DOM.
 *
 * On completion MPGS redirects the parent window to the session's returnUrl
 * (/checkout/return), so this component doesn't handle success itself — it only
 * shows the form and a Cancel that returns the customer to the cart.
 */
import { useEffect, useRef, useState } from "react";

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

export default function MpgsCheckout({ sessionId, onCancel }: { sessionId: string; onCancel: () => void }) {
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
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
      <div className="w-full max-w-xl bg-[var(--color-ivory-100)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <span className="text-eyebrow text-[0.7rem] text-[var(--color-charcoal-600)]">Secure card payment</span>
          <button type="button" onClick={onCancel} className="text-eyebrow text-[0.7rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
            Cancel
          </button>
        </div>
        {error ? (
          <div className="px-6 py-8 text-sm text-[var(--color-burgundy-700)]">
            {error}
            <button type="button" onClick={onCancel} className="mt-4 block text-eyebrow text-[0.7rem] underline">Back to cart</button>
          </div>
        ) : (
          <div id="mpgs-embed" className="min-h-[28rem] px-2 py-2" />
        )}
      </div>
    </div>
  );
}
