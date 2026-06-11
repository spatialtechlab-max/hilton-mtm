-- Rotating hero-banner slides. The homepage renders these in a horizontal
-- slide-left carousel that advances every 4 seconds. Admin maintains the
-- list (upload image, set alt text, toggle active, reorder). When the
-- list is empty the homepage falls back to the single home.hero media slot.

create table if not exists mtm_hero_slides (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  alt         text,
  position    integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists mtm_hero_slides_active_position_idx
  on mtm_hero_slides (active, position) where active = true;

alter table mtm_hero_slides enable row level security;

-- Read is public — the homepage renders the slides for every visitor
-- (signed-in or not), so SELECT must work for anon.
drop policy if exists "hero_slides_public_read" on mtm_hero_slides;
create policy "hero_slides_public_read" on mtm_hero_slides
  for select using (true);

-- Admins manage the list. Same email-allowlist gate as the rest of the
-- admin tables so the /admin/hero UI can write directly with the
-- normal supabase client.
drop policy if exists "hero_slides_admin_write" on mtm_hero_slides;
create policy "hero_slides_admin_write" on mtm_hero_slides
  for all to authenticated
  using ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) )
  with check ( exists (select 1 from mtm_admins where email = (auth.jwt() ->> 'email')) );

-- updated_at trigger reuses the existing helper.
drop trigger if exists mtm_hero_slides_touch on mtm_hero_slides;
create trigger mtm_hero_slides_touch
  before update on mtm_hero_slides
  for each row execute function mtm_touch_updated_at();
