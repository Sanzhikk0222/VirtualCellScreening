import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, Microscope, RotateCcw } from "lucide-react";
import { useCallback, useRef } from "react";
import { LoadingState } from "@/components/demo/LoadingState";
import { ResultCard } from "@/components/demo/ResultCard";
import { ScreeningForm } from "@/components/demo/ScreeningForm";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { useScreening } from "@/hooks/useScreening";
import { useMediaQuery, useReduced } from "@/hooks/useMedia";
import { interpolate } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { API_MODE } from "@/lib/api";
import type { ScreeningError } from "@/lib/errors";
import type { ScreeningRequest } from "@/lib/types";

/** Live demo: the form on the left, the empty / loading / error / result panel on the right. */
export function Demo() {
  const { t } = useI18n();
  const reduced = useReduced();
  // Below lg the result panel sits under the form, so it is scrolled into view when a run starts.
  const stacked = useMediaQuery("(max-width: 1023px)");
  const { state, run, cancel } = useScreening(t.demo.loading.stages.length);
  const lastRequest = useRef<ScreeningRequest | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const submit = useCallback(
    (request: ScreeningRequest) => {
      lastRequest.current = request;
      void run(request);
      if (stacked) {
        panelRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    },
    [run, stacked, reduced],
  );

  const retry = useCallback(() => {
    if (lastRequest.current) submit(lastRequest.current);
  }, [submit]);

  const busy = state.status === "loading";

  // One short sentence for screen readers. The stage text changes too often to announce.
  const announcement =
    state.status === "loading"
      ? t.demo.loading.label
      : state.status === "success"
        ? `${t.demo.result.title}. ${t.demo.result.growth}: ${Math.round(state.result.growthInhibitionPct)}%`
        : "";

  return (
    <Section id="demo">
      <SectionHeading id="demo-title" title={t.demo.title} lead={t.demo.lead} />

      {API_MODE === "mock" ? (
        <Reveal delay={0.1}>
          <p className="mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3 text-sm text-fg-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-coral-400" />
            {t.demo.notice}
          </p>
        </Reveal>
      ) : null}

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <Reveal direction="left" className="lg:sticky lg:top-24 lg:col-span-5">
          <GlassCard className="p-6 md:p-8">
            <ScreeningForm busy={busy} onSubmit={submit} onCancel={cancel} />
          </GlassCard>
        </Reveal>

        <Reveal direction="right" delay={0.1} className="lg:col-span-7">
          <div ref={panelRef} aria-busy={busy} className="scroll-mt-24 lg:min-h-[34rem]">
            <p role="status" className="sr-only">
              {announcement}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={state.status === "success" ? state.result.requestId : state.status}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {state.status === "idle" && <EmptyState />}
                {state.status === "loading" && (
                  <LoadingState progress={state.progress} stage={state.stage} />
                )}
                {state.status === "success" && <ResultCard result={state.result} />}
                {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/** Before the first run: says what will appear, with a faint outline of the result. */
function EmptyState() {
  const { t } = useI18n();
  return (
    <GlassCard className="flex flex-col items-start gap-6 border-dashed p-6 md:p-10">
      <span className="grid size-14 place-items-center rounded-2xl border border-line bg-white/[0.04] text-aqua-300">
        <Microscope aria-hidden="true" className="size-7" />
      </span>
      <div>
        <h3 className="font-display text-2xl font-semibold tracking-tight">{t.demo.empty.title}</h3>
        <p className="mt-3 max-w-lg text-fg-muted">{t.demo.empty.text}</p>
      </div>
      <div aria-hidden="true" className="grid w-full gap-3 opacity-60 md:grid-cols-5">
        <div className="h-24 rounded-2xl border border-dashed border-line md:col-span-3" />
        <div className="h-24 rounded-2xl border border-dashed border-line md:col-span-2" />
        <div className="h-12 rounded-2xl border border-dashed border-line md:col-span-5" />
        <div className="h-12 rounded-2xl border border-dashed border-line md:col-span-5" />
      </div>
    </GlassCard>
  );
}

/** A failed run. The text depends on the kind of failure, never on the raw server message. */
function ErrorState({ error, onRetry }: { error: ScreeningError; onRetry: () => void }) {
  const { t } = useI18n();
  const e = t.demo.error;
  const message =
    error.kind === "network"
      ? e.network
      : error.kind === "server"
        ? interpolate(e.server, { status: error.status ?? "" })
        : error.kind === "badResponse"
          ? e.badResponse
          : e.unknown;

  return (
    <GlassCard
      role="alert"
      className="flex flex-col items-start gap-5 border-coral-400/40 p-6 md:p-10"
    >
      <span className="grid size-14 place-items-center rounded-2xl border border-coral-400/40 bg-coral-400/10 text-coral-400">
        <AlertCircle aria-hidden="true" className="size-7" />
      </span>
      <div>
        <h3 className="font-display text-2xl font-semibold tracking-tight">{e.title}</h3>
        <p className="mt-3 max-w-lg text-fg-muted">{message}</p>
      </div>
      <Button variant="secondary" onClick={onRetry} icon={<RotateCcw className="size-4" />}>
        {e.retry}
      </Button>
    </GlassCard>
  );
}
