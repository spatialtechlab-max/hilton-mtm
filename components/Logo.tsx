import Image from "next/image";
import Link from "next/link";

type Variant = "full" | "compact";

/**
 * The full Hilton Made to Measure lockup (architectural M + wordmark + tagline).
 * - `compact`  : sized for the navigation bar
 * - `full`     : sized for hero / footer placements
 * - `tone`     : `burgundy` on light surfaces, `ivory` on dark
 */
export function Logo({
  variant = "compact",
  tone = "burgundy",
  href = "/",
  className = "",
}: {
  variant?: Variant;
  tone?: "burgundy" | "ivory";
  href?: string | null;
  className?: string;
}) {
  const src = tone === "burgundy" ? "/logo-burgundy.png" : "/logo-ivory.png";

  // intrinsic image is 479 × 404 (≈ 6:5)
  const sizes = {
    compact: { w: 56, h: 47, displayClass: "h-12 w-auto md:h-14" },
    full:    { w: 200, h: 169, displayClass: "h-32 w-auto md:h-40" },
  } as const;

  const { w, h, displayClass } = sizes[variant];

  const img = (
    <Image
      src={src}
      alt="Hilton Made to Measure"
      width={w * 3}   // upscale for retina
      height={h * 3}
      priority
      className={`${displayClass} object-contain select-none ${className}`}
      draggable={false}
    />
  );

  if (href === null) return img;
  return (
    <Link href={href} aria-label="Hilton Made to Measure Home" className="inline-block">
      {img}
    </Link>
  );
}
