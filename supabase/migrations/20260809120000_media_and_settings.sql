-- Backfills the two tables that production has always had but no migration
-- ever created: they were made by hand in the Supabase dashboard, so a replay
-- of this folder onto a fresh database produced an app with no editorial
-- imagery and no admin-editable copy. Found on 2026-08-09 while standing up
-- the self-hosted stack, where every table came from these files.
--
-- Column definitions were read back from the live database, so this matches
-- production exactly rather than being a guess.
--
--   mtm_media    - editorial image overrides, keyed by slot (e.g. home.hero,
--                  library.suits.cover). lib/media.ts and mediaSlots.ts read it.
--   mtm_settings - every admin-editable string and tier price, keyed by the
--                  registry in lib/settingsRegistry.ts. Also carries the
--                  per-garment customizer step order (step.order.<garment>)
--                  and vat.rate, which the payment session reads.
--
-- Both are public-read (the storefront renders them for signed-out visitors)
-- and admin-write, matching mtm_hero_slides.

create table if not exists mtm_media (
  slot        text primary key,
  url         text not null,
  alt         text,
  updated_at  timestamptz not null default now()
);

create table if not exists mtm_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

alter table mtm_media    enable row level security;
alter table mtm_settings enable row level security;

-- Public read: both feed server-rendered pages seen by anonymous visitors.
drop policy if exists "media_public_read" on mtm_media;
create policy "media_public_read" on mtm_media
  for select using (true);

drop policy if exists "settings_public_read" on mtm_settings;
create policy "settings_public_read" on mtm_settings
  for select using (true);

-- Admin write, same email-allowlist gate as the other admin-managed tables so
-- /admin/media and /admin/settings can write with the normal client.
drop policy if exists "media_admin_write" on mtm_media;
create policy "media_admin_write" on mtm_media
  for all to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) )
  with check ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );

drop policy if exists "settings_admin_write" on mtm_settings;
create policy "settings_admin_write" on mtm_settings
  for all to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) )
  with check ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );

drop trigger if exists mtm_media_touch on mtm_media;
create trigger mtm_media_touch
  before update on mtm_media
  for each row execute function mtm_touch_updated_at();

drop trigger if exists mtm_settings_touch on mtm_settings;
create trigger mtm_settings_touch
  before update on mtm_settings
  for each row execute function mtm_touch_updated_at();
