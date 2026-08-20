import { describe, it, expect } from "vitest";
import {
  aesEncrypt, aesDecrypt, bhdAmount, newTrackId, parseInitResponse,
  parseNotification, isCaptured, buildInitPayload, CURRENCY_BHD, ACTION_PURCHASE,
  type BenefitConfig,
} from "@/lib/benefit";

// A dummy 32-char key, so AES-256. The real AFS terminal key is never
// committed: it lives only in .env.local as BENEFIT_RESOURCE_KEY. These
// tests exercise the encoding, which does not care which key is used.
// Must not be "0".repeat(32): the wrong-key test below uses that as its
// deliberately-wrong key, and the two matching would make it pass falsely.
const KEY = "TESTRESOURCEKEYTESTRESOURCEKEY12";
const CFG: BenefitConfig = {
  endpoint: "https://test.benefit-gateway.bh/payment/API/hosted.htm",
  tranportalId: "00000000",
  tranportalPassword: "00000000",
  resourceKey: KEY,
};

describe("AES (their scheme: 256-CBC, PKCS7, fixed IV, hex upper)", () => {
  it("round-trips a trandata payload", () => {
    const plain = JSON.stringify([{ amt: "192.500", trackId: "123456789012345" }]);
    expect(aesDecrypt(aesEncrypt(plain, KEY), KEY)).toBe(plain);
  });

  it("emits uppercase hex, and a whole number of 16-byte blocks", () => {
    const hex = aesEncrypt("hello", KEY);
    expect(hex).toMatch(/^[0-9A-F]+$/);
    expect(hex.length % 32).toBe(0);
  });

  it("is deterministic, because the IV is fixed by the gateway", () => {
    expect(aesEncrypt("same", KEY)).toBe(aesEncrypt("same", KEY));
  });

  it("survives the URL characters our payload actually carries", () => {
    const plain = JSON.stringify([{ responseURL: "https://hiltonmtm.com/api/payments/benefit/notify?x=1&y=2" }]);
    expect(aesDecrypt(aesEncrypt(plain, KEY), KEY)).toBe(plain);
  });

  it("fails loudly on the wrong key rather than returning junk", () => {
    const hex = aesEncrypt("secret", KEY);
    expect(() => aesDecrypt(hex, "0".repeat(32))).toThrow();
  });
});

describe("bhdAmount", () => {
  it("always emits 3 decimals, because BHD has 3", () => {
    expect(bhdAmount(12)).toBe("12.000");
    expect(bhdAmount(192.5)).toBe("192.500");
    expect(bhdAmount(0.001)).toBe("0.001");
  });
  it("refuses non-positive or non-finite amounts", () => {
    expect(() => bhdAmount(0)).toThrow();
    expect(() => bhdAmount(-5)).toThrow();
    expect(() => bhdAmount(NaN)).toThrow();
  });
});

describe("newTrackId", () => {
  it("is 15 digits, since the spec types trackId Numeric", () => {
    expect(newTrackId()).toMatch(/^\d{15}$/);
  });
  it("stays numeric even when the RNG returns its extremes", () => {
    expect(newTrackId(() => 0)).toMatch(/^\d{15}$/);
    expect(newTrackId(() => 0.9999999)).toMatch(/^\d{15}$/);
  });
});

