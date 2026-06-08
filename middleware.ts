import { NextResponse, type NextRequest } from "next/server";

/**
 * Apex domain takeover. Until launch, requests to the production
 * domain (hiltonmtm.com / www.hiltonmtm.com) are rewritten to the
 * /coming-soon page so visitors see the brochure shell, not the
 * in-progress storefront. Every other host — the existing
 * hilton-mtm-virid.vercel.app preview URL, any *.vercel.app, any
 * subdomain like preview.hiltonmtm.com, localhost — passes through
 * untouched so the team keeps working as normal.
 *
 * Launch day: delete this middleware (or the APEX_DOMAINS list below)
 * and traffic to the apex flows straight into the real storefront.
 */
const APEX_DOMAINS = new Set([
  "hiltonmtm.com",
  "www.hiltonmtm.com",
]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (!APEX_DOMAINS.has(host)) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // Already on the coming-soon page or fetching its assets — let it through.
  if (pathname.startsWith("/coming-soon")) return NextResponse.next();

  // Rewrite (not redirect) so the URL bar still reads hiltonmtm.com.
  const url = req.nextUrl.clone();
  url.pathname = "/coming-soon";
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, static files, and API routes so they continue
  // to serve assets to the coming-soon page itself (logo, fonts) and
  // don't accidentally rewrite admin / form endpoints if anyone hits
  // them via the apex.
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)"],
};
