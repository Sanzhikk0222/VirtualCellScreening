import { animate, useInView } from "framer-motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatNumber } from "@/i18n/format";
import { useReduced } from "@/hooks/useMedia";
import { EASE_OUT_EXPO } from "@/lib/cn";

interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Seconds. */
  duration?: number;
}

/**
 * Number that counts up the first time it scrolls into view.
 * The animated text is written straight to the DOM, so counting never re-renders React.
 * Assistive technology reads the final value from a hidden twin, not the changing digits.
 */
export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 1.9,
}: CounterProps) {
  const { locale } = useI18n();
  const reduced = useReduced();
  const textRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(textRef, { once: true, margin: "0px 0px -15% 0px" });
  const played = useRef(false);

  const render = (n: number) => `${prefix}${formatNumber(locale, n, decimals)}${suffix}`;
  const finalText = render(value);

  // Paint the starting text before the first frame so the number never flashes empty.
  useLayoutEffect(() => {
    const node = textRef.current;
    if (!node) return;
    node.textContent = reduced || played.current ? finalText : render(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, reduced, finalText]);

  useEffect(() => {
    const node = textRef.current;
    if (!node || !inView || reduced || played.current) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (n) => {
        node.textContent = render(n);
      },
      onComplete: () => {
        // Marked only when the count finishes: StrictMode runs this effect twice in development,
        // and the second run must be allowed to start the animation again.
        played.current = true;
        node.textContent = finalText;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, value, duration, finalText]);

  return (
    <span className={className}>
      <span ref={textRef} aria-hidden="true" className="tabular-nums" />
      <span className="sr-only">{finalText}</span>
    </span>
  );
}
