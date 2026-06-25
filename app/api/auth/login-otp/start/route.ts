/**
 * Step 1 of password + email-OTP login. Verifies the credentials server-side
 * (no session is created), then stores a hashed 6-digit code and emails it via
 * Resend. Returns { otpRequired: true } on success; a generic 401 otherwise so
 * we never reveal whether an email exists.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLoginOtpEmail } from "@/lib/email";
import { verifyPassword, generateOtp, hashOtp, normaliseEmail, isAdminEmail, OTP_TTL_MS } from "@/lib/loginOtp";

export const runtime = "nodejs";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPA_URL || !SERVICE) return NextResponse.json({ error: "Server not configured." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

  // Verify the password first — only email a code if the credentials are valid.
  const grant = await verifyPassword(email, password);
  if (!grant.ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const emailLower = normaliseEmail(grant.email);
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // Admins are exempt from the OTP for now — hand back the session directly so
  // the client signs straight in (no code, no email). Everyone else continues
  // to the second factor below.
  if (await isAdminEmail(admin, grant.email)) {
    return NextResponse.json({ otpRequired: false, accessToken: grant.accessToken, refreshToken: grant.refreshToken });
  }

  const code = generateOtp();

  // One active code per email — upsert replaces any prior unconsumed code.
  const { error } = await admin.from("mtm_login_otps").upsert(
    {
      email: emailLower,
      code_hash: hashOtp(emailLower, code),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      consumed: false,
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) return NextResponse.json({ error: "Could not start sign-in. Please try again." }, { status: 500 });

  const sent = await sendLoginOtpEmail({ to: grant.email, code, name: grant.name });
  if (!sent.ok) return NextResponse.json({ error: "Could not send your code. Please try again." }, { status: 502 });

  return NextResponse.json({ otpRequired: true });
}
