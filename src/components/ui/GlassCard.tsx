import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle lift on hover. Use it for cards that are interactive, not for static panels. */
  lift?: boolean;
}

/** Frosted-glass surface (backdrop blur over the animated background). */
export function GlassCard({ lift = false, className, children, ...rest }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-3xl",
        lift &&
          "transition-[transform,border-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:border-line-strong",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
