-- Atelier-managed garment list. Lets the admin add / remove / re-label
-- garment commissions (e.g. Overcoat, Tuxedo, Chino Pants) without a
-- code change, so the storefront can rotate offerings seasonally.
--
-- Steps stay coupled to garments through their existing `applies_to`
-- text[] column (e.g. {"suit","jacket"}) — adding a new garment slug
-- here doesn't automatically pull in any steps; the admin then opens
-- each relevant step and ticks the new garment into applies_to.

CREATE TABLE IF NOT EXISTS mtm_garments (
  slug          TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 100,
  active        BOOLEAN NOT NULL DEFAULT true,
  -- Seasonal commissions can carry a quiet note ("Autumn / Winter only")
  -- that surfaces on the Design Yours tile + admin row.
  season_note   TEXT DEFAULT '',
  -- Suit / jacket carry the three-tier Essentials / Signature / Bespoke
  -- picker; shirt / trouser bypass it (per brief). New garments default
  -- to no tiers so they read like the shirt flow.
  has_tiers     BOOLEAN NOT NULL DEFAULT false,
  -- Optional override for the Design Yours tile imagery + eyebrow label.
  -- Blank = use the static fallback from DesignYoursPicker.tsx.
  tile_image    TEXT DEFAULT '',
  tile_eyebrow  TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mtm_garments_active_position_idx
  ON mtm_garments (active, position);

-- Read is public (the storefront needs the list); writes are admin-only.
ALTER TABLE mtm_garments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS garments_read_all ON mtm_garments;
CREATE POLICY garments_read_all ON mtm_garments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS garments_admin_write ON mtm_garments;
CREATE POLICY garments_admin_write ON mtm_garments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mtm_admins a
    WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mtm_admins a
    WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- Seed the four garments the storefront already supports, in the order
-- the customer currently sees them on the Design Yours landing page.
INSERT INTO mtm_garments (slug, label, position, has_tiers, tile_eyebrow) VALUES
  ('suit',    'Suit',    10, true,  'Two-piece commission'),
  ('jacket',  'Jacket',  20, true,  'Standalone'),
  ('shirt',   'Shirt',   30, false, 'Shirting'),
  ('trouser', 'Trouser', 40, false, 'Tailored')
ON CONFLICT (slug) DO NOTHING;
