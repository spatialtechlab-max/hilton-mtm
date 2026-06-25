-- Email OTP (second factor) for password logins.
--
-- Flow: /api/auth/login-otp/start verifies the password server-side, writes a
-- hashed 6-digit code here, and emails it via Resend. /api/auth/login-otp/verify
-- checks the code, then returns a fresh session. One active code per email
-- (the email is the primary key, so a new request replaces the old code).
--
-- Only the service role (used by those two routes) ever touches this table, so
-- RLS is enabled with NO policies — anon/authenticated clients get nothing.
create table if not exists public.mtm_login_otps (
  email       text primary key,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  consumed    boolean     not null default false,
  attempts    integer     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.mtm_login_otps enable row level security;

-- Helps a future cron sweep expired rows; harmless otherwise.
create index if not exists mtm_login_otps_expires_idx
  on public.mtm_login_otps (expires_at);
