import type { CellLineId, CompoundId, OrganelleId, PathwayId, SourceId } from "@/lib/types";

/** One of the three headline numbers in the Problem section. */
export interface MetricCopy {
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
  label: string;
  source: string;
  href?: string;
}

export interface OrganelleCopy {
  name: string;
  tagline: string;
  /** What the organelle does and why it matters for screening. */
  role: string;
  /** How it maps onto the Recon3D model. */
  model: string;
}

/**
 * Every string on the page. English is the reference; ru.ts and kk.ts must satisfy this interface,
 * so a missing key is a compile error instead of a blank spot on the page.
 *
 * `{name}` placeholders are filled by `interpolate()`.
 */
export interface Dictionary {
  meta: { title: string; description: string; ogLocale: string };
  a11y: {
    skip: string;
    language: string;
    menu: string;
    mainNav: string;
    scrollDown: string;
  };
  nav: {
    problem: string;
    cell: string;
    how: string;
    demo: string;
    science: string;
    cta: string;
  };
  hero: {
    /** Words wrapped in [[double brackets]] get the accent colour. */
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
    cellLabel: string;
  };
  problem: {
    title: string;
    lead: string;
    sourceLabel: string;
    metrics: [MetricCopy, MetricCopy, MetricCopy];
  };
  cell: {
    title: string;
    lead: string;
    body: string;
    factsSource: string;
    facts: { value: string; label: string }[];
    controls: {
      hint: string;
      zoomIn: string;
      zoomOut: string;
      reset: string;
      list: string;
      canvas: string;
    };
    panel: { roleLabel: string; modelLabel: string; emptyTitle: string; emptyText: string };
    organelles: Record<OrganelleId, OrganelleCopy>;
  };
  how: {
    title: string;
    lead: string;
    /** Uses {current} and {total}. */
    progress: string;
    steps: { title: string; text: string }[];
  };
  demo: {
    title: string;
    lead: string;
    notice: string;
    form: {
      cellLine: string;
      compound: string;
      presets: string;
      custom: string;
      smiles: string;
      smilesHelp: string;
      smilesPlaceholder: string;
      run: string;
      running: string;
      cancel: string;
    };
    empty: { title: string; text: string };
    loading: { label: string; stages: string[] };
    error: {
      title: string;
      network: string;
      /** Uses {status}. */
      server: string;
      badResponse: string;
      unknown: string;
      retry: string;
    };
    validation: { required: string; tooLong: string; invalidChars: string; unbalanced: string };
    result: {
      title: string;
      growth: string;
      growthNote: string;
      confidence: string;
      topPathways: string;
      chart: string;
      chartAxis: string;
      decreased: string;
      increased: string;
      badge: string;
      model: string;
      runtime: string;
      seconds: string;
      customCompound: string;
      verifyTitle: string;
      verifyText: string;
      verifyCompound: string;
      verifyCompoundCustom: string;
      verifyCellLine: string;
      verifyMethod: string;
      disclaimer: string;
    };
    cellLines: Record<CellLineId, string>;
    compounds: Record<CompoundId, { name: string; mechanism: string }>;
    pathways: Record<PathwayId, string>;
  };
  science: {
    title: string;
    lead: string;
    metricsTitle: string;
    metrics: { correlation: string; cellLines: string; compounds: string };
    sourcesTitle: string;
    sourcesLead: string;
    sources: Record<SourceId, { name: string; role: string }>;
    /** Uses {name}. */
    openSource: string;
    limitsTitle: string;
    limitsText: string;
  };
  footer: {
    tagline: string;
    github: string;
    docs: string;
    contact: string;
    openSource: string;
    /** Uses {year}. */
    rights: string;
    backToTop: string;
  };
}
