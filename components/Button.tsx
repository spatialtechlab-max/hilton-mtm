import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

type Variant = "solid" | "outline" | "ghost" | "ivory";

const styles: Record<Variant, string> = {
  solid:
    "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-800)]",
  outline:
    "border border-[var(--color-charcoal-900)]/30 text-[var(--color-charcoal-900)] hover:bg-[var(--color-charcoal-900)] hover:text-[var(--color-ivory-100)] hover:border-[var(--color-charcoal-900)]",
  ghost:
    "text-[var(--color-charcoal-900)] hover:text-[var(--color-burgundy-700)]",
  ivory:
    "bg-[var(--color-ivory-100)] text-[var(--color-charcoal-900)] hover:bg-[var(--color-ivory-200)]",
};

export function Button({
  href,
  children,
  variant = "solid",
  className = "",
  showArrow = true,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  showArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 text-eyebrow px-7 py-4 transition-colors duration-300 ${styles[variant]} ${className}`}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </Link>
  );
}
