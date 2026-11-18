import { ArrowUpRight, Ban } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { validationMetrics, type ValidationMetricId } from "@/config/validation";
import { interpolate } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { SOURCE_IDS, type SourceId } from "@/lib/types";

/** Public home page of each data source or tool. Shown as text wordmarks, not as their logos. */
const SOURCE_LINKS: Record<SourceId, string> = {
  cobrapy: "https://opencobra.github.io/cobrapy/",
  // Brunk et al. 2018, Nature Biotechnology: the Recon3D paper.
  recon3d: "https://doi.org/10.1038/nbt.4072",
  cellxgene: "https://cellxgene.cziscience.com/",
  chembl: "https://www.ebi.ac.uk/chembl/",
  depmap: "https://depmap.org/portal/",
};

const METRIC_ORDER: ValidationMetricId[] = ["correlation", "cellLines", "compounds"];

/** Validation results (only the ones that were measured), the limits of the model, and the sources. */
export function Science() {
  const { t } = useI18n();
  const s = t.science;
  // A metric that was not filled in config/validation.ts is not shown at all.
  const metrics = METRIC_ORDER.filter((id) => validationMetrics[id]);
  const hasMetrics = metrics.length > 0;

  return (
    <Section id="science">
      <SectionHeading id="science-title" title={s.title} lead={s.lead} />

      <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-8">
        {hasMetrics ? (
          <Reveal direction="left" className="lg:col-span-7">
            <GlassCard className="h-full p-6 md:p-10">
              <h3 className="text-sm font-medium text-fg-muted">{s.metricsTitle}</h3>
              <dl className="mt-8 grid gap-10 sm:grid-cols-3">
                {metrics.map((id, index) => (
                  <div key={id} className={index === 0 ? "sm:col-span-3" : undefined}>
                    <dd
                      className={
                        index === 0
                          ? "font-display text-[clamp(4.5rem,10vw,8rem)] leading-none font-semibold tracking-[-0.045em]"
                          : "font-display text-[clamp(2.5rem,5vw,4rem)] leading-none font-semibold tracking-[-0.04em]"
                      }
                    >
                      {validationMetrics[id]}
                    </dd>
                    <dt className="mt-3 text-fg-muted">{s.metrics[id]}</dt>
                  </div>
                ))}
              </dl>
            </GlassCard>
          </Reveal>
        ) : null}

        <Reveal
          direction={hasMetrics ? "right" : "up"}
          delay={0.1}
          className={hasMetrics ? "lg:col-span-5" : "lg:col-span-12"}
        >
          <GlassCard className="h-full p-6 md:p-10">
            <div className={hasMetrics ? undefined : "grid gap-6 md:grid-cols-12 md:gap-10"}>
              <h3
                className={`flex items-center gap-3 font-display text-2xl font-semibold tracking-tight ${hasMetrics ? "" : "md:col-span-4"}`}
              >
                <Ban aria-hidden="true" className="size-5 shrink-0 text-coral-400" />
                {s.limitsTitle}
              </h3>
              <p className={`text-fg-muted ${hasMetrics ? "mt-5" : "md:col-span-8"}`}>
                {s.limitsText}
              </p>
            </div>
          </GlassCard>
        </Reveal>
      </div>

      {/* Sources: an editorial list instead of a row of logo cards */}
      <div className="mt-24 grid gap-10 lg:mt-32 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Reveal>
            <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-semibold tracking-[-0.03em]">
              {s.sourcesTitle}
            </h3>
            <p className="mt-4 max-w-sm text-fg-muted">{s.sourcesLead}</p>
          </Reveal>
        </div>

        <ul className="border-t border-line-strong lg:col-span-8">
          {SOURCE_IDS.map((id, index) => {
            const source = s.sources[id];
            return (
              <Reveal as="li" key={id} delay={index * 0.07} className="border-b border-line">
                <a
                  href={SOURCE_LINKS[id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid items-baseline gap-x-8 gap-y-2 py-6 transition-colors md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]"
                >
                  <span className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-aqua-300 md:text-3xl">
                    {source.name}
                  </span>
                  <span className="text-fg-muted">{source.role}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors group-hover:text-fg">
                    {interpolate(s.openSource, { name: source.name })}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
