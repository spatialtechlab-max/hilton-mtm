-- Admin-relayed login OTP for employees (staff taking the /learn quizzes).
--
-- The client does not trust staff to sit their own exam: an employee could ask
-- someone else to log in and take it. So staff no longer self-log-in. Instead:
--   1. the employee enters email + password at /account,
--   2. the server mints a 6-digit code but does NOT email it,
--   3. the code surfaces live in the admin's Team Access dashboard,
--   4. the admin reads it out on the spot; the employee types it to get in.
--
-- This reuses mtm_login_otps (same hash + expiry + attempt-cap machinery). Two
-- columns are added so an admin can display the code and so we can tell a
-- relayed (staff) code apart from an emailed (customer) one:
--   code_plain : the plaintext code, readable ONLY by the service-role admin
--                routes (the table is RLS-on with no policies, so no client can
--                read it). Null for emailed customer codes.
--   relay      : true for admin-relayed staff codes, false for emailed codes.
--
-- Expiry stays governed by expires_at; the app writes a 10-minute TTL for these.
alter table public.mtm_login_otps
  add column if not exists code_plain text,
  add column if not exists relay boolean not null default false;

-- Lets the Team Access dashboard find the current pending staff codes quickly.
create index if not exists mtm_login_otps_relay_idx
  on public.mtm_login_otps (relay, expires_at)
  where relay = true;
