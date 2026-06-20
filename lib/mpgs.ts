/**
 * MPGS (Mastercard Payment Gateway Services) REST wrapper — server only.
 *
 * Hosted Checkout against AFS Bahrain. We never see card data: we create a
 * session, the browser shows Mastercard's embedded payment page, and we verify
 * the result by retrieving the order. BHD is a 3-decimal currency.
 *
 * Config comes from env (set on Vercel + .env.local):
 *   MPGS_GATEWAY_URL   e.g. https://afs.gateway.mastercard.com
 *   MPGS_MERCHANT_ID   e.g. TEST100277749   (API user becomes merchant.<id>)
 *   MPGS_API_VERSION   e.g. 100
 *   MPGS_API_PASSWORD  the Web Services API password (secret)
 *   MPGS_MERCHANT_NAME display name on the payment page (optional)
 */

export type MpgsConfig = {
  gatewayUrl: string;
  merchantId: string;
  version: string;
  apiPassword: string;
  merchantName: string;
};

export function getMpgsConfig(): MpgsConfig | null {
  const gatewayUrl = process.env.MPGS_GATEWAY_URL;
  const merchantId = process.env.MPGS_MERCHANT_ID;
  const apiPassword = process.env.MPGS_API_PASSWORD;
  if (!gatewayUrl || !merchantId || !apiPassword) return null;
  return {
    gatewayUrl: gatewayUrl.replace(/\/$/, ""),
    merchantId,
    version: process.env.MPGS_API_VERSION || "100",
    apiPassword,
    merchantName: process.env.MPGS_MERCHANT_NAME || "Hilton Made to Measure",
  };
}

function authHeader(cfg: MpgsConfig): string {
  const user = `merchant.${cfg.merchantId}`;
  return "Basic " + Buffer.from(`${user}:${cfg.apiPassword}`).toString("base64");
}

function base(cfg: MpgsConfig): string {
  return `${cfg.gatewayUrl}/api/rest/version/${cfg.version}/merchant/${cfg.merchantId}`;
}

/** BHD is a 3-decimal currency; the gateway rejects more precision. */
export function bhd(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}

export type CreateSessionResult =
  | { ok: true; sessionId: string; successIndicator: string | null }
  | { ok: false; error: string };

/** INITIATE_CHECKOUT — mint a hosted-checkout session for one purchase. */
export async function createCheckoutSession(
  cfg: MpgsConfig,
  args: { orderRef: string; amount: number; currency: string; returnUrl: string; description?: string },
): Promise<CreateSessionResult> {
  const body = {
    apiOperation: "INITIATE_CHECKOUT",
    interaction: {
      operation: "PURCHASE",
      merchant: { name: cfg.merchantName },
      returnUrl: args.returnUrl,
      displayControl: { billingAddress: "HIDE", customerEmail: "HIDE" },
    },
    order: {
      id: args.orderRef,
      amount: bhd(args.amount),
      currency: args.currency,
      description: args.description || "Hilton Made to Measure commission",
    },
  };
  try {
    const res = await fetch(`${base(cfg)}/session`, {
      method: "POST",
      headers: { Authorization: authHeader(cfg), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.result === "ERROR" || !json?.session?.id) {
      const msg = json?.error?.explanation || json?.error?.cause || `Gateway returned ${res.status}`;
      return { ok: false, error: String(msg) };
    }
    return { ok: true, sessionId: String(json.session.id), successIndicator: json?.successIndicator ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach the payment gateway." };
  }
}

export type RetrievedOrder = {
  result: string;            // SUCCESS | FAILURE | PENDING | ...
  status: string;            // CAPTURED | AUTHORIZED | FAILED | ...
  totalCaptured: number;
  amount: number;
  currency: string;
};

/** RETRIEVE_ORDER — the source of truth for "did the money actually clear". */
export async function retrieveOrder(
  cfg: MpgsConfig,
  orderRef: string,
): Promise<{ ok: true; order: RetrievedOrder } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${base(cfg)}/order/${encodeURIComponent(orderRef)}`, {
      headers: { Authorization: authHeader(cfg) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.explanation || `Gateway returned ${res.status}`;
      return { ok: false, error: String(msg) };
    }
    return {
      ok: true,
      order: {
        result: String(json?.result ?? ""),
        status: String(json?.status ?? ""),
        totalCaptured: Number(json?.totalCapturedAmount ?? 0),
        amount: Number(json?.amount ?? 0),
        currency: String(json?.currency ?? ""),
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach the payment gateway." };
  }
}
