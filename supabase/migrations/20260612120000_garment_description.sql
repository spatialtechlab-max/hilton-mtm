-- Per-garment editorial description shown on the storefront library
-- hero (e.g. "Two- and three-piece commissions cut from the mills we
-- trust..." on /library/suits). Separate from season_note (the small
-- "Winter" / "Autumn" tag) so the atelier can rewrite the long copy
-- without touching the season label.

alter table mtm_garments
  add column if not exists description text;
