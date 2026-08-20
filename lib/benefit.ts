/**
 * BENEFIT Payment Gateway (Bahrain domestic debit) - server-side REST wrapper.
 *
 * This sits BESIDE lib/mpgs.ts, it does not replace it. MPGS handles
 * international Mastercard/Visa; BENEFIT is the local debit rail. The cart
 * offers both.
 *
 * WHY REST AND NOT THE PLUGIN
 * Chapter 3 of the integration guide describes a plugin route that needs a
 * Java/ASP/PHP binary plus `resource.cgn` and `KeyStore.bin` files downloaded
 * from their portal. None of that is usable from Node. Chapter 4 is a plain
 * REST API secured with AES, and the credentials AFS sent us (Tranportal ID,
 * Tranportal password, terminal resource key) are exactly the Chapter 4 set.
 * So we take the REST route and no portal download is required.
 *
 * THE SHAPE OF A PAYMENT
 *   1. POST [{ id, trandata }] to hosted.htm, where trandata is our request
 *      JSON, URL-encoded, then AES-encrypted to uppercase hex.
 *   2. They reply (in PLAIN text, not encrypted) with
 *      [{ status: "1", result: "<paymentId>:<paymentUrl>" }].
 *   3. We send the customer to `<paymentUrl>?PaymentID=<paymentId>`.
 *   4. They take the card details on their own page. Nothing card-related
 *      ever touches this server.
 *   5. They POST an encrypted `trandata` to our responseURL. We decrypt it,
 *      and reply with the literal text `REDIRECT=<where to send the customer>`.
 *   6. If we fail to acknowledge, THEY VOID THE TRANSACTION. See notes on the
 *      notify route: this is why that handler answers before doing db work.
 *
 * Guide: benefit-docs/BENEFIT Payment Gateway - Integration Guide v1.4.pdf,
 * chapter 4 (pages 39-57).
 */
import { createCipheriv, createDecipheriv } from "crypto";

/** Fixed by the gateway. Not a secret, and not ours to choose. */
const AES_IV = "PGKEYENCDECIVSPC";

/** action codes from the trandata spec (page 47). */
export const ACTION_PURCHASE = "1";
export const ACTION_REFUND = "2";
export const ACTION_VOID = "3";
export const ACTION_INQUIRY = "8";

/** ISO 4217 numeric for Bahraini dinar. BHD carries THREE decimals. */
export const CURRENCY_BHD = "048";

export type BenefitConfig = {
  endpoint: string;
  tranportalId: string;
  tranportalPassword: string;
  resourceKey: string;
};

/**
 * Read config from env. Returns null when unset so the route can answer a
 * clean 503 instead of throwing, matching getMpgsConfig().
 */
export function getBenefitConfig(): BenefitConfig | null {
  const endpoint = process.env.BENEFIT_ENDPOINT;
  const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
  const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
  const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
  if (!endpoint || !tranportalId || !tranportalPassword || !resourceKey) return null;
  // AES-256 needs a 32-byte key. Theirs is a 32-character ASCII string. If a
  // future terminal ships a 16-character key this must switch to aes-128-cbc,
  // so fail loudly rather than emit garbage the gateway will simply reject.
  if (resourceKey.length !== 32) {
    console.error(`[benefit] resource key is ${resourceKey.length} chars, expected 32`);
    return null;
  }
  return { endpoint, tranportalId, tranportalPassword, resourceKey };
}

/**
 * AES-256-CBC + PKCS7, hex out, upper-cased.
 *
 * The guide says to URL-encode the plaintext before encrypting and URL-decode
 * after decrypting. It is written against Java's URLEncoder, which is
 * form-encoding (space becomes "+"), whereas encodeURIComponent percent-encodes
 * it. Our payload is JSON containing URLs and no spaces in practice, so the two
 * agree on every byte we actually send. IF THE GATEWAY EVER REJECTS A REQUEST
 * AS MALFORMED, THIS IS THE FIRST THING TO SUSPECT.
 */
