import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  /** Icon shown after the label. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type AnchorProps = BaseProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof BaseProps | "href"
  >;
type NativeButtonProps = BaseProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof BaseProps
  >;

const BASE =
  "group relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium " +
  "whitespace-nowrap select-none transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 " +
  "motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-aqua-400 text-ink-950 font-semibold hover:bg-aqua-300 " +
    "hover:shadow-[0_0_36px_-4px_rgb(63_217_200/0.7)]",
  secondary:
    "glass text-fg hover:border-line-strong hover:bg-white/10 hover:shadow-[0_0_30px_-8px_rgb(91_157_255/0.6)]",
  ghost: "text-fg-muted hover:text-fg hover:bg-white/5",
};

const SIZES: Record<Size, string> = {
  md: "px-5 text-sm",
  lg: "px-7 py-3 text-base",
};

/** Pill button. Renders an <a> when given an href and a <button> otherwise. */
export function Button(props: AnchorProps | NativeButtonProps) {
  const { variant = "primary", size = "md", icon, className, children, ...rest } = props;
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  const content = (
    <>
      <span>{children}</span>
      {icon ? (
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        >
          {icon}
        </span>
      ) : null}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<AnchorProps, keyof BaseProps>;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }

  const { type = "button", ...buttonRest } = rest as Omit<NativeButtonProps, keyof BaseProps>;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
