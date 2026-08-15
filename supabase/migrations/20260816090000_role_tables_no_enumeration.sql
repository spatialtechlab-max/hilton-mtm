-- Stop any signed-in user from listing every privileged account.
--
-- mtm_admins, mtm_operators and mtm_employees each had a SELECT policy of
-- USING (true), so a customer with an ordinary account could read the full set
-- of admin, operator and staff email addresses. That is a finished target list
-- for phishing or credential stuffing, and it sat alongside a login endpoint
-- that had no rate limit until 2026-08-16.
--
-- The policies were written that way because lib/admin.ts fetched the whole
-- table and tested membership in the browser. That helper now asks only about
-- the signed-in address, so the policies can be narrowed to "you may see your
-- own row" without changing what the app can do:
--
--   an admin still resolves as an admin (their row is visible to them)
--   everyone else gets an empty result, exactly as before
--
-- Server-side checks are unaffected either way: assertAdmin / assertStaff and
-- every admin API route use the service role, which bypasses RLS.

-- mtm_admins ---------------------------------------------------------------
drop policy if exists "mtm_admins read" on mtm_admins;
create policy "mtm_admins read own" on mtm_admins
  for select to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );

-- mtm_operators ------------------------------------------------------------
drop policy if exists "mtm_operators read" on mtm_operators;
create policy "mtm_operators read own" on mtm_operators
  for select to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );

-- mtm_employees ------------------------------------------------------------
-- Note: /admin/employees (Team Access) lists the whole roster, but it does so
-- through /api/admin/access with the service role, so it is unaffected.
drop policy if exists "mtm_employees read" on mtm_employees;
create policy "mtm_employees read own" on mtm_employees
  for select to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );
