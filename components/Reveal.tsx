"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span" | "li" | "section";
};

/**
 * Fade + rise entrance. Triggers on mount rather than scroll because the
 * scroll-based IntersectionObserver approach silently failed for any
 * element that was already in the viewport at hydration time (deep links,
 * hard reloads mid-page, sections below the fold that became visible
 * before the observer attached). The result: whole sections of the page
 * stuck at opacity:0. A simple mount-triggered fade is reliable across
 * all entry conditions and the visual difference is minor — most reveals
 * are above the first scroll anyway.
 */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const Tag = motion[as] as typeof motion.div;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y }}
      animate={reduce || mounted ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: 1.05,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word reveal — each word slides up from below a clipping mask.
 * Same mount-triggered approach as Reveal.
 */
export function SplitReveal({
  text,
  className,
  delay = 0,
  staggerWord = 0.05,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerWord?: number;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.span
      initial="hidden"
      animate={reduce || mounted ? "visible" : "hidden"}
      transition={{ staggerChildren: reduce ? 0 : staggerWord, delayChildren: delay }}
      className={`inline ${className ?? ""}`}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden pb-[0.24em] -mb-[0.24em] align-bottom"
        >
          <motion.span
            variants={{
              hidden: { y: "130%", opacity: 0 },
              visible: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block pr-[0.27em]"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
