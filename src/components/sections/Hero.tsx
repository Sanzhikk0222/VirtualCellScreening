import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { lazy, Suspense, useRef, type PointerEvent } from "react";
import { CellFallback } from "@/components/cell/CellFallback";
import { SceneBoundary } from "@/components/cell/SceneBoundary";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SplitWords } from "@/components/ui/SplitWords";
import { useFinePointer, useReduced } from "@/hooks/useMedia";
import { useIdleMount } from "@/hooks/useIdleMount";
import { useI18n } from "@/i18n/I18nProvider";

// three.js loads in its own chunk, after the text has painted.
const CellScene = lazy(() => import("@/components/cell/CellScene"));

export function Hero() {
  const { t } = useI18n();
  const reduced = useReduced();
  const finePointer = useFinePointer();
  const sectionRef = useRef<HTMLElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const idle = useIdleMount();
  const cellVisible = useInView(cellRef, { margin: "120px" });

  // Parallax: the cell drifts down and shrinks a little as the hero scrolls away.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const cellY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const cellScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  // Cursor spotlight: motion values update the gradient without re-rendering React.
  const spotlightOn = finePointer && !reduced;
  const pointerX = useMotionValue(-600);
  const pointerY = useMotionValue(-600);
  const spotlight = useMotionTemplate`radial-gradient(460px circle at ${pointerX}px ${pointerY}px, rgb(63 217 200 / 0.12), transparent 70%)`;
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - box.left);
    pointerY.set(event.clientY - box.top);
  };

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative min-h-svh"
      onPointerMove={spotlightOn ? onPointerMove : undefined}
    >
      {spotlightOn && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
        />
      )}

      <div className="relative mx-auto grid min-h-svh max-w-7xl items-center gap-6 px-5 pt-28 pb-28 sm:px-8 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-7">
          <SplitWords
            text={t.hero.title}
            as="h1"
            className="font-display text-[clamp(2.3rem,4.9vw,4.5rem)] leading-[1.04] font-semibold tracking-[-0.035em]"
          />
          <Reveal delay={0.55}>
            <p className="mt-7 max-w-xl text-lg text-fg-muted md:text-xl">{t.hero.subtitle}</p>
          </Reveal>
          <Reveal delay={0.7}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="#demo" size="lg" icon={<ArrowRight className="size-[1.1em]" />}>
                {t.hero.ctaPrimary}
              </Button>
              <Button href="#science" size="lg" variant="secondary">
                {t.hero.ctaSecondary}
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal direction="scale" delay={0.3} duration={1.3} className="lg:col-span-5">
          <motion.div
            ref={cellRef}
            role="img"
            aria-label={t.hero.cellLabel}
            style={reduced ? undefined : { y: cellY, scale: cellScale }}
            className="relative mx-auto aspect-square w-full max-w-[34rem] lg:-mr-12 lg:max-w-none"
          >
            <div
              aria-hidden="true"
              className="absolute inset-[8%] rounded-full bg-azure-500/20 blur-3xl"
            />
            <div className="relative size-full">
              <SceneBoundary fallback={<CellFallback />}>
                {idle ? (
                  <Suspense fallback={<CellFallback />}>
                    <CellScene variant="hero" paused={!cellVisible} />
                  </Suspense>
                ) : (
                  <CellFallback />
                )}
              </SceneBoundary>
            </div>
          </motion.div>
        </Reveal>
      </div>

      <a
        href="#problem"
        aria-label={t.a11y.scrollDown}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 rounded-full px-4 py-2 text-xs tracking-[0.18em] text-fg-muted uppercase transition-colors hover:text-fg"
      >
        <span>{t.hero.scroll}</span>
        <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-0 animate-scroll-cue bg-aqua-400" />
        </span>
      </a>
    </section>
  );
}
