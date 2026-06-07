"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { fetchMediaSlot } from "@/lib/media";

/**
 * Renders a hero / cover image whose source can be overridden by the
 * atelier via /admin/media. Falls back to the static `fallback`
 * (whatever the page used before) until the override loads. Designed
 * to be a drop-in replacement for <Image> everywhere a `slot` exists
 * in MEDIA_SLOTS.
 */
type MediaImageProps = Omit<ImageProps, "src" | "alt"> & {
  slot: string;
  fallback: string;
  fallbackAlt: string;
};

export function MediaImage({
  slot, fallback, fallbackAlt, ...rest
}: MediaImageProps) {
  const [src, setSrc] = useState<string>(fallback);
  const [alt, setAlt] = useState<string>(fallbackAlt);

  useEffect(() => {
    if (!slot) return; // no slot → static fallback only, skip the lookup.
    let cancelled = false;
    fetchMediaSlot(slot)
      .then((row) => {
        if (cancelled || !row?.url) return;
        setSrc(row.url);
        if (row.alt) setAlt(row.alt);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [slot]);

  return <Image src={src} alt={alt} {...rest} />;
}
