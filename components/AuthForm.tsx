"use client";

import { useState } from "react";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Reusable sign-in / create-account form backed by Supabase auth.
 * Email + password and Continue-with-Google. On a successful password sign-in
 * (or a sign-up that returns a session) it calls onSuccess. Google sign-in
 * redirects away and resumes via the auth state listener on return.
 */
export function AuthForm({
  onSuccess,
  redirectTo,
}: {
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Password + email-OTP (2FA): "credentials" collects email/password and,
  // on a valid password, emails a code and moves to "otp" to enter it.
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [code, setCode] = useState("");

  const redirect = redirectTo ?? (typeof window !== "undefined" ? window.location.href : undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet. Please try again shortly.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        // Verify the password on the server and email a one-time code. No
        // session is created until the code is confirmed in the next step.
        const res = await fetch("/api/auth/login-otp/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data?.error || "Couldn't sign in. Please try again."); return; }
        if (data?.otpRequired === false && data?.accessToken) {
          // OTP-exempt account (admin) — sign straight in, no code step.
          const { error } = await supabase.auth.setSession({ access_token: data.accessToken, refresh_token: data.refreshToken });
          if (error) { setError(error.message); return; }
          onSuccess?.();
          return;
        }
        setCode("");
        setStep("otp");
        setNotice("We've emailed you a 6-digit code. It expires in one hour.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: redirect,
          },
        });
        if (error) { setError(error.message); return; }
        // Welcome email fires from AuthProvider on SIGNED_IN (handles
        // every signup path — password, OAuth, email-link confirm —
        // through a single hook), so no per-form fetch here.
        if (data.session) {
          onSuccess?.();
        } else {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || "Couldn't verify the code."); return; }
      // Hand the fresh tokens to the client so the session is established.
      const { error } = await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      });
      if (error) { setError(error.message); return; }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null); setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || "Couldn't resend the code."); return; }
      setNotice("A new code is on its way. It expires in one hour.");
    } finally {
      setLoading(false);
    }
  }

  function backToCredentials() {
    setStep("credentials"); setCode(""); setError(null); setNotice(null);
  }

  async function handleForgot() {
    setError(null); setNotice(null);
    if (!email.trim()) { setError("Enter your email above first."); return; }
    setLoading(true);
    // Send via our own branded Resend email (the house template) instead of
    // Supabase's default "Supabase Auth" message. The server generates the
    // recovery link with the admin API and emails it. Redirect target is the
    // dedicated set-a-new-password page.
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/account/reset` : undefined;
    try {
      await fetch("/api/notify/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
    } catch { /* the notice below is shown regardless, so we don't leak status */ }
    setLoading(false);
    setNotice("Check your email for a password reset link.");
  }

  async function handleGoogle() {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet. Please try again shortly.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect },
    });
    if (error) { setError(error.message); setLoading(false); }
    // On success the browser redirects to Google; no further work here.
  }

  // Second factor: enter the emailed code to finish signing in.
  if (step === "otp") {
    return (
      <div>
        <div className="mb-6">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Verify it&rsquo;s you</span>
          <h2 className="text-display text-[1.6rem] mt-1 leading-tight">Enter your code</h2>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-[0.9rem] text-[var(--color-charcoal-500)] leading-relaxed">
            We emailed a 6-digit code to <span className="text-[var(--color-charcoal-900)]">{email}</span>.
            Enter it below to finish signing in.
          </p>
          <label className="block">
            <span className="text-eyebrow text-[var(--color-charcoal-500)]">6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
              className="mt-2 w-full bg-[var(--color-ivory-100)] border border-black/15 px-4 py-3.5 text-center text-[1.5rem] tracking-[0.5em] text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
            />
          </label>

          {error && (
            <p className="text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-[0.85rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-3 py-2">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & continue"}
            {!loading && <ArrowRight size={16} strokeWidth={1.5} />}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-[0.8rem]">
          <button
            type="button"
            onClick={backToCredentials}
            disabled={loading}
            className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
          >
            ← Use a different account
          </button>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
          >
            Resend code
          </button>
        </div>

        <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
          <Lock size={12} strokeWidth={1.5} /> Your details are encrypted and never shared.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sign in / Create account toggle */}
      <div className="grid grid-cols-2 border border-black/15">
        {(["signin", "register"] as const).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setStep("credentials"); setCode(""); setError(null); setNotice(null); }}
              className={`text-eyebrow py-3 transition-colors ${
                active
                  ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                  : "text-[var(--color-charcoal-800)] hover:text-[var(--color-burgundy-700)]"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <Field label="Full name" type="text" autoComplete="name" value={name} onChange={setName} required />
        )}
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
        <PasswordField
          label="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={setPassword}
          required
          minLength={6}
        />

        {mode === "signin" && (
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgot}
              disabled={loading}
              className="text-[0.8rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-[0.85rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-3 py-2">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in & continue" : "Create account & continue"}
          {!loading && <ArrowRight size={16} strokeWidth={1.5} />}
        </button>
      </form>

      <div className="mt-7 flex items-center gap-4 text-[var(--color-charcoal-400)]">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-eyebrow">or</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-7 w-full text-eyebrow inline-flex items-center justify-center gap-3 border border-[var(--color-charcoal-900)]/25 text-[var(--color-charcoal-900)] px-8 py-4 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60"
      >
        <GoogleMark /> Continue with Google
      </button>

      <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
        <Lock size={12} strokeWidth={1.5} /> Your details are encrypted and never shared.
      </p>
    </div>
  );
}

function Field({
  label, type, autoComplete, value, onChange, required, minLength,
}: {
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-[var(--color-ivory-100)] border border-black/15 px-4 py-3.5 text-[1rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
      />
    </label>
  );
}

/**
 * Password input with a show/hide eye toggle, so the customer can confirm
 * what they typed before signing in or creating an account.
 */
function PasswordField({
  label, autoComplete, value, onChange, required, minLength,
}: {
  label: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{label}</span>
      <div className="relative mt-2">
        <input
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[var(--color-ivory-100)] border border-black/15 px-4 py-3.5 pr-12 text-[1rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
        >
          {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
