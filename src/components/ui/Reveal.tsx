import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReduced } from "@/hooks/useMedia";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";

export type RevealDirection = "up" | "left" | "right" | "scale" | "fade";

const HIDDEN: Record<RevealDirection, { x?: number; y?: number; scale?: number }> = {
  up: { y: 36 },
  left: { x: -56 },
  right: { x: 56 },
  scale: { scale: 0.92 },
  fade: {},
};

const TAGS = {
  div: motion.div,
  li: motion.li,
  p: motion.p,
  article: motion.article,
  section: motion.section,
} as const;

interface RevealProps {
  children: ReactNode;
  /** Where the content comes from. Vary it down the page so the motion does not feel stamped out. */
  direction?: RevealDirection;
  /** Seconds. Pass index * 0.08 to stagger a row of items. */
  delay?: number;
  duration?: number;
  as?: keyof typeof TAGS;
  className?: string;
}

/**
 * Scroll reveal: the element fades in from the given direction the first time it enters the viewport.
 * With reduced motion it renders as a plain element, fully visible, with no animation at all.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.9,
  as = "div",
  className,
}: RevealProps) {
  const reduced = useReduced();

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...HIDDEN[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration, delay, ease: EASE_OUT_EXPO },
    },
  };

  const Tag = TAGS[as];
  return (
    <Tag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </Tag>
  );
}
