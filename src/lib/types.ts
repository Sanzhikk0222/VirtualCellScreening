/** Shared domain types and id lists. Ids are stable keys; display text comes from the i18n dictionaries. */

export const CELL_LINES = ["MDA-MB-231", "HepG2", "HeLa"] as const;
export type CellLineId = (typeof CELL_LINES)[number];

export const COMPOUND_IDS = [
  "methotrexate",
  "fluorouracil",
  "metformin",
  "atorvastatin",
  "hydroxyurea",
] as const;
export type CompoundId = (typeof COMPOUND_IDS)[number];

export const PATHWAY_IDS = [
  "folate",
  "pyrimidine",
  "purine",
  "nucleotide",
  "cholesterol",
  "oxphos",
  "tca",
  "glycolysis",
  "glutamine",
  "fao",
  "ppp",
  "sphingolipid",
] as const;
export type PathwayId = (typeof PATHWAY_IDS)[number];

export const ORGANELLE_IDS = [
  "membrane",
  "nucleus",
  "mitochondria",
  "er",
  "golgi",
  "ribosomes",
] as const;
export type OrganelleId = (typeof ORGANELLE_IDS)[number];

export const SOURCE_IDS = ["cobrapy", "recon3d", "cellxgene", "chembl", "depmap"] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

/** Body of POST /api/screen. */
export interface ScreeningRequest {
  cellLine: CellLineId;
  smiles: string;
  /** Set when the compound was picked from the preset list. */
  compoundId?: CompoundId;
}

export interface PathwayEffect {
  /** Pathway id. Known ids are translated; unknown ones fall back to `name`. */
  id: string;
  /** English name as returned by the backend. */
  name: string;
  /** Change in flux through the pathway, in percent. Negative means the flux dropped. */
  deltaFlux: number;
}

/** Response of POST /api/screen. */
export interface ScreeningResult {
  requestId: string;
  cellLine: CellLineId;
  compound: { smiles: string; compoundId?: CompoundId };
  /** Predicted growth inhibition against the untreated cell, 0 to 100. */
  growthInhibitionPct: number;
  /** Model confidence, 0 to 1. */
  confidence: number;
  /** The three pathways with the largest absolute change, strongest first. */
  topPathways: PathwayEffect[];
  /** Wider pathway profile used by the chart, strongest first. */
  profile: PathwayEffect[];
  model: { name: string; version: string };
  runtimeMs: number;
  /** True when the numbers were generated in the browser and not by the model. */
  synthetic: boolean;
}
