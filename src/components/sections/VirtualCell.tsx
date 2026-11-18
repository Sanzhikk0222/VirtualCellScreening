import { AnimatePresence, motion, useInView } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { lazy, Suspense, useCallback, useRef, useState, type ReactNode } from "react";
import type { CellSceneHandle } from "@/components/cell/CellScene";
import { CellFallback } from "@/components/cell/CellFallback";
import { ORGANELLE_COLORS } from "@/components/cell/organelleColors";
import { SceneBoundary } from "@/components/cell/SceneBoundary";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { ORGANELLE_IDS, type OrganelleId } from "@/lib/types";

const CellScene = lazy(() => import("@/components/cell/CellScene"));

const ZOOM_STEP = 0.78;

/** Key section: an explorable 3D cell next to the text that maps it onto the Recon3D model. */
export function VirtualCell() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<OrganelleId | null>(null);
  const sceneRef = useRef<CellSceneHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Load the scene shortly before it scrolls into view; stop rendering when it leaves.
  const near = useInView(stageRef, { margin: "400px", once: true });
  const visible = useInView(stageRef, { margin: "80px" });

  const select = useCallback((id: OrganelleId | null) => setSelected(id), []);
  const toggle = (id: OrganelleId) => setSelected((current) => (current === id ? null : id));

  const info = selected ? t.cell.organelles[selected] : null;
  const controls = t.cell.controls;

  return (
    <Section id="cell">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Text column */}
        <div className="lg:col-span-5">
          <SectionHeading id="cell-title" title={t.cell.title} lead={t.cell.lead} />
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-xl text-fg-muted">{t.cell.body}</p>
          </Reveal>

          <Reveal delay={0.25} className="mt-10">
            <dl className="grid grid-cols-3 gap-4 border-t border-line-strong pt-6">
              {t.cell.facts.map((fact) => (
                <div key={fact.label}>
                  <dd className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-none font-semibold tracking-tight">
                    {fact.value}
                  </dd>
                  <dt className="mt-2 text-sm text-fg-muted">{fact.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-fg-muted">{t.cell.factsSource}</p>
          </Reveal>
        </div>

        {/* Explorer column */}
        <div className="lg:col-span-7">
          <Reveal direction="right">
            <div
              ref={stageRef}
              role="group"
              aria-label={controls.canvas}
              className="glass relative aspect-[5/4] w-full overflow-hidden rounded-[2rem] sm:aspect-[4/3]"
            >
              <div className="absolute inset-0">
                <SceneBoundary fallback={<CellFallback />}>
                  {near ? (
                    <Suspense fallback={<CellFallback />}>
                      <CellScene
                        ref={sceneRef}
                        variant="explorer"
                        selectedId={selected}
                        onSelect={select}
                        paused={!visible}
                      />
                    </Suspense>
                  ) : (
                    <CellFallback />
                  )}
                </SceneBoundary>
              </div>

              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <ViewButton
                  label={controls.zoomIn}
                  onClick={() => sceneRef.current?.zoomBy(ZOOM_STEP)}
                >
                  <Plus aria-hidden="true" className="size-5" />
                </ViewButton>
                <ViewButton
                  label={controls.zoomOut}
                  onClick={() => sceneRef.current?.zoomBy(1 / ZOOM_STEP)}
                >
                  <Minus aria-hidden="true" className="size-5" />
                </ViewButton>
                <ViewButton label={controls.reset} onClick={() => sceneRef.current?.resetView()}>
                  <RotateCcw aria-hidden="true" className="size-5" />
                </ViewButton>
              </div>

              <p className="pointer-events-none absolute right-16 bottom-3 left-5 text-xs text-fg-muted">
                {controls.hint}
              </p>
            </div>
          </Reveal>

          {/* Keyboard- and screen-reader-friendly twin of clicking the 3D model */}
          <Reveal delay={0.1}>
            <div role="group" aria-label={controls.list} className="mt-5 flex flex-wrap gap-2">
              {ORGANELLE_IDS.map((id) => {
                const active = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(id)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-sm transition-colors duration-200",
                      active
                        ? "border-white/30 bg-white/12 text-fg"
                        : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{
                        background: ORGANELLE_COLORS[id],
                        boxShadow: `0 0 12px ${ORGANELLE_COLORS[id]}`,
                      }}
                    />
                    {t.cell.organelles[id].name}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div aria-live="polite" className="glass mt-4 min-h-[14.5rem] rounded-3xl p-6 md:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {selected && info ? (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-full"
                      style={{
                        background: ORGANELLE_COLORS[selected],
                        boxShadow: `0 0 16px ${ORGANELLE_COLORS[selected]}`,
                      }}
                    />
                    <h3 className="font-display text-2xl font-semibold tracking-tight">
                      {info.name}
                    </h3>
                    <span className="text-sm text-fg-muted">{info.tagline}</span>
                  </div>
                  <dl className="mt-5 grid gap-6 md:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-aqua-300">
                        {t.cell.panel.roleLabel}
                      </dt>
                      <dd className="mt-1.5 text-fg-muted">{info.role}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-aqua-300">
                        {t.cell.panel.modelLabel}
                      </dt>
                      <dd className="mt-1.5 text-fg-muted">{info.model}</dd>
                    </div>
                  </dl>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {t.cell.panel.emptyTitle}
                  </h3>
                  <p className="mt-3 max-w-lg text-fg-muted">{t.cell.panel.emptyText}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ViewButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="glass inline-flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
    >
      {children}
    </button>
  );
}
