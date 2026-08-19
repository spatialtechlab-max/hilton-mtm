/**
 * The rate limiter is the only thing standing between the admin password and
 * an unlimited guessing loop, and between the OpenRouter balance and a
 * stranger. It shipped untested; this covers it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";

// Unique key per test so the module-level bucket map cannot leak between them.
let n = 0;
const key = () => `test-key-${++n}-${Math.random()}`;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows exactly the limit, then refuses", () => {
    const k = key();
    for (let i = 0; i < 5; i++) expect(rateLimit(k, 5, 60_000).ok).toBe(true);
    expect(rateLimit(k, 5, 60_000).ok).toBe(false);
  });

  it("reports how long to wait", () => {
    const k = key();
    for (let i = 0; i < 3; i++) rateLimit(k, 3, 60_000);
    const blocked = rateLimit(k, 3, 60_000);
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("lets the caller back in once the window passes", () => {
    const k = key();
    for (let i = 0; i < 3; i++) rateLimit(k, 3, 60_000);
    expect(rateLimit(k, 3, 60_000).ok).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit(k, 3, 60_000).ok).toBe(true);
  });

  it("does not let one caller's usage block another", () => {
    const a = key(), b = key();
    for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);
    expect(rateLimit(a, 5, 60_000).ok).toBe(false);
    // A different key is a different bucket entirely.
    expect(rateLimit(b, 5, 60_000).ok).toBe(true);
  });

  it("counts a limit of one correctly", () => {
    const k = key();
    expect(rateLimit(k, 1, 60_000).ok).toBe(true);
    expect(rateLimit(k, 1, 60_000).ok).toBe(false);
  });

  it("keeps refusing while the window is open, not just once", () => {
    const k = key();
    rateLimit(k, 1, 60_000);
    for (let i = 0; i < 10; i++) expect(rateLimit(k, 1, 60_000).ok).toBe(false);
  });
});

describe("clientIp", () => {
  const req = (h: Record<string, string>) => new Request("https://hiltonmtm.com/", { headers: h });

  it("prefers X-Real-IP, which nginx sets and a client cannot forge past it", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to the first hop of X-Forwarded-For", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.9");
  });

  it("ignores a forged X-Forwarded-For when X-Real-IP is present", () => {
    // Otherwise anyone could reset their own counter by adding a header.
    const r = req({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1" });
    expect(clientIp(r)).toBe("203.0.113.7");
  });

  it("returns a stable placeholder when neither header exists", () => {
    // Must not return empty, or every anonymous caller would share one bucket
    // by accident and legitimate users would block each other.
    expect(clientIp(req({}))).toBe("unknown");
  });

  it("trims whitespace so ' 1.2.3.4' and '1.2.3.4' are one bucket", () => {
    expect(clientIp(req({ "x-real-ip": "  203.0.113.7  " }))).toBe("203.0.113.7");
  });
});

describe("tooMany", () => {
  it("returns 429 with Retry-After so clients back off", async () => {
    const res = tooMany(42);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(res.headers.get("content-type")).toContain("application/json");
    expect((await res.json()).error).toBeTruthy();
  });

  it("carries a custom message when one is given", async () => {
    const res = tooMany(10, "Too many sign-in attempts.");
    expect((await res.json()).error).toBe("Too many sign-in attempts.");
  });
});
