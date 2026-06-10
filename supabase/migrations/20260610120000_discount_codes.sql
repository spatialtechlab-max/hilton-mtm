-- Discount-code module. Per the agreed scope:
--   • Code is always 5 chars: the first 3 are A-Z/0-9 free-form, the last 2
--     are numeric digits (e.g. DIS25, SAL75, HOT10).
--   • Discount is always a percentage of subtotal — never a fixed BHD amount,
--     never product-targeted.
--   • Codes are time-bound (starts_at → ends_at) and have an active toggle.
--   • No per-code usage cap for now (every order in the window can claim).
--   • One discount per order. The order row keeps a frozen snapshot of the
--     code, the percent, and the amount in BHD so reporting is correct
--     even if the code is later edited or deleted.

create table if not exists mtm_discount_codes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  percent_off  integer not null check (percent_off between 1 and 99),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint mtm_discount_codes_format check (code ~ '^[A-Z0-9]{3}[0-9]{2}$'),
  constraint mtm_discount_codes_window check (ends_at > starts_at)
);

create index if not exists mtm_discount_codes_active_idx
  on mtm_discount_codes (active, starts_at, ends_at) where active = true;

-- Audit columns on the order. Server stamps these when a code is redeemed;
-- they stay null on orders that didn't use a discount.
alter table mtm_orders
  add column if not exists discount_code    text,
  add column if not exists discount_percent integer,
  add column if not exists discount_amount  numeric(10,2);

-- RLS: customers never read mtm_discount_codes directly — the server route
-- /api/discount-codes/validate handles lookups with the service-role key
-- so codes can't be enumerated client-side. Admins get full CRUD via the
-- same email-allowlist gate used elsewhere.
alter table mtm_discount_codes enable row level security;

drop policy if exists "admins manage discount codes" on mtm_discount_codes;
create policy "admins manage discount codes" on mtm_discount_codes
  for all to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) )
  with check ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );

-- updated_at trigger
create or replace function mtm_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists mtm_discount_codes_touch on mtm_discount_codes;
create trigger mtm_discount_codes_touch
  before update on mtm_discount_codes
  for each row execute function mtm_touch_updated_at();
