/**
 * Renders every transactional email template in lib/email.ts to a single
 * combined HTML preview document (one email per page). A separate Chrome
 * headless step converts that HTML to docs/email-templates.pdf.
 *
 * Run: node --import ./scripts/register-hook.mjs ... or, simpler:
 *   node scripts/renderEmailTemplates.mjs
 * The Resend SDK is stubbed in-process via scripts/resendMockLoader.mjs so we
 * can capture the HTML each template builds (see that file for the why).
 */
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Make lib/email.ts build the SDK path (RESEND_API_KEY truthy) so send() runs
// and calls our stubbed resend.emails.send. Set a realistic site URL so CTA
// links resolve the way they do in production.
process.env.RESEND_API_KEY ||= "mock-preview-key";
process.env.NEXT_PUBLIC_SITE_URL ||= "https://hilton-mtm-virid.vercel.app";

// Register the loader BEFORE importing email.ts so the "resend" import is
// redirected to the recording stub.
register("./resendMockLoader.mjs", import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const emailUrl = pathToFileURL(path.join(repoRoot, "lib", "email.ts")).href;
const email = await import(emailUrl);

/* ----------------------------- sample data ----------------------------- */

const to = "james.whitmore@example.com";
const name = "James Whitmore";
const orderNumber = "HM-100428";

// Inline a local /public/learn photo as a data: URI so Chrome headless renders
// the sample thumbnails reliably (same trick used for the logo below; a remote
// vercel.app asset returns 403 to headless Chrome).
function localImageDataUri(relPath) {
  const abs = path.join(repoRoot, relPath);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${readFileSync(abs).toString("base64")}`;
}

const suitImage = localImageDataUri("public/learn/style-options-jacket-fit-buttons-lapel-0.jpg");
const shirtImage = localImageDataUri("public/learn/style-options-the-shirt-0.jpg");

const items = [
  { name: "Bespoke Two-Piece Suit, Navy Worsted", type_label: "Two-Piece Suit", qty: 1, price_num: 480, image: suitImage },
  { name: "Tailored Dress Shirt, White Poplin", type_label: "Dress Shirt", qty: 2, price_num: 45, image: shirtImage },
];
const itemsTotal = 570; // 480 + 45*2
const vat = 57;         // 10% of 570
const shipping = 3;     // BHD 3.000
const grandTotal = 630; // 570 + 57 + 3

/* ------------------------- template call registry ------------------------- */

const specs = [
  {
    key: "welcome",
    fn: "sendWelcomeEmail",
    useCase: "Sent the moment a customer completes signup: activates the account and invites them to design their first commission.",
    run: () => email.sendWelcomeEmail({ to, name }),
  },
  {
    key: "password-reset",
    fn: "sendPasswordResetEmail",
    useCase: "Sent when a customer asks to reset their password: a one-hour, single-use link.",
    run: () =>
      email.sendPasswordResetEmail({
        to,
        name,
        resetUrl:
          "https://hilton-mtm-virid.vercel.app/account/reset-password?token=8f2c1a9e-4b7d-4c2a-9e11-6a0f2d3b5c88",
      }),
  },
  {
    key: "login-otp",
    fn: "sendLoginOtpEmail",
    useCase: "Two-factor sign-in: emails a one-time six-digit code, valid one hour, single use.",
    run: () => email.sendLoginOtpEmail({ to, name, code: "048213" }),
  },
  {
    key: "order-confirmation",
    fn: "sendOrderConfirmationEmail",
    useCase: "Sent after payment is captured: an itemised receipt with VAT, shipping and the grand total.",
    run: () =>
      email.sendOrderConfirmationEmail({
        to,
        name,
        orderNumber,
        items,
        subtotal: itemsTotal,
        vat,
        vatRate: 0.1,
        shipping,
        grandTotal,
        shippingAddressLine1: "Villa 24, Road 2801, Block 428",
        shippingCity: "Manama",
        shippingCountry: "Bahrain",
      }),
  },
  {
    key: "order-status",
    fn: "sendOrderStatusEmail",
    useCase: "Sent whenever the atelier advances an order's stage: carries a personal line from Sebastian, the concierge.",
    run: () =>
      email.sendOrderStatusEmail({
        to,
        name,
        orderNumber,
        statusLabel: "In production",
        sebastianLine:
          "Your navy worsted is on the cutting table this week; I will write again the moment the canvas is basted and ready for your first fitting.",
      }),
  },
  // courier-dispatch (sendCourierDispatchEmail) is intentionally excluded from
  // the PDF preview. The function stays in lib/email.ts; it just isn't rendered.
];

/* ----------------------------- render each ----------------------------- */

const rendered = [];
for (const s of specs) {
  const store = (globalThis.__RENDERED_EMAILS ||= []);
  const before = store.length;
  await s.run();
  const captured = store.slice(before);
  if (captured.length === 0) {
    console.error(`[FAIL] ${s.key} (${s.fn}) produced no email`);
    continue;
  }
  const sent = captured[captured.length - 1];
  rendered.push({ ...s, subject: sent.subject, html: sent.html });
  console.log(`[ok]   ${s.fn.padEnd(28)} subject: ${sent.subject}`);
}

/* -------------------------- build combined HTML -------------------------- */

const dateStr = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// The templates point their brand mark at the vercel.app deployment, which
// returns 403 to Chrome headless (Vercel bot checkpoint) so the logo renders
// broken in the PDF. Swap that URL for the local logo inlined as a data URI so
// the preview shows the real monogram, exactly as a live email client would.
const REMOTE_LOGO = "https://hilton-mtm-virid.vercel.app/logo-burgundy.png";
let logoDataUri = REMOTE_LOGO;
try {
  const b64 = readFileSync(path.join(repoRoot, "public", "logo-burgundy.png")).toString("base64");
  logoDataUri = `data:image/png;base64,${b64}`;
} catch {
  console.error("[warn] public/logo-burgundy.png not found; leaving remote logo URL");
}

// Strip the outer <!DOCTYPE><html><head><body> wrapper from each email so that
// injecting it into the preview page doesn't merge the email's <body>
// background onto the whole page. Keep everything between <body> and </body>,
// inline the logo, and re-wrap in a div that reproduces the ivory canvas.
function innerOf(html) {
  return html
    .split(REMOTE_LOGO).join(logoDataUri)
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "");
}

const sections = rendered
  .map(
    (r) => `
  <section class="email">
    <div class="caption">
      <span class="tmpl">${r.fn}()</span>
      <div class="subj"><span class="lbl">Subject</span>${escapeHtml(r.subject)}</div>
      <div class="use">${escapeHtml(r.useCase)}</div>
    </div>
    <div class="frame">${innerOf(r.html)}</div>
  </section>`
  )
  .join("\n");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hilton Made to Measure: Transactional Email Templates</title>
<style>
  @page { size: A4; margin: 7mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #e9e7e4; color: #1f1d1b;
    font-family: -apple-system, "Segoe UI", Arial, sans-serif; }
  .header { text-align: center; padding: 120px 24px 60px; }
  .header h1 { font-family: Georgia, "Times New Roman", serif; font-weight: normal;
    font-size: 27px; line-height: 1.25; margin: 0 auto 14px; max-width: 560px; color: #1f1d1b; }
  .header .rule { width: 46px; height: 0; border-top: 1px solid rgba(110,38,57,0.4);
    margin: 0 auto 16px; }
  .header .date { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 2.5px;
    text-transform: uppercase; color: #6b6663; }
  .header .count { margin-top: 16px; font-size: 12px; color: #8a827c; }
  .email { page-break-before: always; break-before: page;
    break-inside: avoid; page-break-inside: avoid; padding: 2mm 6mm 3mm; }
  .caption { max-width: 680px; margin: 0 auto 11px; font-family: Arial, sans-serif; }
  .caption .tmpl { display: inline-block; font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px; background: #1f1d1b; color: #fff; padding: 4px 11px; border-radius: 3px; }
  .caption .subj { margin-top: 11px; font-size: 14px; color: #1f1d1b; }
  .caption .subj .lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: #8a827c; margin-right: 9px; }
  .caption .use { margin-top: 6px; font-size: 12px; line-height: 1.55; color: #6b6663;
    max-width: 640px; }
  /* zoom (not transform) shrinks the actual layout box in Chrome, so each
     email card + its caption fit together on a single printed page instead of
     the atomic email table spilling onto the next page. */
  .frame { max-width: 680px; margin: 0 auto; background: #f6efe5; zoom: 0.8;
    border: 1px solid #d8d2c8; box-shadow: 0 2px 6px rgba(0,0,0,0.10); overflow: hidden; }
</style>
</head>
<body>
  <div class="header">
    <h1>Hilton Made to Measure<br>Transactional Email Templates</h1>
    <div class="rule"></div>
    <div class="date">Rendered ${dateStr}</div>
    <div class="count">${rendered.length} templates · lib/email.ts</div>
  </div>
${sections}
</body>
</html>`;

const docsDir = path.join(repoRoot, "docs");
mkdirSync(docsDir, { recursive: true });
const htmlPath = path.join(docsDir, "email-templates.html");
writeFileSync(htmlPath, doc, "utf8");

console.log(`\nRendered ${rendered.length} templates.`);
console.log(`HTML written: ${htmlPath}`);
