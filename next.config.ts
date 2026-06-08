import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "erp.hiltontailoringhouse.com" },
      { protocol: "https", hostname: "gendynufrwpriiaasibk.supabase.co" },
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
