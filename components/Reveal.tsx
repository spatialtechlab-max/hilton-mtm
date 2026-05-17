"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span" | "li" | "section";
};

export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // amount 0.05: trigger as soon as ~5% of the element enters the viewport.
      // 0.25 was too high for short / wide elements and meant fast scrolls
      // could blow past content before it ever animated in.
      viewport={{ once: true, amount: 0.05 }}
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
 * Word-by-word reveal. Each word slides up from below a clipping mask.
 *
 * The clip mask uses padding-bottom + negative margin-bottom so descenders
 * (g, j, p, q, y) have room to render *before* the mask closes around them.
 * The inner motion.span also fades in alongside the y translate, so partial
 * scroll positions never leak letter tops through the mask.
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
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
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
