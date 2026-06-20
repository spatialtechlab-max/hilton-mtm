"use client";

/**
 * MPGS redirects the customer here after the embedded payment page completes.
 * We don't trust the redirect — we ask our server to RETRIEVE_ORDER and only
 * then is the order created. On success we clear the cart and forward to the
 * order. On anything else the cart is untouched and the customer can retry.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { clearCart } from "@/lib/cart";

type State = { phase: "checking" | "done" | "failed"; message?: string };

function ReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref") ?? "";
  const [state, setState] = useState<State>({ phase: "checking" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!ref) { setState({ phase: "failed", message: "Missing payment reference." }); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setState({ phase: "failed", message: "Your session expired. Please sign in and check your orders." }); return; }
      try {
        const res = await fetch("/api/payments/mpgs/verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ref }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.ok && body.orderNumber) {
          // Confirmation email — fire-and-forget.
          if (body.orderId) {
            fetch("/api/notify/order-confirmation", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: body.orderId }),
            }).catch(() => {});
          }
          clearCart();
          setState({ phase: "done" });
          router.replace(`/account/orders/${body.orderNumber}`);
        } else {
          setState({ phase: "failed", message: body?.error || "Payment wasn't completed. Your cart is still saved." });
        }
      } catch {
        setState({ phase: "failed", message: "We couldn't confirm the payment. Please check your orders." });
      }
    })();
  }, [ref, router]);

  return (
    <div className="pt-28 md:pt-32 pb-24 min-h-[70vh] container-editorial">
      {state.phase === "checking" && (
        <p className="text-display text-[1.4rem] text-[var(--color-charcoal-700)]">Confirming your payment…</p>
      )}
      {state.phase === "done" && (
        <p className="text-display text-[1.4rem] text-[var(--color-burgundy-700)]">Payment confirmed. Taking you to your order…</p>
      )}
      {state.phase === "failed" && (
        <div>
          <p className="text-display text-[1.4rem] text-[var(--color-charcoal-800)]">Payment not completed</p>
          <p className="mt-3 text-sm text-[var(--color-charcoal-600)]">{state.message}</p>
          <div className="mt-6 flex gap-4">
            <Link href="/cart" className="text-eyebrow text-[0.7rem] text-[var(--color-burgundy-700)] underline">Back to cart</Link>
            <Link href="/account" className="text-eyebrow text-[0.7rem] text-[var(--color-charcoal-500)] underline">My orders</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="pt-32 container-editorial text-sm text-[var(--color-charcoal-500)]">Loading…</div>}>
      <ReturnInner />
    </Suspense>
  );
}
