-- BENEFIT Payment Gateway as a SECOND payment rail alongside MPGS.
--
-- Deliberately no new pending table: both gateways stash the same fully-priced
-- order in mtm_pending_checkouts and differ only by provider. One promotion
-- path means one place where an order can be created, which is what keeps the
-- two rails from drifting apart.
--
-- Idempotent, in the house style. Safe to re-run.

-- Which gateway owns this checkout. Existing rows are all MPGS.
alter table mtm_pending_checkouts
  add column if not exists provider text not null default 'mpgs';

do $$ begin
  alter table mtm_pending_checkouts
    add constraint mtm_pending_checkouts_provider_check
    check (provider in ('mpgs', 'benefit'));
exception when duplicate_object then null; end $$;

-- BENEFIT types trackId as Numeric, so the `hmtm<uuid-hex>` refs minted for
-- MPGS cannot be reused. The gateway echoes trackId back on the notification
-- and it is the ONLY field that ties their callback to our pending row, so it
-- must be unique. A partial index keeps the uniqueness off the MPGS rows,
-- which leave it null.
alter table mtm_pending_checkouts
  add column if not exists track_id text;

create unique index if not exists mtm_pending_checkouts_track_id_key
  on mtm_pending_checkouts (track_id) where track_id is not null;

-- Their paymentId, kept so a support query can match a customer's complaint to
-- a transaction in the BENEFIT portal without decrypting anything.
alter table mtm_pending_checkouts
  add column if not exists provider_payment_id text;

-- Same two columns on the real order, for reconciliation after promotion.
alter table mtm_orders
  add column if not exists payment_provider text;

alter table mtm_orders
  add column if not exists payment_track_id text;

-- payment_ref is already unique on mtm_orders and is what makes promotion
-- idempotent. BENEFIT reuses it, storing the gateway's paymentId, so a
-- duplicate notification cannot create a second order.

comment on column mtm_pending_checkouts.provider is
  'Which gateway is handling this checkout: mpgs (international cards) or benefit (Bahrain debit).';
comment on column mtm_pending_checkouts.track_id is
  'BENEFIT trackId. Numeric string, unique, the only link from their notification back to this row.';
