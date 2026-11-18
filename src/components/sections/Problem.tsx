import { ArrowUpRight } from "lucide-react";
import { Counter } from "@/components/ui/Counter";
import { Reveal, type RevealDirection } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import type { MetricCopy } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

interface MetricProps {
  metric: MetricCopy;
  sourceLabel: string;
  /** "xl" is the dominant number; "md" the two supporting ones. */
  size: "xl" | "md";
}

function Metric({ metric, sourceLabel, size }: MetricProps) {
  return (
    <div className="border-t border-line-strong pt-6">
      <Counter
        value={metric.value}
        decimals={metric.decimals}
        prefix={metric.prefix}
        suffix={metric.suffix}
        className={cn(
          "block font-display leading-none font-semibold tracking-[-0.045em]",
          size === "xl"
            ? "text-[clamp(5.5rem,17vw,13.5rem)]"
            : "text-[clamp(3.25rem,6.6vw,5.5rem)]",
        )}
      />
      <p className="mt-5 max-w-md text-lg text-fg">{metric.label}</p>
      <p className="mt-3 text-sm text-fg-muted">
        {sourceLabel}:{" "}
        {metric.href ? (
          <a
            href={metric.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-white/25 underline-offset-4 transition-colors hover:text-fg hover:decoration-aqua-400"
          >
            {metric.source}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        ) : (
          metric.source
        )}
      </p>
    </div>
  );
}

const SUPPORT_DIRECTIONS: RevealDirection[] = ["left", "right"];

/** Three numbers, one dominant: asymmetric on purpose, so the first one lands hardest. */
export function Problem() {
  const { t } = useI18n();
  const [lead, ...support] = t.problem.metrics;

  return (
    <Section id="problem">
      <SectionHeading id="problem-title" title={t.problem.title} lead={t.problem.lead} />

      <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-10">
        <Reveal direction="scale" className="lg:col-span-7">
          <Metric metric={lead} sourceLabel={t.problem.sourceLabel} size="xl" />
        </Reveal>

        <div className="flex flex-col gap-14 lg:col-span-5 lg:gap-16 lg:pt-20">
          {support.map((metric, index) => (
            <Reveal
              key={metric.label}
              direction={SUPPORT_DIRECTIONS[index] ?? "up"}
              delay={0.15 + index * 0.14}
            >
              <Metric metric={metric} sourceLabel={t.problem.sourceLabel} size="md" />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
