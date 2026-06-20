"use client";

/**
 * BenefitPay checkout panel — FRONTEND ONLY for now.
 *
 * The visual flow (brand, amount, scan-to-pay screen) is built so the option
 * is real on the storefront, but it does not yet move money: the live Benefit
 * rail is pending the merchant's BenefitPay activation with AFS/Benefit. Until
 * those credentials land there is no /api/payments/benefit/* route to call, so
 * this panel shows the intended experience and offers card as the live path.
 *
 * When the Benefit test account arrives, wire a session route the same way as
 * MPGS (mint a Benefit order, render their QR / app-redirect), and drop the
 * "preview" note + the pay-by-card fallback.
 */
import { Smartphone, X, QrCode } from "lucide-react";
import { BenefitPayMark } from "@/components/PaymentMarks";

function fmtBhd(n: number): string {
  return `BHD ${n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export default function BenefitPayCheckout({
  amount, onClose, onPayByCard,
}: {
  amount?: number | null;
  onClose: () => void;
  onPayByCard: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[var(--color-charcoal-900)]/70 px-4 py-8 backdrop-blur-md md:py-12">
      <div className="w-full max-w-lg overflow-hidden bg-[var(--color-ivory-100)] shadow-[0_40px_120px_-30px_rgba(40,20,24,0.7)]">
        {/* Brand accent rule (Benefit red) */}
        <div className="h-[3px] w-full bg-[#E4022E]" />

        {/* Header: brand + amount */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#E4022E]"><Smartphone size={16} strokeWidth={1.5} /></span>
            <div>
              <p className="text-eyebrow text-[0.6rem] tracking-[0.22em] text-[var(--color-charcoal-400)]">Pay with</p>
              <BenefitPayMark className="mt-1.5 h-10 w-auto" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close BenefitPay"
              className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center text-[var(--color-charcoal-400)] transition-colors hover:text-[var(--color-burgundy-700)]"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
            {amount != null && (
              <div className="text-right">
                <p className="text-eyebrow text-[0.55rem] tracking-[0.2em] text-[var(--color-charcoal-400)]">Amount</p>
                <p className="text-display text-[1.2rem] leading-none text-[#E4022E]">{fmtBhd(amount)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan-to-pay screen */}
        <div className="px-7 pb-2">
          <div className="flex flex-col items-center border border-black/[0.07] bg-white px-6 py-8 text-center shadow-[0_2px_18px_-8px_rgba(40,20,24,0.25)]">
            <div className="flex h-44 w-44 items-center justify-center border border-dashed border-[#E4022E]/40 bg-[#E4022E]/[0.04]">
              <QrCode size={92} strokeWidth={1} className="text-[#E4022E]/70" />
            </div>
            <p className="mt-5 text-[0.95rem] font-medium text-[var(--color-charcoal-900)]">
              Open the BenefitPay app and scan to pay
            </p>
            <p className="mt-1.5 text-[0.78rem] leading-relaxed text-[var(--color-charcoal-500)]">
              Or confirm the request on your phone if BenefitPay is already signed in.
            </p>
          </div>
        </div>

        {/* Honest preview note + live fallback */}
        <div className="px-7 pb-7 pt-4">
          <p className="text-center text-[0.72rem] leading-relaxed text-[var(--color-charcoal-500)]">
            Preview — BenefitPay goes live here once Hilton&rsquo;s activation with Benefit completes.
            To check out today, pay by card.
          </p>
          <button
            type="button"
            onClick={onPayByCard}
            className="mt-4 w-full text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3.5 transition-colors hover:bg-[var(--color-burgundy-800)]"
          >
            Pay by card instead
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-eyebrow text-[0.7rem] text-[var(--color-charcoal-500)] transition-colors hover:text-[var(--color-burgundy-700)]"
          >
            Back to cart
          </button>
        </div>
      </div>
    </div>
  );
}
