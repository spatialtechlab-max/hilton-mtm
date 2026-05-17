export function Marquee({
  items,
  speed = "normal",
  separator = "✦",
}: {
  items: string[];
  speed?: "normal" | "slow";
  separator?: string;
}) {
  const animation = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center text-display text-[clamp(3rem,8vw,8rem)] leading-none px-8">
          {t}
          <span className="px-8 opacity-30 text-[0.5em] -translate-y-2">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden">
      <div className={`flex w-max ${animation} will-change-transform`}>
        {row}
        {row}
      </div>
    </div>
  );
}
