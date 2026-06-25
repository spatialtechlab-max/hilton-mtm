"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";

/**
 * Full-screen blocking second-factor gate. The AuthProvider renders this in
 * place of the app for any signed-in session that hasn't cleared the email
 * OTP yet (e.g. a fresh Google login). It emails a code on mount and only
 * releases the app once the code verifies.
 */
export function OtpGate({
  accessToken,
  email,
  onVerified,
  onSignOut,
}: {
  accessToken: string;
  email: string;
  onVerified: () => void;
  onSignOut: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>("We've emailed you a 6-digit code. It expires in one hour.");
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;            // send exactly once when the gate appears
    sentRef.current = true;
    fetch("/api/auth/session-otp/send", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json().catch(() => ({})))
      .then((d) => { if (d?.error) setError(d.error); })
      .catch(() => setError("Could not send your code. Use Resend below."));
  }, [accessToken]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setLoading(true);
    try {
      const r = await fetch("/api/auth/session-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.error || "Couldn't verify the code."); return; }
      onVerified();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null); setNotice(null); setLoading(true);
    try {
      const r = await fetch("/api/auth/session-otp/send", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.error || "Couldn't resend the code."); return; }
      setNotice("A new code is on its way. It expires in one hour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--color-ivory-100)] px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Verify it&rsquo;s you</span>
          <h2 className="text-display text-[1.8rem] mt-1 leading-tight">Enter your code</h2>
        </div>
        <form onSubmit={verify} className="space-y-4">
          <p className="text-[0.9rem] text-[var(--color-charcoal-500)] leading-relaxed text-center">
            For your security, every sign-in needs a one-time code. We emailed one to{" "}
            <span className="text-[var(--color-charcoal-900)]">{email}</span>.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full bg-white border border-black/15 px-4 py-3.5 text-center text-[1.5rem] tracking-[0.5em] text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-burgundy-700)] transition-colors"
          />
          {error && (
            <p className="text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">{error}</p>
          )}
          {notice && (
            <p className="text-[0.85rem] text-[var(--color-charcoal-800)] bg-[var(--color-ivory-200)] px-3 py-2">{notice}</p>
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
          <button type="button" onClick={onSignOut} disabled={loading} className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60">
            Sign out
          </button>
          <button type="button" onClick={resend} disabled={loading} className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-60">
            Resend code
          </button>
        </div>
        <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
          <Lock size={12} strokeWidth={1.5} /> Your details are encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
