import { MotionConfig } from "framer-motion";
import { AnimatedBackground } from "@/components/background/AnimatedBackground";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { Demo } from "@/components/sections/Demo";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Problem } from "@/components/sections/Problem";
import { Science } from "@/components/sections/Science";
import { VirtualCell } from "@/components/sections/VirtualCell";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Page shell. Layers, bottom to top:
 *   1. AnimatedBackground  fixed, z-0, behind everything
 *   2. page content        relative, z-10 (nav, sections, footer)
 *   3. skip link           fixed, z-100, visible only while focused
 */
export default function App() {
  const { t } = useI18n();

  return (
    // "user": Framer Motion drops transform animations when the system asks for reduced motion.
    // Components also check useReduced() themselves for everything that is not a transform.
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-aqua-400 focus:px-5 focus:py-3 focus:font-semibold focus:text-ink-950"
      >
        {t.a11y.skip}
      </a>

      <AnimatedBackground />

      <div className="relative z-10">
        <Nav />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <Problem />
          <VirtualCell />
          <HowItWorks />
          <Demo />
          <Science />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
