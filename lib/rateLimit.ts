/**
 * Fixed-window rate limiting for the unauthenticated endpoints.
 *
 * WHY: four routes were reachable by anyone, unlimited.
 *
 *   /api/auth/login-otp/start   verified a password on every call, so it was
 *                               an unthrottled brute-force oracle against the
 *                               admin, operator and staff accounts
 *   /api/concierge/chat         reached OpenRouter without a session, so a
 *                               stranger could spend the atelier's balance
 *   /api/notify/password-reset  sent mail to any address on demand
 *   /api/discount-codes/validate  let the 5-character code space be enumerated
 *
 * Deliberately in-memory. The site runs as a single PM2 process on one box, so
 * a shared Map is accurate, needs no schema and cannot itself become a
 * bottleneck or an outage. The trade-off is that counters reset if the process
 * restarts, which an attacker cannot trigger. If this ever runs on more than
 * one instance this has to move to Postgres or Redis, because per-instance
 * counters would multiply the real limit by the instance count.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Keep the map from growing without bound on a long-lived process.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * @param key      what we're counting, e.g. `otp-start:1.2.3.4`
 * @param limit    how many are allowed in the window
 * @param windowMs how long the window lasts
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

/**
 * Caller's IP. nginx sits in front and sets both of these; we prefer X-Real-IP
 * because X-Forwarded-For can be a client-supplied list. Taking the FIRST entry
 * of a client-supplied XFF would let anyone reset their own counter by sending
 * a fake header, so it is only a fallback and only its first hop is used.
 */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

/** 429 with the standard Retry-After, so well-behaved clients back off. */
export function tooMany(retryAfter: number, message = "Too many requests. Please wait a moment and try again.") {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