export function aesEncrypt(plain: string, key: string): string {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key, "utf8"), Buffer.from(AES_IV, "utf8"));
  const encoded = encodeURIComponent(plain);
  return Buffer.concat([cipher.update(encoded, "utf8"), cipher.final()]).toString("hex").toUpperCase();
}

/** Inverse of aesEncrypt. Throws on a bad key or corrupt payload. */
export function aesDecrypt(hex: string, key: string): string {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key, "utf8"), Buffer.from(AES_IV, "utf8"));
  const raw = Buffer.concat([decipher.update(Buffer.from(hex.trim(), "hex")), decipher.final()]).toString("utf8");
  return decodeURIComponent(raw);
}

/**
 * BHD is a 3-decimal currency. Sending "12.00" for a 12.005 total would
 * silently under-charge, so format explicitly rather than relying on the
 * caller having done it.
 */
export function bhdAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) throw new Error(`invalid amount: ${n}`);
  return n.toFixed(3);
}

/**
 * trackId is our own reference and the spec types it Numeric, so the
 * `hmtm<uuid-hex>` refs we mint for MPGS cannot be reused here. Digits only,
 * wide enough not to collide in practice, and stored on the pending row so the
 * notification can be matched back.
 */
export function newTrackId(rand: () => number = Math.random): string {
  let s = "";
  while (s.length < 15) s += Math.floor(rand() * 1e9).toString().padStart(9, "0");
  return s.slice(0, 15);
}

export type InitResult =
  | { ok: true; paymentId: string; redirectUrl: string }
  | { ok: false; error: string; code?: string };

/**
 * Parse the gateway's PLAIN (unencrypted) reply to the init call.
 *
 * TWO SHAPES, AND THE DOCUMENTED ONE IS NOT WHAT THE LIVE GATEWAY SENDS.
 *
 * Guide (page 41) documents:
 *   result: "100201931620827468:https://test.BENEFIT-Gateway.bh"
 * i.e. "<paymentId>:<baseUrl>", which the merchant then joins into
 * "<baseUrl>?PaymentID=<paymentId>".
 *
 * The live UAT terminal actually returns the finished URL:
 *   result: "https://test.benefit-gateway.bh/payment/paymentpage.htm?PaymentID=158202623275183744"
 *
 * Verified against their test endpoint on 2026-08-20. Parsing only the
 * documented shape would have treated every successful init as malformed,
 * because the leading "https" would be read as the payment ID. We accept both:
 * a bare URL is used as-is, and the legacy pair is still assembled.
 */
export function parseInitResponse(body: unknown): InitResult {
  const row = Array.isArray(body) ? body[0] : body;
  if (!row || typeof row !== "object") return { ok: false, error: "Unreadable gateway response." };
  const r = row as Record<string, unknown>;

  if (String(r.status) !== "1") {
    const code = r.error ? String(r.error) : undefined;
    const text = r.errorText ? String(r.errorText) : "The payment gateway rejected the request.";
    return { ok: false, error: text, code };
  }

  const result = (typeof r.result === "string" ? r.result : "").trim();
  if (!result) return { ok: false, error: "Gateway returned no payment URL." };

  // Live shape: the whole thing is already the URL to send the customer to.
  if (/^https:\/\//i.test(result)) {
    let paymentId = "";
    try {
      paymentId = new URL(result).searchParams.get("PaymentID")?.trim() ?? "";
    } catch {
      return { ok: false, error: "Gateway returned a malformed payment URL." };
    }
    if (!paymentId) return { ok: false, error: "Gateway returned no payment ID." };
    return { ok: true, paymentId, redirectUrl: result };
  }

  // Documented shape: "<paymentId>:<baseUrl>". Split on the FIRST colon only,
  // or the URL's own scheme gets torn in half.
  const at = result.indexOf(":");
  if (at <= 0) return { ok: false, error: "Gateway returned no payment URL." };
  const paymentId = result.slice(0, at).trim();
  const paymentUrl = result.slice(at + 1).trim();
  if (!paymentId || !/^https:\/\//i.test(paymentUrl)) {
    return { ok: false, error: "Gateway returned a malformed payment URL." };
  }
  return { ok: true, paymentId, redirectUrl: `${paymentUrl}?PaymentID=${encodeURIComponent(paymentId)}` };
}

