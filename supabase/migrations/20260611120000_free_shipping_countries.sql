-- Free-shipping country list. Admin maintains the rows; whenever a customer's
-- shipping country (case-insensitive trim) matches one of these, the flat
-- 3 BHD shipping fee is waived at display time. The actual fee constant
-- still lives in lib/checkoutFees.ts; this table only controls the predicate.

create table if not exists mtm_free_shipping_countries (
  id          uuid primary key default gen_random_uuid(),
  country     text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists mtm_free_shipping_countries_country_uq
  on mtm_free_shipping_countries (lower(country));

alter table mtm_free_shipping_countries enable row level security;

-- Read is open: the cart needs the list to render "Shipping: Free" before
-- the customer signs in (anon supabase client), so we keep SELECT public.
-- The list is not sensitive — it's effectively house policy on display.
drop policy if exists "fsc_select_all" on mtm_free_shipping_countries;
create policy "fsc_select_all" on mtm_free_shipping_countries
  for select using (true);

-- Admins get full CRUD via the same email-allowlist gate the rest of the
-- admin tables use, so the /admin/shipping UI can write directly with the
-- normal supabase client.
drop policy if exists "admins manage free shipping countries" on mtm_free_shipping_countries;
create policy "admins manage free shipping countries" on mtm_free_shipping_countries
  for all to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) )
  with check ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );

-- Seed: Bahrain ships free as house policy, matching local-delivery norms.
insert into mtm_free_shipping_countries (country)
values ('Bahrain')
on conflict do nothing;
