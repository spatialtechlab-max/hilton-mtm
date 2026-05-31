-- ─────────────────────────────────────────────────────────────────
-- Orders + customer profiles + order status history
--
-- A customer signs in (Google or email/password), then completes a
-- one-time profile form with billing name + phone + address. When they
-- check out, an order is created with a friendly order number
-- (HMTM-YYYY-NNNN). Admins can update order status; the audit trail
-- is captured in order_status_history.
-- ─────────────────────────────────────────────────────────────────

-- Customer profile, one row per authenticated user.
create table if not exists public.mtm_profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text        not null default '',
  phone         text        not null default '',
  address_line1 text        not null default '',
  address_line2 text        not null default '',
  city          text        not null default '',
  country       text        not null default 'Bahrain',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Order status enum. Lifecycle reflects a bespoke MTM commission.
do $$ begin
  create type public.mtm_order_status as enum (
    'placed',          -- order received
    'confirmed',       -- atelier confirmed
    'cloth_received',  -- fabric arrived
    'cutting',         -- in cutting
    'in_production',   -- being stitched
    'fitting_ready',   -- ready for first fitting
    'finishing',       -- final adjustments
    'ready_for_pickup',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- Yearly sequence powering the human-friendly order number.
create sequence if not exists public.mtm_order_seq;

create or replace function public.mtm_next_order_number()
returns text
language plpgsql
as $$
declare
  seq bigint;
begin
  seq := nextval('public.mtm_order_seq');
  return 'HMTM-' || to_char(now(), 'YYYY') || '-' || lpad(seq::text, 4, '0');
end;
$$;

create table if not exists public.mtm_orders (
  id              uuid             primary key default gen_random_uuid(),
  order_number    text             not null unique default public.mtm_next_order_number(),
  user_id         uuid             not null references auth.users(id) on delete cascade,
  status          mtm_order_status not null default 'placed',
  -- Customer snapshot at the time of order (so profile updates don't rewrite history)
  customer_name   text             not null default '',
  customer_email  text             not null default '',
  customer_phone  text             not null default '',
  shipping_address jsonb           not null default '{}'::jsonb,
  -- Pricing
  subtotal        numeric(12,3)    not null default 0,
  currency        text             not null default 'BHD',
  -- Free-text customer note
  notes           text             not null default '',
  created_at      timestamptz      not null default now(),
  updated_at      timestamptz      not null default now()
);

create index if not exists mtm_orders_user_id_idx     on public.mtm_orders(user_id);
create index if not exists mtm_orders_status_idx      on public.mtm_orders(status);
create index if not exists mtm_orders_created_at_idx  on public.mtm_orders(created_at desc);

-- One row per line item. For a bespoke commission, `custom` holds the
-- full spec (fabric, tier, every option selection) as JSON.
create table if not exists public.mtm_order_items (
  id          uuid          primary key default gen_random_uuid(),
  order_id    uuid          not null references public.mtm_orders(id) on delete cascade,
  item_type   text          not null default 'product',  -- 'product' or 'commission'
  sku         text          not null default '',
  name        text          not null default '',
  type_label  text          not null default '',         -- e.g. "Whole-Cut Oxford"
  price_num   numeric(12,3) not null default 0,
  qty         integer       not null default 1,
  image       text          not null default '',
  custom      jsonb         not null default '{}'::jsonb,
  created_at  timestamptz   not null default now()
);

create index if not exists mtm_order_items_order_id_idx on public.mtm_order_items(order_id);

-- Audit trail of every status change.
create table if not exists public.mtm_order_status_history (
  id          uuid             primary key default gen_random_uuid(),
  order_id    uuid             not null references public.mtm_orders(id) on delete cascade,
  status      mtm_order_status not null,
  note        text             not null default '',
  changed_by  uuid             references auth.users(id) on delete set null,
  changed_at  timestamptz      not null default now()
);

create index if not exists mtm_order_status_history_order_id_idx on public.mtm_order_status_history(order_id, changed_at desc);

-- ─────────────────────────── RLS ───────────────────────────

alter table public.mtm_profiles            enable row level security;
alter table public.mtm_orders              enable row level security;
alter table public.mtm_order_items         enable row level security;
alter table public.mtm_order_status_history enable row level security;

-- Helper: is the current authenticated email in the admin allowlist?
create or replace function public.mtm_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mtm_admins a
    where a.email = (select email from auth.users where id = auth.uid())
  );
$$;

-- Profiles: user manages their own; admin reads all
drop policy if exists "profiles_select_own" on public.mtm_profiles;
create policy "profiles_select_own" on public.mtm_profiles
  for select using (id = auth.uid() or public.mtm_is_admin());

drop policy if exists "profiles_insert_own" on public.mtm_profiles;
create policy "profiles_insert_own" on public.mtm_profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.mtm_profiles;
create policy "profiles_update_own" on public.mtm_profiles
  for update using (id = auth.uid() or public.mtm_is_admin());

-- Orders: user reads/inserts own; admin reads all + can update status
drop policy if exists "orders_select_own_or_admin" on public.mtm_orders;
create policy "orders_select_own_or_admin" on public.mtm_orders
  for select using (user_id = auth.uid() or public.mtm_is_admin());

drop policy if exists "orders_insert_own" on public.mtm_orders;
create policy "orders_insert_own" on public.mtm_orders
  for insert with check (user_id = auth.uid());

drop policy if exists "orders_update_admin" on public.mtm_orders;
create policy "orders_update_admin" on public.mtm_orders
  for update using (public.mtm_is_admin());

-- Items: same scope as parent order
drop policy if exists "order_items_select_own_or_admin" on public.mtm_order_items;
create policy "order_items_select_own_or_admin" on public.mtm_order_items
  for select using (
    exists (select 1 from public.mtm_orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.mtm_is_admin()))
  );

drop policy if exists "order_items_insert_own" on public.mtm_order_items;
create policy "order_items_insert_own" on public.mtm_order_items
  for insert with check (
    exists (select 1 from public.mtm_orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Status history: customers can read their own; only admins can insert
drop policy if exists "status_history_select_own_or_admin" on public.mtm_order_status_history;
create policy "status_history_select_own_or_admin" on public.mtm_order_status_history
  for select using (
    exists (select 1 from public.mtm_orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.mtm_is_admin()))
  );

drop policy if exists "status_history_insert_admin" on public.mtm_order_status_history;
create policy "status_history_insert_admin" on public.mtm_order_status_history
  for insert with check (public.mtm_is_admin());

-- ─────────────────────────── Triggers ───────────────────────────

-- Auto-update updated_at on profiles + orders
create or replace function public.mtm_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists mtm_profiles_touch on public.mtm_profiles;
create trigger mtm_profiles_touch before update on public.mtm_profiles
  for each row execute function public.mtm_touch_updated_at();

drop trigger if exists mtm_orders_touch on public.mtm_orders;
create trigger mtm_orders_touch before update on public.mtm_orders
  for each row execute function public.mtm_touch_updated_at();

-- When an order's status changes, record it in the history table.
create or replace function public.mtm_log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.mtm_order_status_history(order_id, status, changed_by)
      values (new.id, new.status, new.user_id);
  elsif (new.status is distinct from old.status) then
    insert into public.mtm_order_status_history(order_id, status, changed_by)
      values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists mtm_orders_status_log on public.mtm_orders;
create trigger mtm_orders_status_log after insert or update of status on public.mtm_orders
  for each row execute function public.mtm_log_status_change();
