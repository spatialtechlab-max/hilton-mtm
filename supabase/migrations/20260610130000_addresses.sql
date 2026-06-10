-- Customer address book. Each user can save up to 5 addresses, exactly
-- one of which is marked is_default. The checkout pre-selects the
-- default but lets the visitor swap to another saved address or add a
-- brand new one inline.
--
-- mtm_profiles already stores a single legacy address (line1/2/city/
-- country/phone). We keep those columns for now so older code paths
-- don't break — they're seeded into mtm_addresses below as each
-- visitor's default, and once the rest of the codebase reads from the
-- new table we can drop them in a later cleanup.

create table if not exists mtm_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,                           -- optional pet name e.g. "Home", "Office"
  full_name   text not null,                  -- per-address recipient (gifting etc.)
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  country     text not null default 'Bahrain',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists mtm_addresses_user_idx on mtm_addresses (user_id);

-- At most one default per user. Partial-unique so non-default rows are
-- free to co-exist.
create unique index if not exists mtm_addresses_default_per_user
  on mtm_addresses (user_id) where is_default = true;

-- RLS: each user can only see + manage their own addresses.
alter table mtm_addresses enable row level security;

drop policy if exists "users read own addresses" on mtm_addresses;
create policy "users read own addresses" on mtm_addresses
  for select to authenticated
  using ( user_id = auth.uid() );

drop policy if exists "users write own addresses" on mtm_addresses;
create policy "users write own addresses" on mtm_addresses
  for all to authenticated
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- updated_at trigger (re-uses the function created in the discount-codes
-- migration; create-or-replace makes this idempotent if run separately).
create or replace function mtm_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists mtm_addresses_touch on mtm_addresses;
create trigger mtm_addresses_touch
  before update on mtm_addresses
  for each row execute function mtm_touch_updated_at();

-- Seed: copy each existing profile's address into mtm_addresses as the
-- visitor's default. Skip rows that already have an address (idempotent
-- re-run) and rows where the profile has no usable shipping line yet.
insert into mtm_addresses (user_id, full_name, phone, line1, line2, city, country, is_default)
select
  p.id,
  coalesce(nullif(p.full_name, ''), 'Customer'),
  coalesce(nullif(p.phone, ''), ''),
  p.address_line1,
  p.address_line2,
  p.city,
  coalesce(nullif(p.country, ''), 'Bahrain'),
  true
from mtm_profiles p
where p.address_line1 is not null and p.address_line1 <> ''
  and p.city is not null and p.city <> ''
  and not exists (select 1 from mtm_addresses a where a.user_id = p.id);
