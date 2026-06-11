-- Per-garment ERP categoryName mapping. Stored on the garment row so a
-- new ERP category (e.g. "CHINO PANTS", "WAISTCOAT", "TUXEDO") auto-binds
-- to its garment slug via the sync job — no code edit needed when ERP
-- adds a category. The storefront library page reads this column to
-- filter ERP items, replacing the hardcoded ERP_CATEGORIES_FOR_SLUG map.

alter table mtm_garments
  add column if not exists erp_categories text[] not null default '{}';

-- Backfill known mappings so existing rows keep working with the new
-- code path. Anything not listed here stays empty until the next sync
-- (which will populate from the ERP categoryName).
update mtm_garments set erp_categories = array['SUITING','SUITINGS','SUITS','SUIES','SUIUS']
  where slug = 'suit' and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['JACKETING','JACKET','BLAZER','RTWJKT']
  where slug = 'jacket' and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['SHIRTING','SHIIRTING','SHIRTS']
  where slug = 'shirt' and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['PANTS']
  where slug = 'trouser' and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['CHINO PANTS']
  where slug in ('chino-pants', 'chinos') and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['OVERCOAT']
  where slug = 'overcoat' and (erp_categories is null or array_length(erp_categories,1) is null);
update mtm_garments set erp_categories = array['TUXEDO']
  where slug = 'tuxedo' and (erp_categories is null or array_length(erp_categories,1) is null);
