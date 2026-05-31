-- ─────────────────────────────────────────────────────────────────
-- Fix the admin@hiltonmtm.com row in auth.users.
--
-- BACKGROUND: When admin@hiltonmtm.com was bootstrapped via raw
-- INSERT INTO auth.users (so the atelier could log in immediately),
-- the token-related columns were left NULL. GoTrue v2.117+ Scan()s
-- those columns as Go strings — NULL → "unsupported" → it returns
-- HTTP 500 "Database error querying schema" on every sign-in
-- attempt for that user.
--
-- This migration is idempotent: replace every NULL token column with
-- an empty string, ensure the email is confirmed, ensure aud/role are
-- set, and reset the password to a known value. After running this
-- (via `supabase db push` OR by pasting into the dashboard SQL
-- editor), sign-in with admin@hiltonmtm.com / Hilton@MTM2026 works.
--
-- Reference: https://github.com/supabase/auth/issues/1940
-- ─────────────────────────────────────────────────────────────────

update auth.users
set
  aud                       = coalesce(nullif(aud, ''), 'authenticated'),
  role                      = coalesce(nullif(role, ''), 'authenticated'),
  email_confirmed_at        = coalesce(email_confirmed_at, now()),
  confirmation_token        = coalesce(confirmation_token, ''),
  recovery_token            = coalesce(recovery_token, ''),
  email_change              = coalesce(email_change, ''),
  email_change_token_new    = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change              = coalesce(phone_change, ''),
  phone_change_token        = coalesce(phone_change_token, ''),
  reauthentication_token    = coalesce(reauthentication_token, ''),
  encrypted_password        = crypt('Hilton@MTM2026', gen_salt('bf')),
  raw_app_meta_data         = coalesce(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  raw_user_meta_data        = coalesce(raw_user_meta_data, jsonb_build_object('email', email, 'email_verified', true)),
  instance_id               = coalesce(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
  updated_at                = now()
where email = 'admin@hiltonmtm.com';

-- Ensure the email→identity link exists in auth.identities so GoTrue's
-- lookup-by-email path succeeds.
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email = 'admin@hiltonmtm.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- Make sure the allowlist + profile rows exist (idempotent).
insert into public.mtm_admins (email)
values ('admin@hiltonmtm.com')
on conflict (email) do nothing;

insert into public.mtm_profiles (id, full_name, phone, address_line1, city, country)
select id, 'Hilton Atelier Admin', '+973 17 245 689',
       'Shop No. 119, Shaikh Abdulla Avenue', 'Manama', 'Bahrain'
from auth.users where email = 'admin@hiltonmtm.com'
on conflict (id) do update set updated_at = now();
