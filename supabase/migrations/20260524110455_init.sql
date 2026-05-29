-- ============================================================================
-- Hilton MTM — admin-editable customization config (+ media bucket)
-- Applied via the Supabase CLI: `supabase db push`.
-- ============================================================================

-- ── Admins ──────────────────────────────────────────────────────────────────
create table if not exists public.mtm_admins (
  email text primary key
);
alter table public.mtm_admins enable row level security;

drop policy if exists "mtm_admins read" on public.mtm_admins;
create policy "mtm_admins read" on public.mtm_admins for select using (true);

insert into public.mtm_admins (email) values ('spatial.techlab@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin() returns boolean
  language sql stable as $$
  select exists (
    select 1 from public.mtm_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ── Steps ────────────────────────────────────────────────────────────────────
create table if not exists public.mtm_steps (
  slug           text primary key,
  title          text not null,
  eyebrow        text,
  subtitle       text,
  description    text,
  kind           text not null default 'diagram',
  applies_to     text[] not null default '{}',
  tier           text,
  requires_slug  text,
  requires_value text,
  sort_order     int  not null default 0,
  active         boolean not null default true,
  updated_at     timestamptz not null default now()
);

-- ── Options ──────────────────────────────────────────────────────────────────
create table if not exists public.mtm_options (
  id          uuid primary key default gen_random_uuid(),
  step_slug   text not null references public.mtm_steps(slug) on delete cascade,
  value       text not null,
  label       text not null,
  note        text,
  color       text,
  image_url   text,
  surcharge   numeric not null default 0,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (step_slug, value)
);
create index if not exists mtm_options_step_idx on public.mtm_options (step_slug);

alter table public.mtm_steps   enable row level security;
alter table public.mtm_options enable row level security;

drop policy if exists "mtm_steps read" on public.mtm_steps;
create policy "mtm_steps read" on public.mtm_steps for select using (true);
drop policy if exists "mtm_options read" on public.mtm_options;
create policy "mtm_options read" on public.mtm_options for select using (true);

drop policy if exists "mtm_steps write" on public.mtm_steps;
create policy "mtm_steps write" on public.mtm_steps
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mtm_options write" on public.mtm_options;
create policy "mtm_options write" on public.mtm_options
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Storage bucket for option images (no dashboard needed) ────────────────────
insert into storage.buckets (id, name, public)
values ('mtm-media', 'mtm-media', true)
on conflict (id) do nothing;

drop policy if exists "mtm-media read" on storage.objects;
create policy "mtm-media read" on storage.objects
  for select using (bucket_id = 'mtm-media');

drop policy if exists "mtm-media write" on storage.objects;
create policy "mtm-media write" on storage.objects
  for all using (bucket_id = 'mtm-media' and public.is_admin())
  with check (bucket_id = 'mtm-media' and public.is_admin());
