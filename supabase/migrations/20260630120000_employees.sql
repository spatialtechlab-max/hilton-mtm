-- Employees: internal staff with access to the Employee Learning Platform
-- (the in-house LMS at /learn). Mirrors mtm_operators / mtm_admins: public
-- SELECT so the browser can check employee status; writes are service-role
-- only (the admin "Employees" page creates and removes them). Employees are
-- exempt from the login OTP for now, enforced in the auth routes alongside
-- mtm_admins and mtm_operators (see lib/loginOtp.ts isOtpExemptEmail).
create table if not exists public.mtm_employees (
  email      text primary key,
  full_name  text,
  added_at   timestamptz not null default now()
);

alter table public.mtm_employees enable row level security;

drop policy if exists "mtm_employees read" on public.mtm_employees;
create policy "mtm_employees read" on public.mtm_employees for select using (true);

-- Per-employee progress through the course. One row per (user, module_slug).
-- lessons_completed holds the lesson slugs the employee has stepped through;
-- quiz_best_score is the highest quiz percentage kept across attempts.
--
-- A signed-in user reads and writes only their OWN rows (auth.uid() =
-- user_id). Admins (mtm_admins) can read everyone's so the atelier can run
-- the completion tracker on /admin/employees.
create table if not exists public.mtm_employee_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  email             text,
  module_slug       text not null,
  lessons_completed text[] not null default '{}',
  quiz_best_score   int,
  quiz_attempts     int not null default 0,
  quiz_passed       boolean not null default false,
  updated_at        timestamptz not null default now(),
  unique (user_id, module_slug)
);

alter table public.mtm_employee_progress enable row level security;

-- Own rows + admins can read.
drop policy if exists "mtm_employee_progress own read" on public.mtm_employee_progress;
create policy "mtm_employee_progress own read" on public.mtm_employee_progress
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email'))
  );

-- Own rows only for writes.
drop policy if exists "mtm_employee_progress own insert" on public.mtm_employee_progress;
create policy "mtm_employee_progress own insert" on public.mtm_employee_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "mtm_employee_progress own update" on public.mtm_employee_progress;
create policy "mtm_employee_progress own update" on public.mtm_employee_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
