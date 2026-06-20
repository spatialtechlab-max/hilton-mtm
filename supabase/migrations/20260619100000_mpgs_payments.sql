-- MPGS (Mastercard Payment Gateway Services, via AFS Bahrain) — pay-first checkout.
--
-- Flow: the customer pays on the hosted MPGS page BEFORE any order exists.
--   1. /api/payments/mpgs/session stashes the fully-priced order here as a
--      pending checkout and asks MPGS for a session.
--   2. The customer pays (card data only ever touches Mastercard).
--   3. /api/payments/mpgs/verify confirms the gateway captured the funds, then
--      promotes the pending row into a real mtm_orders row (idempotent on the
--      gateway reference). A failed/abandoned payment leaves nothing behind.
--
-- This table is service-role only: RLS is on and there are NO policies, so the
-- anon/authenticated keys can't read or write it. The server uses the service
-- role to bypass RLS for both insert (session) and promote (verify).

create table if not exists public.mtm_pending_checkouts (
  id           text         primary key,          -- the gateway order reference we mint
  user_id      uuid         not null references auth.users(id) on delete cascade,
  session_id   text,                              -- MPGS checkout session id
  success_indicator text,                         -- MPGS successIndicator (extra cross-check)
  amount       numeric(12,3) not null,            -- grand total charged (BHD, 3dp)
  currency     text         not null default 'BHD',
  payload      jsonb        not null,             -- { orderRow, lineRows } ready to insert
  status       text         not null default 'pending',  -- pending | consumed | failed
  order_id     uuid,                              -- set once promoted to a real order
  created_at   timestamptz  not null default now()
);

create index if not exists mtm_pending_checkouts_user on public.mtm_pending_checkouts (user_id);
create index if not exists mtm_pending_checkouts_created on public.mtm_pending_checkouts (created_at);

alter table public.mtm_pending_checkouts enable row level security;
-- No policies on purpose. Service role only.

-- Payment provenance on the order itself, so /admin and the customer order page
-- can show "Paid" and reconcile against the gateway. Display-time totals (VAT,
-- shipping) still come from lib/checkoutFees; paid_total is what actually cleared.
alter table public.mtm_orders add column if not exists payment_ref    text;
alter table public.mtm_orders add column if not exists payment_status text;          -- e.g. 'CAPTURED'
alter table public.mtm_orders add column if not exists paid_total     numeric(12,3); -- grand total cleared (BHD)
alter table public.mtm_orders add column if not exists paid_at        timestamptz;

create unique index if not exists mtm_orders_payment_ref_uniq
  on public.mtm_orders (payment_ref) where payment_ref is not null;
