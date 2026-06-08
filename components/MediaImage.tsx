import Image, { type ImageProps } from "next/image";
import { fetchMediaSlotServer } from "@/lib/mediaServer";

/**
 * Server-rendered hero / cover image. Reads the atelier override for
 * `slot` from mtm_media at request time (with 60s ISR) so the HTML
 * ships with the correct URL — no flash of the static fallback while
 * the client hydrates.
 *
 * For pages that MUST be client components (admin previews, the
 * customizer landing picker, the booking form) import the equivalent
 * <MediaImageClient> instead.
 */
type MediaImageProps = Omit<ImageProps, "src" | "alt"> & {
  slot: string;
  fallback: string;
  fallbackAlt: string;
};

export async function MediaImage({
  slot, fallback, fallbackAlt, ...rest
}: MediaImageProps) {
  let src = fallback;
  let alt = fallbackAlt;
  if (slot) {
    const row = await fetchMediaSlotServer(slot);
    if (row?.url) {
      src = row.url;
      if (row.alt) alt = row.alt;
    }
  }
  return <Image src={src} alt={alt} {...rest} />;
}
