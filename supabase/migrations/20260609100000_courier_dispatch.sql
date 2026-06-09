-- Adds courier dispatch fields to mtm_orders so the atelier can record
-- carrier + tracking when shipping a finished commission. The customer
-- sees them on their order page; an email goes out the moment ops saves
-- the row.

alter table mtm_orders
  add column if not exists courier_name      text,
  add column if not exists tracking_number   text,
  add column if not exists tracking_url      text,
  add column if not exists dispatched_at     timestamptz;

-- Index for ops to filter "anything dispatched in the last week".
create index if not exists mtm_orders_dispatched_at_idx
  on mtm_orders (dispatched_at desc);
