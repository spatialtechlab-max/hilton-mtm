-- Body-measurement photos attached to an order. Per the agreed scope:
--   • Up to 4 photos per order, one per labeled view (Front / Back /
--     Left side / Right side).
--   • All slots are optional — applies to every order type, not just
--     custom commissions, because even a belt or stock-tie order may
--     benefit from the cutter having body context.
--   • Storage uses the private `order-media` bucket (created via the
--     Storage admin UI); the table just holds path + content type + the
--     view label. Customers can read+write their own; admins can read
--     everything via the same email-allowlist gate the rest of the
--     admin uses.
--   • Photos sit on the order, not on the user, because they're
--     captured at-checkout for a specific commission and shouldn't
--     follow the customer between unrelated orders.

create table if not exists mtm_order_media (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references mtm_orders(id) on delete cascade,
  view          text not null check (view in ('front','back','left','right')),
  storage_path  text not null,
  content_type  text,
  size_bytes    integer,
  uploaded_at   timestamptz not null default now(),
  -- One row per view per order. Re-uploading replaces the prior row
  -- (the cart deletes the old one first).
  unique (order_id, view)
);

create index if not exists mtm_order_media_order_idx on mtm_order_media (order_id);

alter table mtm_order_media enable row level security;

-- Customers can read + write photos on orders they own. RLS on
-- mtm_orders already restricts mtm_orders.user_id to the row owner,
-- so we mirror that by joining on user_id via auth.uid().
drop policy if exists "users read own order media" on mtm_order_media;
create policy "users read own order media" on mtm_order_media
  for select to authenticated
  using ( exists (select 1 from mtm_orders o where o.id = order_id and o.user_id = auth.uid()) );

drop policy if exists "users insert own order media" on mtm_order_media;
create policy "users insert own order media" on mtm_order_media
  for insert to authenticated
  with check ( exists (select 1 from mtm_orders o where o.id = order_id and o.user_id = auth.uid()) );

drop policy if exists "users update own order media" on mtm_order_media;
create policy "users update own order media" on mtm_order_media
  for update to authenticated
  using ( exists (select 1 from mtm_orders o where o.id = order_id and o.user_id = auth.uid()) );

drop policy if exists "users delete own order media" on mtm_order_media;
create policy "users delete own order media" on mtm_order_media
  for delete to authenticated
  using ( exists (select 1 from mtm_orders o where o.id = order_id and o.user_id = auth.uid()) );

-- Admins see everything for the desk view.
drop policy if exists "admins read all order media" on mtm_order_media;
create policy "admins read all order media" on mtm_order_media
  for select to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );
