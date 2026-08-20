/**
 * Where BENEFIT sends the customer once the payment is over.
 *
 * This page does NOT decide whether the payment succeeded, and it must not
 * create an order. The gateway's server-to-server notification is the only
 * authority, and it has already run by the time anyone gets here. All this does
 * is look up what the notification recorded and say so.
 *
 * That separation matters: the customer's browser is not a trustworthy witness
 * to a payment, and a customer who closes the tab still gets their order.
 */
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import ClearCartOnPaid from "./ClearCartOnPaid";

export const dynamic = "force-dynamic";

// Written out rather than reaching for a `btn-primary` helper: this project has
// no button classes in globals.css, every call to action is styled inline, and
// inventing a class here would silently render as unstyled text.
const PRIMARY =
  "text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] "
  + "text-[var(--color-ivory-100)] px-6 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors";
const GHOST =
  "text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] "
  + "text-[var(--color-burgundy-700)] px-6 py-3 hover:bg-[var(--color-burgundy-700)] "
  + "hover:text-[var(--color-ivory-100)] transition-colors";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Outcome = {
  tone: "paid" | "failed" | "pending";
  title: string;
  body: string;
  orderNumber?: string;
};

/**
 * The notification usually lands before the customer's redirect, but the two
 * are racing. If the pending row is still open, say so honestly rather than
 * claiming failure: the money may well have gone through a second later.
 */
async function resolve(trackId: string, state: string): Promise<Outcome> {
  if (!trackId || !SUPA_URL || !SERVICE) {
    return {
      tone: state === "paid" ? "pending" : "failed",
      title: state === "paid" ? "Confirming your payment" : "Payment not completed",
      body: state === "paid"
        ? "Give us a moment while the gateway confirms. Your order will appear in your account shortly."
        : "No payment was taken and your bag is untouched. You can try again whenever you are ready.",
    };
  }

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const { data: order } = await admin
    .from("mtm_orders")
    .select("order_number")
    .eq("payment_track_id", trackId)
    .maybeSingle();

  if (order?.order_number) {
    return {
      tone: "paid",
      orderNumber: String(order.order_number),
      title: "Thank you. Your commission is confirmed.",
      body: "We have emailed your confirmation. The atelier begins work now.",
    };
  }

  const { data: pending } = await admin
    .from("mtm_pending_checkouts")
    .select("status")
    .eq("track_id", trackId)
    .maybeSingle();

  if (pending?.status === "pending") {
    return {
      tone: "pending",
      title: "Confirming your payment",
      body: "The gateway is still finalising this. Refresh in a moment, or check your account: your order will appear there as soon as it clears.",
    };
  }

  if (pending?.status === "underpaid") {
    return {
      tone: "failed",
      title: "We could not confirm the full amount",
      body: "The amount captured did not match your bag, so we have not started the commission. Nothing further will be charged. Please contact the atelier and we will sort it out.",
    };
  }

  return {
    tone: "failed",
    title: "Payment not completed",
    body: "No payment was taken and your bag is untouched. You can try again whenever you are ready.",
  };
}

export default async function BenefitReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; state?: string }>;
}) {
  const { ref = "", state = "" } = await searchParams;
  const outcome = await resolve(ref, state);

  const Icon = outcome.tone === "paid" ? CheckCircle2 : outcome.tone === "pending" ? Clock : XCircle;
  const iconColor =
    outcome.tone === "paid" ? "text-[var(--color-burgundy-700)]"
      : outcome.tone === "pending" ? "text-[var(--color-charcoal-500)]"
        : "text-[var(--color-charcoal-700)]";

  return (
    <div className="pt-28 md:pt-32 pb-24 min-h-[70vh]">
      <div className="container-editorial max-w-xl">
        <ClearCartOnPaid paid={outcome.tone === "paid"} />

        <div className="border border-[var(--color-charcoal-200)] bg-white px-6 py-10 sm:px-10 text-center">
          <Icon size={40} strokeWidth={1} className={`mx-auto mb-5 ${iconColor}`} />

          <h1 className="text-[1.4rem] leading-snug text-[var(--color-charcoal-900)]">{outcome.title}</h1>

          <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--color-charcoal-500)]">{outcome.body}</p>

          {outcome.orderNumber && (
            <p className="mt-5 text-eyebrow text-[var(--color-charcoal-500)]">
              Order {outcome.orderNumber}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {outcome.tone === "paid" && outcome.orderNumber ? (
              <Link href={`/account/orders/${outcome.orderNumber}`} className={PRIMARY}>
                View your order
              </Link>
            ) : outcome.tone === "failed" ? (
              <Link href="/cart" className={PRIMARY}>Return to your bag</Link>
            ) : (
              <Link href="/account" className={PRIMARY}>Go to your account</Link>
            )}
            <Link href="/" className={GHOST}>Continue browsing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
