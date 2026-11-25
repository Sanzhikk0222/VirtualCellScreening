import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpRight, FlaskConical } from "lucide-react";
import { lazy, Suspense } from "react";
import { SceneBoundary } from "@/components/cell/SceneBoundary";
import { Counter } from "@/components/ui/Counter";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { EASE_OUT_EXPO } from "@/lib/cn";
import { CELL_LINE_REFERENCES, compoundReferenceUrl, METHOD_URL } from "@/lib/references";
import type { ScreeningResult } from "@/lib/types";
import {
  DECREASE_COLOR,
  deltaColor,
  formatDelta,
  INCREASE_COLOR,
  pathwayLabel,
} from "./resultFormat";

// Recharts is only downloaded once a result exists.
const ResultChart = lazy(() => import("./ResultChart"));

/** The answer of one screening: growth inhibition, confidence, top pathways and the flux chart. */
export function ResultCard({ result }: { result: ScreeningResult }) {
  const { t, locale } = useI18n();
  const r = t.demo.result;

  const compoundId = result.compound.compoundId;
  const compoundName = compoundId ? t.demo.compounds[compoundId].name : r.customCompound;
  const growth = Math.round(result.growthInhibitionPct);
  const confidence = Math.round(result.confidence * 100);
  const strongest = Math.max(1, ...result.topPathways.map((item) => Math.abs(item.deltaFlux)));

  return (
    <GlassCard className="p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold tracking-tight">{r.title}</h3>
          <p className="mt-1 text-sm text-fg-muted">
            {compoundName} · {result.cellLine} · {t.demo.cellLines[result.cellLine]}
          </p>
        </div>
        {result.synthetic ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-coral-400/40 bg-coral-400/10 px-3 py-1.5 text-xs font-medium text-fg">
            <FlaskConical aria-hidden="true" className="size-3.5 text-coral-400" />
            {r.badge}
          </span>
        ) : null}
      </header>
      {!compoundId ? (
        <code
          title={result.compound.smiles}
          className="mt-3 block truncate rounded-lg bg-black/20 px-3 py-1.5 font-mono text-xs text-fg-muted"
        >
          {result.compound.smiles}
        </code>
      ) : null}

      {/* Headline numbers: one dominant, one supporting */}
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <p className="text-sm text-fg-muted">{r.growth}</p>
          <p className="mt-1 font-display leading-none font-semibold tracking-[-0.04em]">
            <Counter
              value={growth}
              suffix="%"
              duration={1.3}
              className="text-[clamp(4rem,9vw,6.5rem)]"
            />
          </p>
          <p className="mt-2 text-sm text-fg-muted">{r.growthNote}</p>
          <div aria-hidden="true" className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full origin-left rounded-full bg-linear-to-r from-azure-400 to-aqua-400"
              style={{ width: `${Math.min(100, Math.max(0, growth))}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white/[0.03] p-5 md:col-span-2">
          <p className="text-sm text-fg-muted">{r.confidence}</p>
          <p className="mt-1 font-display text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {confidence}%
          </p>
          <div aria-hidden="true" className="mt-4 flex gap-1">
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${index < Math.round(confidence / 10) ? "bg-aqua-400" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top pathways */}
      <section className="mt-10" aria-labelledby="top-pathways-title">
        <h4 id="top-pathways-title" className="text-sm font-medium text-fg-muted">
          {r.topPathways}
        </h4>
        <ol className="mt-3 flex flex-col gap-3">
          {result.topPathways.map((item, index) => {
            const decreased = item.deltaFlux < 0;
            const Arrow = decreased ? ArrowDown : ArrowUp;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: EASE_OUT_EXPO }}
                className="rounded-2xl border border-line bg-white/[0.03] px-4 py-3.5"
              >
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="font-mono text-sm text-fg-muted tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{pathwayLabel(t, item)}</span>
                  <span className="inline-flex items-center gap-1.5 font-display text-lg font-semibold tabular-nums">
                    <Arrow
                      aria-hidden="true"
                      className="size-4"
                      style={{ color: deltaColor(item.deltaFlux) }}
                    />
                    <span className="sr-only">{decreased ? r.decreased : r.increased}: </span>
                    {formatDelta(locale, item.deltaFlux)}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
                >
                  <motion.div
                    className="h-full origin-left rounded-full"
                    style={{
                      width: `${(Math.abs(item.deltaFlux) / strongest) * 100}%`,
                      background: deltaColor(item.deltaFlux),
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.9, ease: EASE_OUT_EXPO }}
                  />
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {/* Chart */}
      <section className="mt-10" aria-labelledby="flux-chart-title">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h4 id="flux-chart-title" className="text-sm font-medium text-fg-muted">
            {r.chart}
          </h4>
          <ul aria-hidden="true" className="flex items-center gap-5 text-xs text-fg-muted">
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px]" style={{ background: DECREASE_COLOR }} />
              {r.decreased}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px]" style={{ background: INCREASE_COLOR }} />
              {r.increased}
            </li>
          </ul>
        </div>
        <div className="mt-4">
          {/* If the chart chunk fails to load, the three pathways above still carry the result. */}
          <SceneBoundary fallback={null}>
            <Suspense fallback={<div aria-hidden="true" className="skeleton h-72 rounded-2xl" />}>
              <ResultChart profile={result.profile} />
            </Suspense>
          </SceneBoundary>
        </div>
      </section>

      {/* Where to check the result */}
      <section
        aria-labelledby="verify-title"
        className="mt-10 rounded-2xl border border-line bg-white/[0.03] p-5 md:p-6"
      >
        <h4 id="verify-title" className="font-medium">
          {r.verifyTitle}
        </h4>
        <p className="mt-1.5 text-sm text-fg-muted">{r.verifyText}</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li>
            <a
              href={compoundReferenceUrl(compoundId, result.compound.smiles)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-aqua-300 underline-offset-4 hover:underline"
            >
              {compoundId ? r.verifyCompound : r.verifyCompoundCustom}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </li>
          <li>
            <a
              href={CELL_LINE_REFERENCES[result.cellLine]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-aqua-300 underline-offset-4 hover:underline"
            >
              {r.verifyCellLine}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </li>
          <li>
            <a
              href={METHOD_URL}
              className="inline-flex min-h-11 items-center text-aqua-300 underline-offset-4 hover:underline"
            >
              {r.verifyMethod}
            </a>
          </li>
        </ul>
      </section>

      {/* Run details */}
      <footer className="mt-10 border-t border-line pt-6">
        <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-fg-muted">{r.model}</dt>
            <dd className="mt-0.5 font-medium">
              {result.model.name} · {result.model.version}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">{r.runtime}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {formatNumber(locale, result.runtimeMs / 1000, 1)} {r.seconds}
            </dd>
          </div>
        </dl>
        <p className="mt-5 max-w-xl text-sm text-fg-muted">{r.disclaimer}</p>
      </footer>
    </GlassCard>
  );
}
