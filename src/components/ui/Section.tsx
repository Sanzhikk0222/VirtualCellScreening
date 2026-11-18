import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Pass false when the section builds its own width (full-bleed layouts). */
  contained?: boolean;
}

/** Page section: anchor target, consistent vertical rhythm, content centred at 80rem. */
export function Section({ id, children, className, contained = true }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("relative px-5 py-24 sm:px-8 md:py-32", className)}
    >
      {contained ? <div className="mx-auto max-w-7xl">{children}</div> : children}
    </section>
  );
}

interface SectionHeadingProps {
  /** The h2 gets this id; the section points at it with aria-labelledby. */
  id: string;
  title: string;
  lead?: string;
  className?: string;
}

export function SectionHeading({ id, title, lead, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <Reveal>
        <h2
          id={id}
          className="font-display text-[clamp(2rem,4.6vw,3.75rem)] leading-[1.06] font-semibold tracking-[-0.03em]"
        >
          {title}
        </h2>
      </Reveal>
      {lead ? (
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg text-fg-muted md:text-xl">{lead}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
