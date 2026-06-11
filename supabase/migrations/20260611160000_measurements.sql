-- Saved customer measurements. One row per signed-in customer; the values
-- jsonb column holds a map keyed by measurement slug (see lib/customizer
-- measurementGroups) → numeric string. Unit applies to the whole map so
-- the customer doesn't have to toggle between cm and inches at every line.
--
-- Saved here so the customer fills the tape-measure flow ONCE from
-- /account/measurements (or during onboarding) and every future
-- commission pre-fills the numbers. They can still edit per-order in
-- the customizer if their build changes.

create table if not exists mtm_measurements (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  values      jsonb not null default '{}',
  unit        text not null default 'cm' check (unit in ('cm','in')),
  updated_at  timestamptz not null default now()
);

alter table mtm_measurements enable row level security;

-- Customers read and write their own row. Admins (mtm_admins) can read
-- everyone's so the master tailor can see saved numbers before a fitting.
drop policy if exists "measurements own read"  on mtm_measurements;
create policy "measurements own read" on mtm_measurements
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "measurements own insert" on mtm_measurements;
create policy "measurements own insert" on mtm_measurements
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "measurements own update" on mtm_measurements;
create policy "measurements own update" on mtm_measurements
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists mtm_measurements_touch on mtm_measurements;
create trigger mtm_measurements_touch
  before update on mtm_measurements
  for each row execute function mtm_touch_updated_at();