describe("parseInitResponse", () => {
  it("keeps the https:// intact when splitting paymentId from URL", () => {
    // The regression this guards: result is "<id>:<url>" and the url itself
    // contains a colon, so a naive split(":") loses the scheme.
    const r = parseInitResponse([{
      status: "1",
      result: "100201931620827468:https://test.benefit-gateway.bh",
      error: null, errorText: null,
    }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.paymentId).toBe("100201931620827468");
    expect(r.redirectUrl).toBe("https://test.benefit-gateway.bh?PaymentID=100201931620827468");
  });

  it("accepts the finished URL the LIVE gateway actually returns", () => {
    // Captured from their UAT terminal 2026-08-20. The guide documents
    // "<id>:<baseUrl>" but the real terminal sends a complete URL, and reading
    // only the documented shape would treat every success as malformed.
    const r = parseInitResponse([{
      result: "https://test.benefit-gateway.bh/payment/paymentpage.htm?PaymentID=158202623275183744",
      status: "1",
    }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.paymentId).toBe("158202623275183744");
    expect(r.redirectUrl).toBe(
      "https://test.benefit-gateway.bh/payment/paymentpage.htm?PaymentID=158202623275183744",
    );
  });

  it("rejects a live-shape URL carrying no PaymentID", () => {
    expect(parseInitResponse([{ status: "1", result: "https://test.benefit-gateway.bh/payment/x.htm" }]).ok)
      .toBe(false);
  });

  it("surfaces the gateway's own error text on status 2", () => {
    const r = parseInitResponse([{
      status: "2", error: "IPAY0100124",
      errorText: "Problem occurred while validating transaction data", result: null,
    }]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("IPAY0100124");
    expect(r.error).toContain("validating transaction data");
  });

  it("rejects a result with no URL, rather than redirecting nowhere", () => {
    expect(parseInitResponse([{ status: "1", result: "100201931620827468" }]).ok).toBe(false);
    expect(parseInitResponse([{ status: "1", result: "" }]).ok).toBe(false);
  });

  it("rejects a non-https redirect target", () => {
    expect(parseInitResponse([{ status: "1", result: "123:javascript:alert(1)" }]).ok).toBe(false);
    expect(parseInitResponse([{ status: "1", result: "123:http://evil.test" }]).ok).toBe(false);
  });

  it("handles a bare object as well as their documented array", () => {
    expect(parseInitResponse({ status: "1", result: "9:https://x.test" }).ok).toBe(true);
  });

  it("does not throw on rubbish", () => {
    expect(parseInitResponse(null).ok).toBe(false);
    expect(parseInitResponse("nope").ok).toBe(false);
    expect(parseInitResponse([]).ok).toBe(false);
  });
});

describe("parseNotification + isCaptured", () => {
  const captured = [{
    paymentId: "100201935166676976", result: "CAPTURED", ref: "935110000001",
    transId: "201935166561122", date: "1217", trackId: "1003383844",
    udf1: "", udf2: "", udf3: "8870091137", udf4: "FC", udf5: "Tidal5",
    amt: "70.0", authRespCode: "00", authCode: "000000",
  }];

  it("decrypts and reads their documented notification", () => {
    const n = parseNotification(aesEncrypt(JSON.stringify(captured), KEY), KEY);
    expect(n).not.toBeNull();
    expect(n!.paymentId).toBe("100201935166676976");
    expect(n!.trackId).toBe("1003383844");
    expect(n!.transId).toBe("201935166561122");
    expect(isCaptured(n!)).toBe(true);
  });

  it("accepts the lowercase 'captured' their other sample uses", () => {
    const n = parseNotification(aesEncrypt(JSON.stringify([{ ...captured[0], result: "captured" }]), KEY), KEY);
    expect(isCaptured(n!)).toBe(true);
  });

  it("treats a decline as NOT captured, whatever the wording", () => {
    for (const [result, authRespCode] of [
      ["NOT CAPTURED", "51"], ["DENIED BY RISK", "00"], ["CANCELED", "00"], ["", "00"],
    ] as const) {
      const n = parseNotification(aesEncrypt(JSON.stringify([{ ...captured[0], result, authRespCode }]), KEY), KEY);
      expect(isCaptured(n!), `${result}/${authRespCode} must not count as paid`).toBe(false);
    }
  });

  it("treats CAPTURED with a non-00 auth code as NOT paid", () => {
    const n = parseNotification(aesEncrypt(JSON.stringify([{ ...captured[0], authRespCode: "05" }]), KEY), KEY);
    expect(isCaptured(n!)).toBe(false);
  });

  it("returns null on a forged or corrupt trandata instead of throwing", () => {
    expect(parseNotification("DEADBEEF", KEY)).toBeNull();
    expect(parseNotification("", KEY)).toBeNull();
    expect(parseNotification(aesEncrypt("not json", KEY), KEY)).toBeNull();
    expect(parseNotification(aesEncrypt(JSON.stringify([{ result: "CAPTURED" }]), KEY), KEY)).toBeNull();
  });
});

describe("buildInitPayload", () => {
  const args = {
    amount: 192.5,
    trackId: "123456789012345",
    responseUrl: "https://hiltonmtm.com/api/payments/benefit/notify",
    errorUrl: "https://hiltonmtm.com/api/payments/benefit/notify",
  };

  it("encrypts every mandatory field the spec lists", () => {
    const { id, trandata } = buildInitPayload(CFG, args);
    expect(id).toBe(CFG.tranportalId);
    const sent = JSON.parse(aesDecrypt(trandata, KEY))[0];
    expect(sent.amt).toBe("192.500");
    expect(sent.action).toBe(ACTION_PURCHASE);
    expect(sent.currencycode).toBe(CURRENCY_BHD);
    expect(sent.id).toBe(CFG.tranportalId);
    expect(sent.password).toBe(CFG.tranportalPassword);
    expect(sent.trackId).toBe(args.trackId);
    expect(sent.responseURL).toBe(args.responseUrl);
    expect(sent.errorURL).toBe(args.errorUrl);
  });

  it("sends the user-defined fields blank rather than omitting them", () => {
    const sent = JSON.parse(aesDecrypt(buildInitPayload(CFG, args).trandata, KEY))[0];
    for (const k of ["udf1", "udf2", "udf3", "udf4", "udf5"]) {
      expect(sent, `${k} must be present`).toHaveProperty(k);
      expect(sent[k]).toBe("");
    }
  });

  it("never leaks the tranportal password in plaintext", () => {
    expect(buildInitPayload(CFG, args).trandata).not.toContain(CFG.tranportalPassword);
  });

  it("refuses a callback URL over their 254-character limit", () => {
    expect(() => buildInitPayload(CFG, { ...args, responseUrl: "https://hiltonmtm.com/" + "a".repeat(250) }))
      .toThrow(/254/);
  });

  it("refuses to build a zero or negative charge", () => {
    expect(() => buildInitPayload(CFG, { ...args, amount: 0 })).toThrow();
    expect(() => buildInitPayload(CFG, { ...args, amount: -1 })).toThrow();
  });
});
