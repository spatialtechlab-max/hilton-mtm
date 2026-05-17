/**
 * SVG tie illustration — used in the Ties & Silks library where we don't
 * have product photography yet. Each tie is a vertical silhouette rendered
 * on a soft studio background, with configurable fabric colour and pattern.
 * Reads as an editorial product card rather than a missing image.
 */

type Pattern =
  | "solid"
  | "stripe-club"   // wide diagonal repp stripes
  | "stripe-fine"   // narrow even stripes
  | "dot"           // small repeating dots
  | "paisley"       // teardrop motif
  | "grenadine";    // hatched cross weave

type Props = {
  color: string;          // primary fabric colour
  accent?: string;        // pattern colour
  bg?: string;            // background tone
  pattern?: Pattern;
  className?: string;
};

export function TieIllustration({
  color,
  accent = "#f6f1ea",
  bg = "#f1ebe2",
  pattern = "solid",
  className = "",
}: Props) {
  const patternId = `tie-pat-${pattern}-${color.replace("#", "")}`;

  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`A ${pattern.replace("-", " ")} silk necktie`}
    >
      {/* studio background w/ subtle vignette */}
      <defs>
        <radialGradient id={`${patternId}-bg`} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={shade(bg, -10)} />
        </radialGradient>

        {/* light gradient on the tie body — gives silk sheen */}
        <linearGradient id={`${patternId}-sheen`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={shade(color, -8)} />
          <stop offset="45%" stopColor={shade(color, 8)} />
          <stop offset="55%" stopColor={shade(color, 12)} />
          <stop offset="100%" stopColor={shade(color, -12)} />
        </linearGradient>

        {patternDef(pattern, patternId, color, accent)}

        {/* tie silhouette clip */}
        <clipPath id={`${patternId}-clip`}>
          <path d={TIE_PATH} />
        </clipPath>
      </defs>

      <rect width="400" height="500" fill={`url(#${patternId}-bg)`} />

      {/* the tie */}
      <g clipPath={`url(#${patternId}-clip)`}>
        <path d={TIE_PATH} fill={`url(#${patternId}-sheen)`} />
        {pattern !== "solid" && (
          <rect width="400" height="500" fill={`url(#${patternId}-pattern)`} />
        )}
      </g>

      {/* knot shadow for depth */}
      <path d={KNOT_SHADE} fill="rgba(0,0,0,0.18)" clipPath={`url(#${patternId}-clip)`} />

      {/* subtle outline */}
      <path
        d={TIE_PATH}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
    </svg>
  );
}

/* ──────────── geometry ──────────── */

/** vertical tie silhouette — knot, neck band, blade, tip */
const TIE_PATH = `
  M 176 60
  L 224 60
  L 232 100
  L 220 130
  L 245 200
  L 260 380
  L 200 470
  L 140 380
  L 155 200
  L 180 130
  L 168 100
  Z
`;

/** soft shadow across the top of the knot — adds a sense of folded fabric */
const KNOT_SHADE = `
  M 176 60
  L 224 60
  L 232 100
  L 168 100
  Z
`;

/* ──────────── helpers ──────────── */

function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (num >> 16) + Math.round((255 * percent) / 100);
  let g = ((num >> 8) & 0xff) + Math.round((255 * percent) / 100);
  let b = (num & 0xff) + Math.round((255 * percent) / 100);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function patternDef(pattern: Pattern, id: string, color: string, accent: string) {
  const patId = `${id}-pattern`;
  switch (pattern) {
    case "stripe-club":
      return (
        <pattern id={patId} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="28" height="28" fill="transparent" />
          <rect width="10" height="28" fill={accent} opacity="0.85" />
          <rect x="13" width="2" height="28" fill={shade(color, -25)} opacity="0.6" />
        </pattern>
      );
    case "stripe-fine":
      return (
        <pattern id={patId} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="16" height="16" fill="transparent" />
          <rect width="2" height="16" fill={accent} opacity="0.65" />
        </pattern>
      );
    case "dot":
      return (
        <pattern id={patId} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="transparent" />
          <circle cx="9" cy="9" r="2.2" fill={accent} opacity="0.85" />
        </pattern>
      );
    case "paisley":
      return (
        <pattern id={patId} width="34" height="34" patternUnits="userSpaceOnUse">
          <rect width="34" height="34" fill="transparent" />
          <path
            d="M 8 17 C 8 9, 18 8, 22 14 C 26 20, 18 25, 14 22 M 14 22 C 12 25, 10 22, 11 19"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle cx="18" cy="14" r="1.5" fill={accent} opacity="0.7" />
        </pattern>
      );
    case "grenadine":
      return (
        <pattern id={patId} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="transparent" />
          <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke={shade(color, -20)} strokeWidth="0.8" opacity="0.7" />
        </pattern>
      );
    default:
      return <pattern id={patId} width="1" height="1" />;
  }
}
