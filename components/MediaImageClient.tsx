"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { fetchMediaSlot } from "@/lib/media";

/**
 * Client-side variant of MediaImage. Use this only when the parent
 * tree is "use client" and the server-side <MediaImage> can't be
 * imported (admin pages, the customizer landing picker, the booking
 * form, etc.). For server-rendered storefront pages prefer the
 * default server-component <MediaImage> — it has no flash because
 * the override URL is baked into SSR HTML.
 */
type MediaImageProps = Omit<ImageProps, "src" | "alt"> & {
  slot: string;
  fallback: string;
  fallbackAlt: string;
};

export function MediaImageClient({
  slot, fallback, fallbackAlt, ...rest
}: MediaImageProps) {
  const [src, setSrc] = useState<string>(fallback);
  const [alt, setAlt] = useState<string>(fallbackAlt);

  useEffect(() => {
    if (!slot) return;
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
