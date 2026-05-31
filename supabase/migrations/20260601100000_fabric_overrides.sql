-- ─────────────────────────────────────────────────────────────────
-- Fabric visibility overrides.
--
-- Fabrics are sourced live from the ERP. The atelier can hide individual
-- fabrics from the storefront without touching the ERP, by storing an
-- override row here with active=false. Rows are keyed by the ERP item id
-- (the same value the storefront uses as SKU).
--
-- Default behaviour: a fabric NOT in this table is shown. Only fabrics
-- explicitly toggled off are hidden.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.mtm_fabric_overrides (
  sku        text        primary key,
  active     boolean     not null default true,
  note       text        not null default '',
  updated_at timestamptz not null default now()
);

alter table public.mtm_fabric_overrides enable row level security;

-- Anyone (including the public fabrics API) can read; only admins can write.
drop policy if exists "fabric_overrides_read_all" on public.mtm_fabric_overrides;
create policy "fabric_overrides_read_all" on public.mtm_fabric_overrides
  for select using (true);

drop policy if exists "fabric_overrides_admin_upsert" on public.mtm_fabric_overrides;
create policy "fabric_overrides_admin_upsert" on public.mtm_fabric_overrides
  for insert with check (public.mtm_is_admin());

drop policy if exists "fabric_overrides_admin_update" on public.mtm_fabric_overrides;
create policy "fabric_overrides_admin_update" on public.mtm_fabric_overrides
  for update using (public.mtm_is_admin());

drop policy if exists "fabric_overrides_admin_delete" on public.mtm_fabric_overrides;
create policy "fabric_overrides_admin_delete" on public.mtm_fabric_overrides
  for delete using (public.mtm_is_admin());

-- Auto-touch updated_at on edits.
drop trigger if exists mtm_fabric_overrides_touch on public.mtm_fabric_overrides;
create trigger mtm_fabric_overrides_touch before update on public.mtm_fabric_overrides
  for each row execute function public.mtm_touch_updated_at();
