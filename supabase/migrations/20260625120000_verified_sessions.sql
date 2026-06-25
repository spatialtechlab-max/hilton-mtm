-- Sessions that have cleared the email OTP second factor.
--
-- A Supabase session alone is NOT "logged in" for this app: the AuthProvider
-- blocks the whole UI behind an OTP challenge until the session's id appears
-- here. Password logins are inserted at /api/auth/login-otp/verify (they pass
-- OTP before the session exists); Google / OAuth and any other session are
-- challenged after the fact by /api/auth/session-otp/*. This is what makes the
-- OTP apply to EVERY login, not just email+password.
--
-- Service-role only (the session-otp routes), so RLS on with no policies.
create table if not exists public.mtm_verified_sessions (
  session_id  text primary key,
  email       text,
  verified_at timestamptz not null default now()
);

alter table public.mtm_verified_sessions enable row level security;

create index if not exists mtm_verified_sessions_verified_at_idx
  on public.mtm_verified_sessions (verified_at);
