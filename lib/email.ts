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
const IVORY = "#f6efe5";
const CHARCOAL = "#1f1d1b";

/** Shared HTML chrome — cream background, burgundy header, Cormorant-style
 *  serif via Georgia fallback so the email keeps the brand feel even when
 *  custom fonts don't load. */
function shell(opts: { preview: string; heading: string; body: string; cta?: { label: string; url: string } }) {
  const cta = opts.cta
    ? `<div style="margin: 32px 0 16px"><a href="${opts.cta.url}" style="display:inline-block;background:${BURGUNDY};color:#fff;text-decoration:none;padding:14px 28px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">${opts.cta.label}</a></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${opts.heading}</title></head>
<body style="margin:0;background:${IVORY};color:${CHARCOAL};font-family:Georgia,'Times New Roman',serif">
<div style="display:none;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden">${opts.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${IVORY}">
  <tr><td align="center" style="padding:48px 16px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border:1px solid rgba(0,0,0,0.08)">
      <tr><td style="padding:36px 40px 24px;border-bottom:1px solid rgba(0,0,0,0.08);text-align:center">
        <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:0.5px;color:${BURGUNDY}">Hilton Made to Measure</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(0,0,0,0.45);margin-top:6px">Since 1970 · Manama, Bahrain</div>
      </td></tr>
      <tr><td style="padding:40px">
        <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.15;margin:0 0 16px;color:${CHARCOAL};font-weight:normal">${opts.heading}</h1>
        <div style="font-size:15px;line-height:1.65">${opts.body}</div>
        ${cta}
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:11px;color:rgba(0,0,0,0.5);text-align:center;line-height:1.6">
        Shop No. 119, Shaikh Abdulla Avenue · Manama, Kingdom of Bahrain<br>
        +973 1724 5689 · <a href="mailto:atelier@hiltonmtm.com" style="color:${BURGUNDY};text-decoration:none">atelier@hiltonmtm.com</a>
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

type OrderEmailItem = { name: string; type_label: string; qty: number; price_num: number };

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
}) {
  const firstName = args.name.split(/\s+/)[0] || "";
  const itemsGross = args.items.reduce((s, it) => s + it.price_num * it.qty, 0);
  const rows = args.items.map((it) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.45)">${it.type_label}</div>
        <div style="font-family:Georgia,serif;font-size:16px;margin-top:2px">${it.name}</div>
        ${it.qty > 1 ? `<div style="font-size:12px;color:rgba(0,0,0,0.55);margin-top:2px">Qty ${it.qty}</div>` : ""}
      </td>
      <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-family:Georgia,serif;font-size:16px;color:${BURGUNDY};white-space:nowrap;vertical-align:top">
        ${formatBhd(it.price_num * it.qty)}
      </td>
    </tr>
  `).join("");
  const shippingBlock = args.shippingAddressLine1 ? `
    <p style="margin-top:32px"><strong style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.5)">Ship to</strong><br>
      ${args.shippingAddressLine1}<br>
      ${[args.shippingCity, args.shippingCountry].filter(Boolean).join(", ")}
    </p>` : "";

  // Show a Subtotal → Discount → Total breakdown when a code was applied
  // so the customer sees the saving clearly. Otherwise keep the original
  // single Total row.
  const hasDiscount = Boolean(args.discountCode && args.discountAmount && args.discountAmount > 0);
  const totalsRows = hasDiscount
    ? `
      <tr><td style="padding:16px 0 6px;font-family:Arial,sans-serif;font-size:12px;color:rgba(0,0,0,0.55)">Subtotal</td>
          <td align="right" style="padding:16px 0 6px;font-family:Georgia,serif;font-size:16px">${formatBhd(itemsGross)}</td></tr>
      <tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:12px;color:${BURGUNDY}">
            ${args.discountCode} · ${args.discountPercent}% off
          </td>
          <td align="right" style="padding:6px 0;font-family:Georgia,serif;font-size:16px;color:${BURGUNDY}">
            − ${formatBhd(args.discountAmount ?? 0)}
          </td></tr>
      <tr><td style="padding:12px 0 0;font-family:Georgia,serif;font-size:18px;border-top:1px solid rgba(0,0,0,0.12)">Total</td>
          <td align="right" style="padding:12px 0 0;font-family:Georgia,serif;font-size:20px;color:${BURGUNDY};border-top:1px solid rgba(0,0,0,0.12)">${formatBhd(args.subtotal)}</td></tr>`
    : `
      <tr><td style="padding:16px 0 0;font-family:Georgia,serif;font-size:18px">Total</td>
          <td align="right" style="padding:16px 0 0;font-family:Georgia,serif;font-size:20px;color:${BURGUNDY}">${formatBhd(args.subtotal)}</td></tr>`;

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
      preview: `Order ${args.orderNumber} received — ${formatBhd(args.subtotal)}.`,
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
