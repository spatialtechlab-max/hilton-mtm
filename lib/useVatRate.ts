"use client";

import { useEffect, useState } from "react";
import { fetchAllSettings } from "./settings";
import { VAT_RATE, vatRateFromSettings } from "./checkoutFees";

/**
 * The current admin-set VAT rate as a fraction (e.g. 0.10 for 10%), read
 * from the public `mtm_settings` row `vat.rate`. Returns the registry
 * default until settings load (and on any error), so totals never flash to 0.
 * Used by every client surface that shows VAT — cart, order pages, the admin
 * order list/detail and the order modal — so they all agree on one rate.
 */
export function useVatRate(): number {
  const [rate, setRate] = useState<number>(VAT_RATE);
  useEffect(() => {
    let cancelled = false;
    fetchAllSettings()
      .then((s) => { if (!cancelled) setRate(vatRateFromSettings(s)); })
      .catch(() => { /* keep the default */ });
    return () => { cancelled = true; };
  }, []);
  return rate;
}