export type BenefitNotification = {
  paymentId: string;
  result: string;
  trackId: string;
  amt: string;
  ref?: string;
  transId?: string;
  authRespCode?: string;
  authCode?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
};

/** Decrypt and parse the notification trandata they POST to our responseURL. */
export function parseNotification(trandata: string, key: string): BenefitNotification | null {
  try {
    const parsed = JSON.parse(aesDecrypt(trandata, key));
    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    if (!r.paymentId || !r.trackId) return null;
    return {
      paymentId: String(r.paymentId),
      result: String(r.result ?? ""),
      trackId: String(r.trackId),
      amt: String(r.amt ?? ""),
      ref: r.ref ? String(r.ref) : undefined,
      transId: r.transId ? String(r.transId) : undefined,
      authRespCode: r.authRespCode ? String(r.authRespCode) : undefined,
      authCode: r.authCode ? String(r.authCode) : undefined,
      udf1: r.udf1 ? String(r.udf1) : undefined,
      udf2: r.udf2 ? String(r.udf2) : undefined,
      udf3: r.udf3 ? String(r.udf3) : undefined,
      udf4: r.udf4 ? String(r.udf4) : undefined,
      udf5: r.udf5 ? String(r.udf5) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Did the money actually arrive?
 *
 * The guide's own samples use "CAPTURED" (page 49) and "captured" (page 42) in
 * the same document, so compare case-insensitively. authRespCode "00" is their
 * approval code. Anything else is a decline and must NOT create an order.
 */
export function isCaptured(n: BenefitNotification): boolean {
  return n.result.trim().toUpperCase() === "CAPTURED" && (n.authRespCode ?? "00").trim() === "00";
}

/**
 * Build the encrypted init payload.
 *
 * `amount` must already be the server-priced total from lib/serverPricing.
 * Nothing here re-derives or trusts a client figure: that was the critical
 * bug fixed in the MPGS route and it would be trivial to reintroduce here.
 */
export function buildInitPayload(
  cfg: BenefitConfig,
  args: { amount: number; trackId: string; responseUrl: string; errorUrl: string },
): { id: string; trandata: string } {
  // Their own note: the total URL length must stay under 254 characters, and a
  // non-default port causes errors. Both of ours are short and on 443.
  for (const [label, url] of [["responseURL", args.responseUrl], ["errorURL", args.errorUrl]] as const) {
    if (url.length > 254) throw new Error(`${label} exceeds the gateway's 254-character limit`);
  }
  const trandata = JSON.stringify([{
    amt: bhdAmount(args.amount),
    action: ACTION_PURCHASE,
    password: cfg.tranportalPassword,
    id: cfg.tranportalId,
    currencycode: CURRENCY_BHD,
    trackId: args.trackId,
    // Spec: leave user-defined fields blank when unused, do not omit them.
    udf1: "", udf2: "", udf3: "", udf4: "", udf5: "",
    responseURL: args.responseUrl,
    errorURL: args.errorUrl,
  }]);
  return { id: cfg.tranportalId, trandata: aesEncrypt(trandata, cfg.resourceKey) };
}

/** Fire the init call and hand back somewhere to send the customer. */
export async function createPayment(
  cfg: BenefitConfig,
  args: { amount: number; trackId: string; responseUrl: string; errorUrl: string },
): Promise<InitResult> {
  let payload: { id: string; trandata: string };
  try {
    payload = buildInitPayload(cfg, args);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not build the payment request." };
  }

  let res: Response;
  try {
    res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify([payload]),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    // Network-level failure. Their IPs need to be reachable both ways from the
    // VPS, so a persistent failure here usually means a firewall rule.
    console.error("[benefit] init call failed", e);
    return { ok: false, error: "Could not reach the payment gateway." };
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[benefit] init HTTP", res.status, text.slice(0, 400));
    return { ok: false, error: "The payment gateway refused the request." };
  }
  try {
    return parseInitResponse(JSON.parse(text));
  } catch {
    console.error("[benefit] init returned non-JSON", text.slice(0, 400));
    return { ok: false, error: "Unreadable gateway response." };
  }
}
