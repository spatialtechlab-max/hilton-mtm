import type { NextConfig } from "next";

/** Supabase now runs on our own VPS behind api.hiltonmtm.com. The old
 *  gendynufrwpriiaasibk.supabase.co project is being decommissioned; it stays
 *  listed only so any still-cached page referencing it keeps rendering during
 *  the changeover, and can be removed once that project is deleted. */
const SUPABASE_HOST = "api.hiltonmtm.com";
const LEGACY_SUPABASE_HOST = "gendynufrwpriiaasibk.supabase.co";

const nextConfig: NextConfig = {
  // Don't advertise the framework and version to anyone scanning.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "erp.hiltontailoringhouse.com" },
      { protocol: "https", hostname: SUPABASE_HOST },
      { protocol: "https", hostname: LEGACY_SUPABASE_HOST },
    ],
    // ERP product photos are already tight JPEGs (~24 KB). The default
    // q=75 re-compression was visibly pixelating them, so renderers
    // explicitly request quality={95} via the prop. Next 15 only honours
    // qualities listed here.
    qualities: [75, 95],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },

  /**
   * Security headers. The site takes card details through an embedded
   * Mastercard checkout, so these are not decoration.
   *
   * Deliberately NOT setting Content-Security-Policy here yet: the checkout
   * injects a script and an iframe from afs.gateway.mastercard.com, images come
   * from three hosts, and Tailwind emits inline styles. A CSP written blind
   * would break payment, which is worse than not having one. It wants a
   * measured pass with a report endpoint. frame-ancestors, the part that
   * actually stops clickjacking, is covered by X-Frame-Options below.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Tell browsers to refuse plain HTTP for a year. Only safe now that
          // every hostname has a certificate.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Nobody should be framing the storefront. Stops clickjacking of the
          // admin screens and the cart in particular.
          { key: "X-Frame-Options", value: "DENY" },
          // Stop the browser second-guessing declared content types, which is
          // how an uploaded image becomes executable script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak full URLs (order numbers, SKUs) to third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The storefront needs none of these. `payment` is deliberately NOT
          // disabled: the Payment Request API is what wallet flows (Apple Pay,
          // Google Pay, and the BenefitPay integration still to come) rely on.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // /process was the original slug; the nav labels it "Made to Measure"
  // and the URL is now /made-to-measure to match. Keep the legacy path
  // redirecting so any bookmark / shared link still resolves.
  async redirects() {
    return [
      { source: "/process", destination: "/made-to-measure", permanent: true },
    ];
  },
};

export default nextConfig;
