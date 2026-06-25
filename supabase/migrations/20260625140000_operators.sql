-- Operators: limited-access store staff who can use ONLY the ERP image tool
-- (fill in / generate images for products that lack them). They are NOT admins
-- and never see the rest of the admin panel.
--
-- Mirrors mtm_admins: public SELECT so the client can check operator status;
-- writes are service-role only (the admin "Operators" page creates them).
-- Operators are exempt from the login OTP for now (email + password only),
-- enforced in the auth routes alongside mtm_admins.
create table if not exists public.mtm_operators (
  email       text primary key,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table public.mtm_operators enable row level security;

drop policy if exists "mtm_operators read" on public.mtm_operators;
create policy "mtm_operators read" on public.mtm_operators for select using (true);
