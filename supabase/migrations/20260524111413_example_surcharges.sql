-- One-time example surcharges so pricing is visible. Runs once (migration
-- history), so it won't override prices the admin edits later in /admin.
update public.mtm_options set surcharge = 60  where step_slug = 'lapel'          and value in ('peak', 'peak-slim');
update public.mtm_options set surcharge = 40  where step_slug = 'ticket'         and value = 'with';
update public.mtm_options set surcharge = 90  where step_slug = 'stitching'      and value = 'with';
update public.mtm_options set surcharge = 80  where step_slug = 'lining-fancy'   and value in ('paisley', 'botanical', 'foulard', 'medallion');
update public.mtm_options set surcharge = 30  where step_slug = 'sleeve-buttons' and value in ('four', 'four-stacked');
update public.mtm_options set surcharge = 250 where step_slug = 'add-waistcoat'  and value = 'yes';
update public.mtm_options set surcharge = 150 where step_slug = 'canvas'         and value = 'full';
