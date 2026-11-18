import { Check, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

interface LoadingStateProps {
  /** 0 to 100. */
  progress: number;
  /** Index of the pipeline stage that is running now. */
  stage: number;
}

/** Shown while a screening runs: progress bar, the pipeline stages, and a skeleton of the result. */
export function LoadingState({ progress, stage }: LoadingStateProps) {
  const { t } = useI18n();
  const { label, stages } = t.demo.loading;
  const percent = Math.round(progress);

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl font-semibold tracking-tight">{label}</h3>
        <span aria-hidden="true" className="text-fg-muted tabular-nums">
          {percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-azure-400 to-aqua-400 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* The text of the current stage changes often, so it is not a live region. */}
      <ol className="mt-6 flex flex-col gap-2.5">
        {stages.map((text, index) => {
          const done = index < stage || progress >= 100;
          const current = index === stage && !done;
          return (
            <li
              key={text}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors duration-300",
                current ? "font-medium text-fg" : "text-fg-muted",
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
                {done ? (
                  <Check className="size-4 text-aqua-400" />
                ) : current ? (
                  <Loader2 className="size-4 animate-spin text-aqua-400" />
                ) : (
                  <span className="size-1.5 rounded-full bg-white/25" />
                )}
              </span>
              {text}
            </li>
          );
        })}
      </ol>

      {/* Skeleton of the result card, so the layout does not jump when it arrives. */}
      <div aria-hidden="true" className="mt-8 grid gap-4 border-t border-line pt-8 md:grid-cols-5">
        <div className="skeleton h-28 rounded-2xl md:col-span-3" />
        <div className="skeleton h-28 rounded-2xl md:col-span-2" />
        <div className="skeleton h-14 rounded-2xl md:col-span-5" />
        <div className="skeleton h-14 rounded-2xl md:col-span-5" />
      </div>
    </GlassCard>
  );
}
