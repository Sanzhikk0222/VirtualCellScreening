import { motion } from "framer-motion";
import { Fragment } from "react";
import { useReduced } from "@/hooks/useMedia";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { parseAccent, stripAccent } from "@/i18n/format";

interface SplitWordsProps {
  /** Words wrapped in [[double brackets]] get the accent colour. */
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
}

/**
 * Headline that rises into place word by word. Each word slides up from behind its own clip line.
 * Screen readers get the whole sentence through aria-label; the split spans are hidden from them.
 */
export function SplitWords({
  text,
  as: Tag = "h1",
  className,
  delay = 0.15,
  stagger = 0.07,
}: SplitWordsProps) {
  const reduced = useReduced();
  const words = parseAccent(text);

  return (
    <Tag aria-label={stripAccent(text)} className={className}>
      {words.map((item, index) => (
        <Fragment key={`${item.word}-${index}`}>
          <span
            aria-hidden="true"
            className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom"
          >
            <motion.span
              className={cn("inline-block", item.accent && "text-aqua-400")}
              initial={reduced ? false : { y: "115%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.95, delay: delay + index * stagger, ease: EASE_OUT_EXPO }}
            >
              {item.word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
