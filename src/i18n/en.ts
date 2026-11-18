import type { Dictionary } from "./dictionary";

export const en: Dictionary = {
  meta: {
    title: "Virtual Cell Screening: drug screening on a virtual cell",
    description:
      "Pick a cell line and a compound, run a genome-scale metabolic model of that cell, and see the predicted growth inhibition and the pathways behind it.",
    ogLocale: "en_US",
  },
  a11y: {
    skip: "Skip to content",
    language: "Language",
    menu: "Menu",
    mainNav: "Main navigation",
    scrollDown: "Scroll to the next section",
  },
  nav: {
    problem: "Problem",
    cell: "Virtual cell",
    how: "How it works",
    demo: "Demo",
    science: "Science",
    cta: "Try the demo",
  },
  hero: {
    title: "Screen compounds on a [[virtual cell]] before you touch a pipette.",
    subtitle:
      "Choose a cell line and a compound. We run a genome-scale metabolic model of that cell and return the predicted growth inhibition and the pathways that carry it.",
    ctaPrimary: "Try the demo",
    ctaSecondary: "Read the science",
    scroll: "Scroll",
    cellLabel:
      "3D model of a human cell with a nucleus, mitochondria, endoplasmic reticulum, Golgi apparatus and ribosomes",
  },
  problem: {
    title: "Most drug candidates fail, and the bill arrives late.",
    lead: "A molecule often shows it does not work only after years of development. Screening in silico moves part of that verdict to the start.",
    sourceLabel: "Source",
    metrics: [
      {
        value: 90,
        decimals: 0,
        prefix: "",
        suffix: "%",
        label: "of drug candidates that enter clinical trials never reach approval",
        source: "Sun et al., Acta Pharmaceutica Sinica B, 2022",
        href: "https://pubmed.ncbi.nlm.nih.gov/35865092/",
      },
      {
        value: 2.6,
        decimals: 1,
        prefix: "$",
        suffix: "B",
        label: "average cost of bringing one new drug to market, failures included",
        source: "DiMasi et al., Journal of Health Economics, 2016 (2013 dollars)",
        href: "https://econpapers.repec.org/RePEc:eee:jhecon:v:47:y:2016:i:c:p:20-33",
      },
      {
        value: 12,
        decimals: 0,
        prefix: "",
        suffix: " years",
        label: "from the first discovery work to a drug on the market",
        source: "Commonly cited range: 10 to 15 years",
      },
    ],
  },
  cell: {
    title: "A cell you can interrogate",
    lead: "The virtual cell is a genome-scale metabolic model laid over a 3D cell. Each organelle maps to a compartment of the model, so you can see where a compound acts.",
    body: "Recon3D describes human metabolism as a network of reactions grouped by compartment. We tune that network to the chosen cell line with its expression profile, throttle the reactions a compound targets, and let the solver find the best growth the cell can still reach. The drop against the untreated cell is the predicted growth inhibition.",
    factsSource: "Recon3D, Brunk et al., Nature Biotechnology, 2018",
    facts: [
      { value: "13,543", label: "reactions" },
      { value: "4,140", label: "unique metabolites" },
      { value: "3,288", label: "genes (ORFs)" },
    ],
    controls: {
      hint: "Drag to rotate. Click an organelle to zoom in. Click the cell once, then scroll to zoom.",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      reset: "Reset view",
      list: "Organelles",
      canvas: "Interactive 3D model of a cell. The organelle buttons give keyboard access.",
    },
    panel: {
      roleLabel: "Role in screening",
      modelLabel: "In the Recon3D model",
      emptyTitle: "Pick an organelle",
      emptyText:
        "Click a part of the cell, or use the buttons, to see what it does and how it appears in the model.",
    },
    organelles: {
      membrane: {
        name: "Plasma membrane",
        tagline: "Gatekeeper",
        role: "Controls what enters the cell. Nutrient uptake and compound transport set the conditions the rest of the cell works under.",
        model:
          "Extracellular boundary (compartment e). Exchange and transport reactions fix which nutrients the cell can take up.",
      },
      nucleus: {
        name: "Nucleus",
        tagline: "Genome and nucleotides",
        role: "Holds the genome and drives nucleotide supply. Antimetabolite drugs starve DNA replication from here.",
        model:
          "Compartment n. Nuclear reactions of nucleotide metabolism; the expression profile of the cell line decides which enzymes are active.",
      },
      mitochondria: {
        name: "Mitochondria",
        tagline: "Energy and building blocks",
        role: "Run the citric acid cycle and oxidative phosphorylation. Many cancer lines depend on them for building blocks, not only for energy.",
        model:
          "Compartment m. Citric acid cycle, oxidative phosphorylation and fatty acid oxidation. A respiratory-chain inhibitor shows up here first.",
      },
      er: {
        name: "Endoplasmic reticulum",
        tagline: "Lipids and sterols",
        role: "Makes lipids and sterols. Cholesterol synthesis, the target of statins, runs through it.",
        model: "Compartment r. Sterol and lipid biosynthesis, plus precursors for glycosylation.",
      },
      golgi: {
        name: "Golgi apparatus",
        tagline: "Sorting and modification",
        role: "Modifies and sorts what the endoplasmic reticulum produces, including glycans and sphingolipids.",
        model: "Compartment g. Glycan and sphingolipid processing reactions.",
      },
      ribosomes: {
        name: "Ribosomes",
        tagline: "Protein synthesis",
        role: "Build proteins. In a metabolic model protein synthesis shows up as a demand for amino acids, so a starved pathway ends up as slower growth.",
        model:
          "No compartment of their own. Protein synthesis enters through the biomass reaction, which drains amino acids.",
      },
    },
  },
  how: {
    title: "From a cell line to a prediction in four steps",
    lead: "The same four steps run on every request, whether it comes from this page or from the API.",
    progress: "Step {current} of {total}",
    steps: [
      {
        title: "Choose a cell line",
        text: "MDA-MB-231, HepG2 or HeLa. Each line gets its own copy of the metabolic model, tuned to its expression profile.",
      },
      {
        title: "Select a compound",
        text: "Pick a preset or paste a SMILES string. Known targets come from ChEMBL and are mapped to reactions in the model.",
      },
      {
        title: "Run the simulation",
        text: "COBRApy throttles the targeted reactions, and flux balance analysis finds the best growth the cell can still reach.",
      },
      {
        title: "Interpret the result",
        text: "You get the predicted growth inhibition against the untreated cell, the three pathways that changed most, and a confidence value.",
      },
    ],
  },
  demo: {
    title: "Run a screening",
    lead: "This form follows the contract of the screening API. Until the backend is connected, the numbers are generated in your browser.",
    notice:
      "Demo mode. Results are synthetic and show the output format. They are not predictions of the real model.",
    form: {
      cellLine: "Cell line",
      compound: "Compound",
      presets: "Presets",
      custom: "Custom SMILES",
      smiles: "SMILES string",
      smilesHelp: "Paste the structure of your own compound.",
      smilesPlaceholder: "CC(=O)OC1=CC=CC=C1C(=O)O",
      run: "Run screening",
      running: "Running",
      cancel: "Cancel",
    },
    empty: {
      title: "No run yet",
      text: "Choose a cell line and a compound, then press Run screening. The predicted growth inhibition, the three most affected pathways and a chart will appear here.",
    },
    loading: {
      label: "Screening in progress",
      stages: [
        "Loading the Recon3D model",
        "Applying expression constraints",
        "Mapping compound targets",
        "Solving flux balance analysis",
        "Ranking affected pathways",
      ],
    },
    error: {
      title: "The screening did not finish",
      network: "Could not reach the screening service. Check your connection and try again.",
      server: "The service returned an error ({status}). Try again in a moment.",
      badResponse: "The service answered in a format this page does not recognise.",
      unknown: "Something went wrong.",
      retry: "Try again",
    },
    validation: {
      required: "Enter a SMILES string or choose a preset.",
      tooLong: "The SMILES string is longer than 300 characters.",
      invalidChars: "The string contains characters that are not valid in SMILES.",
      unbalanced: "Brackets or parentheses do not match.",
    },
    result: {
      title: "Screening result",
      growth: "Predicted growth inhibition",
      growthNote: "against the untreated cell",
      confidence: "Model confidence",
      topPathways: "Most affected pathways",
      chart: "Flux change by pathway",
      chartAxis: "Change in flux, %",
      decreased: "Flux decreased",
      increased: "Flux increased",
      badge: "Synthetic demo data",
      model: "Model",
      runtime: "Run time",
      seconds: "s",
      customCompound: "Custom structure",
      disclaimer:
        "Predictions are hypotheses for choosing experiments. They do not replace wet-lab testing.",
    },
    cellLines: {
      "MDA-MB-231": "Breast, triple-negative",
      HepG2: "Liver",
      HeLa: "Cervix",
    },
    compounds: {
      methotrexate: {
        name: "Methotrexate",
        mechanism: "Blocks DHFR, so folate-dependent nucleotide synthesis stalls.",
      },
      fluorouracil: {
        name: "5-Fluorouracil",
        mechanism: "Blocks thymidylate synthase (TYMS), a bottleneck in DNA building.",
      },
      metformin: {
        name: "Metformin",
        mechanism: "Inhibits complex I of the mitochondrial respiratory chain.",
      },
      atorvastatin: {
        name: "Atorvastatin",
        mechanism:
          "Inhibits HMG-CoA reductase (HMGCR), the first committed step of cholesterol synthesis.",
      },
      hydroxyurea: {
        name: "Hydroxyurea",
        mechanism: "Inhibits ribonucleotide reductase (RRM1, RRM2), which makes DNA precursors.",
      },
    },
    pathways: {
      folate: "Folate metabolism",
      pyrimidine: "Pyrimidine synthesis",
      purine: "Purine synthesis",
      nucleotide: "Nucleotide interconversion",
      cholesterol: "Cholesterol synthesis",
      oxphos: "Oxidative phosphorylation",
      tca: "Citric acid cycle",
      glycolysis: "Glycolysis",
      glutamine: "Glutamine metabolism",
      fao: "Fatty acid oxidation",
      ppp: "Pentose phosphate pathway",
      sphingolipid: "Sphingolipid metabolism",
    },
  },
  science: {
    title: "Checked against real cell-line data",
    lead: "Predicted effects are compared with measurements for the same cell lines in DepMap, the Broad Institute's map of cancer dependencies and drug sensitivities.",
    metricsTitle: "Validation results",
    metrics: {
      correlation: "Correlation with DepMap",
      cellLines: "Cell lines compared",
      compounds: "Compounds compared",
    },
    sourcesTitle: "Built on open data and tools",
    sourcesLead: "Every component is public, so the pipeline can be inspected and rerun.",
    sources: {
      cobrapy: {
        name: "COBRApy",
        role: "Constraint-based modelling in Python. Runs the flux balance analysis.",
      },
      recon3d: {
        name: "Recon3D",
        role: "The human metabolic reconstruction the virtual cell is built on.",
      },
      cellxgene: {
        name: "CELLxGENE",
        role: "Single-cell expression data that tunes the model to each cell line.",
      },
      chembl: {
        name: "ChEMBL",
        role: "Bioactivity database that links compounds to their protein targets.",
      },
      depmap: {
        name: "DepMap",
        role: "Cancer dependency and drug-response data used for validation.",
      },
    },
    openSource: "Open {name}",
    limitsTitle: "What it does not do",
    limitsText:
      "The model covers metabolism only. It does not predict toxicity, off-target binding or effects that travel through signalling. Treat a result as a reason to run an experiment, not as a replacement for one.",
  },
  footer: {
    tagline: "Virtual drug screening on a metabolic model of the cell.",
    github: "GitHub",
    docs: "Documentation",
    contact: "Contact",
    openSource: "Built on open-source software and public data.",
    rights: "© {year} Virtual Cell Screening",
    backToTop: "Back to top",
  },
};
