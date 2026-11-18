import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Activity, Cpu, Dna, FlaskConical } from "lucide-react";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Section, SectionHeading } from "@/components/ui/Section";
import { useReduced } from "@/hooks/useMedia";
import { interpolate } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CellLineIllustration,
  CompoundIllustration,
  ResultIllustration,
  SimulationIllustration,
} from "./StepIllustrations";

const STEP_VISUALS = [
  { icon: Dna, Illustration: CellLineIllustration },
  { icon: FlaskConical, Illustration: CompoundIllustration },
  { icon: Cpu, Illustration: SimulationIllustration },
  { icon: Activity, Illustration: ResultIllustration },
] as const;

/** One step: icon, title, text and its drawing. */
function StepBody({ index, total, active }: { index: number; total: number; active: boolean }) {
  const { t } = useI18n();
  const step = t.how.steps[index]!;
  const { icon: Icon, Illustration } = STEP_VISUALS[index]!;

  return (
    <div className="mx-auto grid w-full max-w-7xl items-center gap-6 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-6 lg:col-span-5">
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ scale: active ? 1 : 0.88, rotate: active ? 0 : -12 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="glass grid size-12 place-items-center rounded-2xl text-aqua-300"
          >
            <Icon aria-hidden="true" className="size-6" />
          </motion.span>
          <span className="text-sm text-fg-muted">
            {interpolate(t.how.progress, { current: index + 1, total })}
          </span>
        </div>
        <h3 className="mt-5 font-display text-[clamp(1.9rem,3.8vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          {step.title}
        </h3>
        <p className="mt-4 max-w-md text-lg text-fg-muted">{step.text}</p>
      </div>
      <div className="md:col-span-6 lg:col-span-7">
        <GlassCard className="h-[16.5rem] p-5 sm:h-[20rem] sm:p-8">
          <Illustration active={active} />
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * Scroll positions as (progress, step) pairs: each step rests for the first 45% of its share of
 * the scroll, then slides to the next. The last step rests until the section unpins.
 */
function buildStops(total: number): { input: number[]; output: number[] } {
  const share = 1 / total;
  const input: number[] = [];
  const output: number[] = [];
  for (let i = 0; i < total; i += 1) {
    input.push(i * share);
    output.push(i);
    if (i < total - 1) {
      input.push(i * share + share * 0.45);
      output.push(i);
    }
  }
  input.push(1);
  output.push(total - 1);
  return { input, output };
}

/** The pinned version: the page stops scrolling sideways content into view, one step at a time. */
function Pinned() {
  const { t } = useI18n();
  const total = t.how.steps.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const stops = buildStops(total);
  const stepPosition = useTransform(scrollYProgress, stops.input, stops.output);
  const x = useTransform(stepPosition, (value) => `${-value * (100 / total)}%`);

  useMotionValueEvent(stepPosition, "change", (value) => setActive(Math.round(value)));

  return (
    <section id="how" aria-labelledby="how-title" className="relative">
      <div ref={trackRef} style={{ height: `${total * 100}svh` }}>
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-24 md:pt-28">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <h2
              id="how-title"
              className="max-w-3xl font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em]"
            >
              {t.how.title}
            </h2>
            <p className="mt-2 hidden max-w-2xl text-fg-muted md:block">{t.how.lead}</p>
            <div className="mt-5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full origin-left bg-aqua-400"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
          </div>

          <motion.div style={{ x, width: `${total * 100}%` }} className="flex min-h-0 flex-1">
            {t.how.steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="flex shrink-0 items-center px-5 sm:px-8"
                style={{ width: `${100 / total}%` }}
                animate={{
                  opacity: active === index ? 1 : 0.25,
                  scale: active === index ? 1 : 0.97,
                }}
                transition={{ duration: 0.5 }}
              >
                <StepBody index={index} total={total} active={active === index} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Reduced motion: no pinning and no sideways travel, just the four steps in a column. */
function Stacked() {
  const { t } = useI18n();
  const total = t.how.steps.length;
  return (
    <Section id="how">
      <SectionHeading id="how-title" title={t.how.title} lead={t.how.lead} />
      <ol className="mt-14 flex flex-col gap-14">
        {t.how.steps.map((step, index) => (
          <li key={step.title} className="border-t border-line pt-10">
            <StepBody index={index} total={total} active />
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function HowItWorks() {
  return useReduced() ? <Stacked /> : <Pinned />;
}
