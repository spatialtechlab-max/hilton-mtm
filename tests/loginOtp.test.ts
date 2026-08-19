/**
 * The pure half of the login OTP: code generation, hashing, email
 * normalisation and JWT session-id extraction. These decide whether a code can
 * be guessed, whether the stored hash leaks the code, and whether a verified
 * session is correctly recognised. Untested until now.
 *
 * The database-touching half (issueOtp, consumeOtp, verifyPassword) is covered
 * end to end against the live stack instead, since mocking GoTrue would prove
 * little.
 */
import { describe, it, expect } from "vitest";
import { normaliseEmail, generateOtp, hashOtp, sessionIdFromAccessToken, OTP_TTL_MS, RELAY_OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "@/lib/loginOtp";

describe("normaliseEmail", () => {
  it("lowercases and trims, so one account is one bucket", () => {
    expect(normaliseEmail("  Admin@HiltonMTM.com ")).toBe("admin@hiltonmtm.com");
  });

  it("makes case variants collide, so a rate limit cannot be dodged by capitalising", () => {
    expect(normaliseEmail("ADMIN@HILTONMTM.COM")).toBe(normaliseEmail("admin@hiltonmtm.com"));
  });
});

describe("generateOtp", () => {
  it("is always six digits, zero-padded", () => {
    for (let i = 0; i < 500; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("spans the whole 000000-999999 range rather than clustering", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(generateOtp());
    // Random draws from a million values: 2000 draws should be nearly all
    // distinct. Anything clustered would mean a much smaller real key space.
    expect(seen.size).toBeGreaterThan(1900);
  });

  it("does not repeat the previous code back to back", () => {
    let repeats = 0, prev = generateOtp();
    for (let i = 0; i < 1000; i++) {
      const next = generateOtp();
      if (next === prev) repeats++;
      prev = next;
    }
    expect(repeats).toBeLessThan(3);
  });
});

describe("hashOtp", () => {
  it("is deterministic for the same email and code", () => {
    expect(hashOtp("a@b.com", "123456")).toBe(hashOtp("a@b.com", "123456"));
  });

  it("never returns the code itself, so a leaked row does not reveal it", () => {
    const h = hashOtp("a@b.com", "123456");
    expect(h).not.toContain("123456");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("binds the code to the email, so a code for one account cannot be replayed on another", () => {
    expect(hashOtp("a@b.com", "123456")).not.toBe(hashOtp("c@d.com", "123456"));
  });

  it("changes completely for a one-digit difference", () => {
    const a = hashOtp("a@b.com", "123456");
    const b = hashOtp("a@b.com", "123457");
    expect(a).not.toBe(b);
  });

  it("normalises the email first, so casing does not break verification", () => {
    expect(hashOtp("A@B.com", "123456")).toBe(hashOtp("a@b.com", "123456"));
  });

  it("tolerates whitespace around a code typed by a customer", () => {
    expect(hashOtp("a@b.com", " 123456 ")).toBe(hashOtp("a@b.com", "123456"));
  });
});

describe("sessionIdFromAccessToken", () => {
  const jwt = (payload: object) =>
    `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

  it("reads the session id from a well-formed token", () => {
    expect(sessionIdFromAccessToken(jwt({ session_id: "abc-123" }))).toBe("abc-123");
  });

  it("returns null when the claim is absent rather than throwing", () => {
    expect(sessionIdFromAccessToken(jwt({ sub: "user" }))).toBeNull();
  });

  it("returns null on malformed input instead of crashing the request", () => {
    expect(sessionIdFromAccessToken("not-a-jwt")).toBeNull();
    expect(sessionIdFromAccessToken("")).toBeNull();
    expect(sessionIdFromAccessToken("a.b.c")).toBeNull();
  });

  it("handles base64url tokens containing - and _", () => {
    const payload = { session_id: "s-1", note: "??~~??" };
    expect(sessionIdFromAccessToken(jwt(payload))).toBe("s-1");
  });

  it("ignores a non-string session_id", () => {
    expect(sessionIdFromAccessToken(jwt({ session_id: 42 }))).toBeNull();
  });
});

describe("OTP policy constants", () => {
  it("expires an emailed code after 60 minutes", () => {
    // Pinned so any change to the window is a deliberate decision rather than
    // a silent drift. 60 minutes is longer than the 5-15 typical of emailed
    // one-time codes; it is safe here only because OTP_MAX_ATTEMPTS caps
    // guessing at 5 against a million-value space. Worth shortening, but that
    // is a policy call for the atelier, not something to change unannounced.
    expect(OTP_TTL_MS).toBe(60 * 60_000);
  });

  it("gives the admin-relayed staff code a short 10-minute life", () => {
    expect(RELAY_OTP_TTL_MS).toBe(10 * 60_000);
  });

  it("caps guessing well below the 6-digit key space", () => {
    expect(OTP_MAX_ATTEMPTS).toBeGreaterThan(0);
    expect(OTP_MAX_ATTEMPTS).toBeLessThanOrEqual(10);
  });
});
