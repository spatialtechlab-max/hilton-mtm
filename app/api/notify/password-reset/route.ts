/**
 * Branded password-reset email. Replaces Supabase's default "Supabase Auth"
 * template: we generate the recovery link with the admin API and send it
 * through Resend using the same house chrome as the welcome email.
 *
 * Always returns { ok: true } regardless of whether the email maps to an
 * account, so the endpoint never reveals which addresses are registered.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ ok: true });

  // Unauthenticated and it sends mail, so without a limit it is a way to bomb
  // someone's inbox and burn the Resend quota. Per IP and per target address.
  const ip = clientIp(req);
  const perIp = rateLimit(`pwreset:ip:${ip}`, 5, 15 * 60_000);
  if (!perIp.ok) return tooMany(perIp.retryAfter);

  let email = "";
  let redirectTo = "";
  try {
    const b = await req.json();
    email = String(b.email ?? "").trim();
    redirectTo = String(b.redirectTo ?? "").trim();
  } catch { /* ignore malformed body */ }
  if (!email) return NextResponse.json({ ok: true });

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    // Unknown email / any error: stay silent so we don't leak account existence.
    if (!error && data) {
      const actionLink = data.properties?.action_link;
      if (actionLink) {
        const name = (data.user?.user_metadata as { full_name?: string } | undefined)?.full_name;
        await sendPasswordResetEmail({ to: email, resetUrl: actionLink, name });
      }
    }
  } catch { /* swallow — never reveal internals */ }

  return NextResponse.json({ ok: true });
}
