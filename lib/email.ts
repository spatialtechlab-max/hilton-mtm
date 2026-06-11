/**
 * Transactional email layer. Wraps Resend so the rest of the app calls
 * one of three high-level helpers — sendWelcomeEmail, sendOrderConfirmationEmail,
 * sendCourierDispatchEmail — and never touches the SDK directly.
 *
 * Lives server-side only. If RESEND_API_KEY isn't configured the helpers
 * log the email to the server console instead of crashing; this lets us
 * ship feature code and turn delivery on later by adding the env var.
 *
 * From address defaults to "Hilton Made to Measure <atelier@hiltonmtm.com>".
 * Override per-call with the `from` option if needed.
 */
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.RESEND_FROM ?? "Hilton Made to Measure <atelier@hiltonmtm.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiltonmtm.com";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

async function send({ to, subject, html, text, from }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    // No-op fallback for local / preview environments.
    // eslint-disable-next-line no-console
    console.log("[email-disabled] would send to", to, "subject:", subject);
    return { ok: true };
  }
  try {
    const result = await resend.emails.send({
      from: from ?? EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

const BURGUNDY = "#6e2639";
const BURGUNDY_DARK = "#561d2c";
const IVORY = "#f6efe5";
const IVORY_DARK = "#ece3d4";
const CHARCOAL = "#1f1d1b";
const CHARCOAL_500 = "#6b6663";

/** Public URL for the brand mark used in transactional emails. We use the
 *  storefront's vercel.app deployment because hiltonmtm.com is host-routed
 *  to /coming-soon by middleware — static assets there still resolve, but
 *  the vercel.app URL is the canonical place we know is live during this
 *  pre-launch phase. */
const LOGO_URL = "https://hilton-mtm-virid.vercel.app/logo-burgundy.png";

/** Shared HTML chrome — premium concierge correspondence card. Real Hilton
 *  monogram at the top on a cream plate, burgundy hairline accents, deep
 *  burgundy footer with the house address. Georgia + Arial fallbacks so
 *  the brand feel survives clients that strip webfonts. */
function shell(opts: { preview: string; heading: string; body: string; cta?: { label: string; url: string } }) {
  const cta = opts.cta
    ? `<div style="margin:36px 0 8px;text-align:center"><a href="${opts.cta.url}" style="display:inline-block;background:${BURGUNDY};color:#fff;text-decoration:none;padding:15px 34px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase">${opts.cta.label}</a></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${opts.heading}</title></head>
<body style="margin:0;background:${IVORY};color:${CHARCOAL};font-family:Georgia,'Times New Roman',serif">
<div style="display:none;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden">${opts.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${IVORY}">
  <tr><td align="center" style="padding:40px 16px 48px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-top:3px solid ${BURGUNDY}">
      <!-- ─── House plate: brand monogram + tagline ─── -->
      <tr><td style="padding:42px 40px 28px;text-align:center;background:#fff">
        <img src="${LOGO_URL}" alt="Hilton Made to Measure" width="120" height="100" style="display:block;margin:0 auto;max-width:120px;height:auto;border:0;outline:none;text-decoration:none">
        <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:3.5px;text-transform:uppercase;color:${CHARCOAL_500};margin-top:18px">Bespoke since 1970 · Manama, Bahrain</div>
        <!-- Burgundy ornament rule -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 0">
          <tr>
            <td style="border-top:1px solid rgba(110,38,57,0.25);width:48px;font-size:0;line-height:0">&nbsp;</td>
            <td style="padding:0 10px;color:${BURGUNDY};font-size:10px;font-family:Georgia,serif">◆</td>
            <td style="border-top:1px solid rgba(110,38,57,0.25);width:48px;font-size:0;line-height:0">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <!-- ─── Content ─── -->
      <tr><td style="padding:36px 44px 40px">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;margin:0 0 18px;color:${CHARCOAL};font-weight:normal;letter-spacing:0.2px">${opts.heading}</h1>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#2a2826">${opts.body}</div>
        ${cta}
      </td></tr>

      <!-- ─── Footer: burgundy concierge plate ─── -->
      <tr><td style="background:${BURGUNDY};padding:28px 40px 32px;text-align:center;color:rgba(255,255,255,0.85);font-family:Georgia,serif">
        <div style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.5px;color:#fff;margin-bottom:6px">Hilton Made to Measure</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:18px">The atelier on Shaikh Abdulla Avenue</div>
        <div style="font-family:Arial,sans-serif;font-size:11px;line-height:1.7;color:rgba(255,255,255,0.8)">
          Shop No. 119, Shaikh Abdulla Avenue<br>
          Manama, Kingdom of Bahrain<br>
          +973 1724 5689 · <a href="mailto:atelier@hiltonmtm.com" style="color:#fff;text-decoration:underline">atelier@hiltonmtm.com</a>
        </div>
      </td></tr>
    </table>

    <!-- Subtle below-card eyebrow with order/account hint -->
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-top:16px">
      <tr><td style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,0.4);text-align:center;line-height:1.7">
        Sent with care by Sebastian, your concierge.
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

const formatBhd = (n: number) =>
  `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/* ─────────────────────────── 1. Welcome on signup ─────────────────────────── */

export async function sendWelcomeEmail(args: { to: string; name?: string }) {
  const firstName = (args.name ?? "").split(/\s+/)[0] || "";
  const heading = firstName ? `Welcome, ${firstName}.` : "Welcome.";
  const body = `
    <p>Thank you for joining the Hilton Made to Measure house. Your account is now active.</p>
    <p>Three generations of tailors in Manama, working from the original Hilton bench. Every commission is cut from a paper pattern drawn for one body — the same way we have done it since 1970.</p>
    <p>When you are ready, design your first commission online, or book a private fitting at the atelier and we will do it together.</p>
  `;
  return send({
    to: args.to,
    subject: "Welcome to Hilton Made to Measure",
    html: shell({
      preview: "Welcome to the Hilton Made to Measure house.",
      heading,
      body,
      cta: { label: "Design Your First", url: `${SITE_URL}/customize` },
    }),
  });
}

/* ───────────────────── 2. Order confirmation ───────────────────── */

type OrderEmailItem = { name: string; type_label: string; qty: number; price_num: number; image?: string | null };

export async function sendOrderConfirmationEmail(args: {
  to: string;
  name: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingCountry?: string;
  discountCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  vat?: number;
  vatRate?: number;
  shipping?: number;
  grandTotal?: number;
}) {
  const firstName = args.name.split(/\s+/)[0] || "";
  const itemsGross = args.items.reduce((s, it) => s + it.price_num * it.qty, 0);
  const rows = args.items.map((it) => {
    // 72px square thumbnail per line item. ERP product photos sometimes
    // ship on a studio-white plate; emails can't run mix-blend tricks, so
    // we just render the photo as-is against an ivory cell. The image
    // column only renders when the order item actually has an image URL.
    const thumbCell = it.image
      ? `<td width="80" style="padding:16px 14px 16px 0;border-bottom:1px solid rgba(0,0,0,0.06);vertical-align:top">
          <img src="${it.image}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;object-fit:cover;background:${IVORY};border:1px solid rgba(0,0,0,0.08)">
        </td>`
      : `<td width="0" style="border-bottom:1px solid rgba(0,0,0,0.06);font-size:0;line-height:0">&nbsp;</td>`;
    return `
    <tr>
      ${thumbCell}
      <td style="padding:16px 0;border-bottom:1px solid rgba(0,0,0,0.06);vertical-align:top">
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.45)">${it.type_label}</div>
        <div style="font-family:Georgia,serif;font-size:16px;margin-top:3px;color:${CHARCOAL}">${it.name}</div>
        ${it.qty > 1 ? `<div style="font-size:12px;color:rgba(0,0,0,0.55);margin-top:3px">Qty ${it.qty}</div>` : ""}
      </td>
      <td align="right" style="padding:16px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-family:Georgia,serif;font-size:16px;color:${BURGUNDY};white-space:nowrap;vertical-align:top">
        ${formatBhd(it.price_num * it.qty)}
      </td>
    </tr>
  `;
  }).join("");
  const shippingBlock = args.shippingAddressLine1 ? `
    <p style="margin-top:32px"><strong style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Ship to</strong><br>
      ${args.shippingAddressLine1}<br>
      ${[args.shippingCity, args.shippingCountry].filter(Boolean).join(", ")}
    </p>` : "";

  // Show a Subtotal · Discount · Total breakdown when a code was applied.
  // Horizontal layout (3 columns side-by-side) keeps the email compact on
  // desktop so the customer doesn't have to scroll through three stacked
  // rows just to see they saved BHD 8. Falls back to a single right-
  // aligned Total row when no discount was applied.
  //
  // Each item row above has 3 cells (thumb + details + price). The totals
  // row uses colspan=3 with a NESTED 3-column table inside so the
  // breakdown spans the full card width and the columns can size
  // independently of the items table above.
  // Show a Subtotal · Discount · Total breakdown when a code was applied.
  // Horizontal layout (3 columns side-by-side) keeps the email compact on
  // desktop so the customer doesn't have to scroll through three stacked
  // rows just to see they saved BHD 8. Falls back to a single right-
  // aligned Total row when no discount was applied.
  //
  // Each item row above has 3 cells (thumb + details + price). The totals
  // row uses colspan=3 with a NESTED 3-column table inside so the
  // breakdown spans the full card width and the columns can size
  // independently of the items table above.
  const hasDiscount = Boolean(args.discountCode && args.discountAmount && args.discountAmount > 0);
  const vatPercentLabel = Math.round((args.vatRate ?? 0.10) * 100);
  const vatAmount       = args.vat ?? 0;
  const shippingAmount  = args.shipping ?? 0;
  const grandTotal      = args.grandTotal ?? args.subtotal;

  // Build a single right-aligned breakdown table: Items / Discount? / VAT /
  // Shipping / Total. Two-column layout (label · value) since five rows is
  // easier to scan vertically than squeezing them across the card.
  const totalsRows = `
    <tr><td colspan="3" style="padding-top:12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(0,0,0,0.12)">
        <tr>
          <td style="padding:14px 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,0,0,0.55)">Items</td>
          <td align="right" style="padding:14px 0 4px;font-family:Georgia,serif;font-size:15px;color:${CHARCOAL}">${formatBhd(itemsGross)}</td>
        </tr>
        ${hasDiscount ? `
        <tr>
          <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${BURGUNDY}">${args.discountCode} · ${args.discountPercent}% off</td>
          <td align="right" style="padding:4px 0;font-family:Georgia,serif;font-size:15px;color:${BURGUNDY}">− ${formatBhd(args.discountAmount ?? 0)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,0,0,0.55)">VAT (${vatPercentLabel}%)</td>
          <td align="right" style="padding:4px 0;font-family:Georgia,serif;font-size:15px;color:${CHARCOAL}">${formatBhd(vatAmount)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,0,0,0.55)">Shipping</td>
          <td align="right" style="padding:4px 0;font-family:Georgia,serif;font-size:15px;color:${CHARCOAL}">${formatBhd(shippingAmount)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,0,0,0.7)">Total</td>
          <td align="right" style="padding:12px 0 0;border-top:1px solid rgba(0,0,0,0.08);font-family:Georgia,serif;font-size:22px;color:${BURGUNDY}">${formatBhd(grandTotal)}</td>
        </tr>
      </table>
    </td></tr>`;

  const body = `
    <p>${firstName ? `Dear ${firstName},` : "Hello,"}</p>
    <p>Your commission is received. We will confirm next steps within one working day. Order details for your records:</p>
    <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5);margin:24px 0 12px">Order ${args.orderNumber}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows}
      ${totalsRows}
    </table>
    ${shippingBlock}
    <p style="margin-top:32px">A house tailor will be in touch shortly to schedule your fitting.</p>
  `;
  return send({
    to: args.to,
    subject: `Order ${args.orderNumber} received · Hilton Made to Measure`,
    html: shell({
      preview: `Order ${args.orderNumber} received · ${formatBhd(args.grandTotal ?? args.subtotal)}.`,
      heading: `Order ${args.orderNumber} received.`,
      body,
      cta: { label: "View Order", url: `${SITE_URL}/account/orders/${args.orderNumber}` },
    }),
  });
}

/* ──────────────────── 3. Order status update ──────────────────── */

export async function sendOrderStatusEmail(args: {
  to: string;
  name: string;
  orderNumber: string;
  statusLabel: string;
  sebastianLine: string;
}) {
  const firstName = args.name.split(/\s+/)[0] || "";
  const body = `
    <p>${firstName ? `Dear ${firstName},` : "Hello,"}</p>
    <p>A small update on your commission.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
      <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Order</td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Georgia,serif;font-size:16px">${args.orderNumber}</td></tr>
      <tr><td style="padding:12px 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Now</td>
          <td align="right" style="padding:12px 0;font-family:Georgia,serif;font-size:16px;color:${BURGUNDY}">${args.statusLabel}</td></tr>
    </table>
    <p style="font-style:italic;color:rgba(0,0,0,0.7)">${args.sebastianLine}</p>
    <p>You can follow every step of the commission from your account at any time.</p>
  `;
  return send({
    to: args.to,
    subject: `Order ${args.orderNumber} · ${args.statusLabel}`,
    html: shell({
      preview: `Order ${args.orderNumber} is now ${args.statusLabel.toLowerCase()}.`,
      heading: `Order ${args.orderNumber} update.`,
      body,
      cta: { label: "View Order", url: `${SITE_URL}/account/orders/${args.orderNumber}` },
    }),
  });
}

/* ──────────────────── 4. Courier dispatch ──────────────────── */

export async function sendCourierDispatchEmail(args: {
  to: string;
  name: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
}) {
  const firstName = args.name.split(/\s+/)[0] || "";
  const trackLine = args.trackingUrl
    ? `<a href="${args.trackingUrl}" style="color:${BURGUNDY}">${args.trackingNumber}</a>`
    : args.trackingNumber;
  const body = `
    <p>${firstName ? `Dear ${firstName},` : "Hello,"}</p>
    <p>Your commission has left the atelier and is on its way to you.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
      <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Order</td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Georgia,serif;font-size:16px">${args.orderNumber}</td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Courier</td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-family:Georgia,serif;font-size:16px">${args.courierName}</td></tr>
      <tr><td style="padding:12px 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Tracking</td>
          <td align="right" style="padding:12px 0;font-family:Georgia,serif;font-size:16px">${trackLine}</td></tr>
    </table>
    <p>If anything looks amiss with the parcel on arrival, do let us know immediately so we can intervene.</p>
  `;
  return send({
    to: args.to,
    subject: `Your order ${args.orderNumber} has shipped`,
    html: shell({
      preview: `${args.courierName} · tracking ${args.trackingNumber}.`,
      heading: "On its way.",
      body,
      cta: args.trackingUrl ? { label: "Track Parcel", url: args.trackingUrl } : undefined,
    }),
  });
}
