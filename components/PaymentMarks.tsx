/**
 * Small inline-SVG brand marks for the checkout payment-method picker.
 *
 * These are self-contained (no external assets, no network) so they render
 * instantly and can't break the build. The card-network marks are the
 * standard acceptance logos used to indicate which cards are taken.
 *
 * The BenefitPay mark is a placeholder wordmark in the brand teal — swap it
 * for Benefit's official supplied SVG once George shares the brand kit.
 */

type MarkProps = { className?: string };

export function VisaMark({ className = "h-5 w-auto" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 38 24" role="img" aria-label="Visa" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" fill="#1434CB" stroke="#000" strokeOpacity="0.08" />
      <text x="19" y="16" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fontSize="11" letterSpacing="0.5" fill="#fff">
        VISA
      </text>
    </svg>
  );
}

export function MastercardMark({ className = "h-5 w-auto" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 38 24" role="img" aria-label="Mastercard" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" fill="#fff" stroke="#000" strokeOpacity="0.1" />
      <circle cx="15" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="23" cy="12" r="6.5" fill="#F79E1B" />
      {/* Overlap drawn as the orange circle clipped to the red one. */}
      <clipPath id="mc-overlap">
        <circle cx="15" cy="12" r="6.5" />
      </clipPath>
      <circle cx="23" cy="12" r="6.5" fill="#FF5F00" clipPath="url(#mc-overlap)" />
    </svg>
  );
}

export function AmexMark({ className = "h-5 w-auto" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 38 24" role="img" aria-label="American Express" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" fill="#1F72CD" stroke="#000" strokeOpacity="0.08" />
      <text x="19" y="15" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="7" letterSpacing="0.3" fill="#fff">
        AMEX
      </text>
    </svg>
  );
}

/** Placeholder BenefitPay wordmark — replace with the official brand SVG. */
export function BenefitPayMark({ className = "h-5 w-auto" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 104 24" role="img" aria-label="BenefitPay" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="3" width="18" height="18" rx="5" fill="#00A6A0" />
      <text x="9" y="16.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="12" fill="#fff">
        b
      </text>
      <text x="24" y="17" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="13" letterSpacing="0.2">
        <tspan fill="#1F2A37">benefit</tspan>
        <tspan fill="#00A6A0">pay</tspan>
      </text>
    </svg>
  );
}
